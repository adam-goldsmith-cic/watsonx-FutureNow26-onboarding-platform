'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TaskState, TaskStatus } from '@/lib/api-types';

export function useTaskState() {
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) {
          setError(`Failed to load tasks (${res.status})`);
          return;
        }
        const tasks: TaskState[] = await res.json();
        const taskMap: Record<string, TaskState> = {};
        tasks.forEach((t) => { taskMap[t.taskId] = t; });
        setTaskStates(taskMap);
        setError(null);
      } catch {
        setError('Failed to load tasks — network error');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      const completedAt = status === 'DONE' ? new Date().toISOString() : null;

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (!res.ok) {
          setError(`Failed to update task "${taskId}" (${res.status})`);
          return;
        }

        const updated: TaskState = await res.json();
        setTaskStates((prev) => ({ ...prev, [taskId]: { ...prev[taskId], ...updated } }));
        setError(null);
      } catch {
        setError(`Failed to update task "${taskId}" — network error`);
        // No state mutation on failure — DynamoDB is the source of truth
      }
    },
    []
  );

  const cycleTaskStatus = useCallback(
    (taskId: string) => {
      const current = taskStates[taskId]?.status ?? 'NOT_STARTED';
      const next: TaskStatus =
        current === 'NOT_STARTED'
          ? 'IN_PROGRESS'
          : current === 'IN_PROGRESS'
          ? 'DONE'
          : 'NOT_STARTED';
      updateTaskStatus(taskId, next);
    },
    [taskStates, updateTaskStatus]
  );

  return { taskStates, loading, error, updateTaskStatus, cycleTaskStatus };
}
