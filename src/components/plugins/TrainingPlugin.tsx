'use client';

import { useState } from 'react';
import type { TrainingConfig, TrainingCourse, TrainingStatus } from '@/plugins/schemas/training';
import { LearningModal } from '@/components/dashboard/LearningModal';

interface TrainingPluginProps {
  config: TrainingConfig;
}

const STATUS_STYLES: Record<TrainingStatus, { label: string; bg: string; fg: string }> = {
  'not-started': { label: 'Not Started', bg: 'bg-subtle',    fg: 'text-muted'    },
  'in-progress': { label: 'In Progress', bg: 'bg-amber-bg',  fg: 'text-amber'    },
  'completed':   { label: 'Completed',   bg: 'bg-green-bg',  fg: 'text-green'    },
  'overdue':     { label: 'Overdue',     bg: 'bg-red-bg',    fg: 'text-red'      },
};

const CATEGORY_BG: Record<string, string> = {
  SEC:   '#cf4a4a',
  COC:   '#7c5cd8',
  AI:    '#1f70c1',
  GDPR:  '#d97706',
  'IBM+':'#2d7a3e',
  ROLE:  '#c026a0',
};

export function TrainingPlugin({ config }: TrainingPluginProps) {
  const [selected, setSelected] = useState<TrainingCourse | null>(null);

  return (
    <>
      <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
        <h2 className="text-base font-bold mb-4 text-fg">{config.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.courses.map((course) => {
            const { label, bg, fg } = STATUS_STYLES[course.status];
            const accentHex = CATEGORY_BG[course.category] ?? '#57606a';
            return (
              <div
                key={course.id}
                className="rounded-xl border border-border p-4 flex flex-col gap-3 cursor-pointer hover:bg-ibm-blue-bg transition-colors"
                onClick={() => setSelected(course)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelected(course)}
                aria-label={`View details for ${course.title}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-extrabold px-2 py-1 rounded"
                    style={{ background: `${accentHex}18`, color: accentHex }}
                  >
                    {course.category}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${bg} ${fg}`}>
                    {label}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-tight text-fg">{course.title}</p>
                <div>
                  <div className="flex justify-between text-xs mb-1 text-muted">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-subtle">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${course.progress}%`,
                        background: course.status === 'completed' ? '#2d7a3e' : accentHex,
                      }}
                    />
                  </div>
                </div>
                {course.dueDate && course.status !== 'completed' && (
                  <p className="text-xs text-faint">
                    Due {new Date(course.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <LearningModal course={selected} onClose={() => setSelected(null)} />
    </>
  );
}
