'use client';

import { useMemo } from 'react';
import type { ChecklistConfig } from '@/plugins/schemas/checklist';
import type { TaskState } from '@/lib/api-types';

interface ChecklistPluginProps {
  config: ChecklistConfig;
  taskStates: Record<string, TaskState>;
  startDate: string;
  onCycleTask: (taskId: string) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
  IT:   'bg-purple-bg text-purple',
  HR:   'bg-pink-bg text-pink',
  SEC:  'bg-red-bg text-red',
  MGR:  'bg-ibm-blue-bg text-ibm-blue',
  TEAM: 'bg-green-bg text-green',
};

const STATUS_ICONS: Record<string, string> = {
  NOT_STARTED: '○',
  IN_PROGRESS: '◐',
  DONE:        '●',
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'text-faint',
  IN_PROGRESS: 'text-amber',
  DONE:        'text-green',
};

export function ChecklistPlugin({ config, taskStates, startDate, onCycleTask }: ChecklistPluginProps) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const enriched = useMemo(() => {
    const start = new Date(startDate);
    return config.tasks.map((task) => {
      const dueDate = new Date(start);
      dueDate.setDate(start.getDate() + task.dueDayOffset);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      const state = taskStates[task.id];
      const status = state?.status ?? 'NOT_STARTED';
      const isOverdue = dueDateStr < today && status !== 'DONE';
      return { ...task, dueDateStr, status, isOverdue };
    });
  }, [config.tasks, taskStates, startDate, today]);

  const stats = useMemo(() => ({
    done:       enriched.filter((t) => t.status === 'DONE').length,
    inProgress: enriched.filter((t) => t.status === 'IN_PROGRESS').length,
    todo:       enriched.filter((t) => t.status === 'NOT_STARTED' && !t.isOverdue).length,
    overdue:    enriched.filter((t) => t.isOverdue).length,
  }), [enriched]);

  return (
    <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
      <h2 className="text-base font-bold mb-1 text-fg">{config.title}</h2>
      <p className="text-sm mb-4 text-muted">
        Click a task to cycle its status: Not Started → In Progress → Done
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Completed', value: stats.done,       fg: 'text-green',    bg: 'bg-green-bg'    },
          { label: 'In Progress', value: stats.inProgress, fg: 'text-amber',    bg: 'bg-amber-bg'    },
          { label: 'To Do',     value: stats.todo,       fg: 'text-ibm-blue', bg: 'bg-ibm-blue-bg' },
          { label: 'Overdue',   value: stats.overdue,    fg: 'text-red',      bg: 'bg-red-bg'      },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg p-3 text-center ${s.bg}`}>
            <p className={`text-2xl font-extrabold ${s.fg}`}>{s.value}</p>
            <p className={`text-xs font-medium mt-0.5 ${s.fg}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Task list */}
      <ul className="divide-y divide-border">
        {enriched.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 py-3 cursor-pointer hover:bg-surface rounded px-2 -mx-2 transition-colors"
            onClick={() => onCycleTask(task.id)}
            title={`Click to cycle status (currently: ${task.status})`}
          >
            <span className={`text-xl leading-none select-none ${STATUS_COLORS[task.status]}`}>
              {STATUS_ICONS[task.status]}
            </span>
            <span className={`flex-1 text-sm ${task.status === 'DONE' ? 'line-through text-faint' : 'text-fg'}`}>
              {task.label}
              {task.mandatory && <span className="ml-1 text-xs text-red">*</span>}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${CATEGORY_STYLES[task.category] ?? 'bg-subtle text-muted'}`}>
              {task.category}
            </span>
            <span className={`text-xs ${task.isOverdue ? 'text-red font-semibold' : 'text-faint'}`}>
              {task.isOverdue ? 'Overdue' : `Day +${task.dueDayOffset}`}
            </span>
            {task.link && (
              <a
                href={task.link.url}
                className="text-xs font-medium text-ibm-blue"
                onClick={(e) => e.stopPropagation()}
              >
                {task.link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs mt-3 text-faint">* Mandatory task</p>
    </div>
  );
}
