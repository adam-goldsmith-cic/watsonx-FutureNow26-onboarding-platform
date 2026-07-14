'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TaskState, TaskStatus } from '@/lib/api-types';

const STORAGE_KEY = 'ibm-onboarding-task-state';

export function useTaskState() {
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // 1. Load from BFF (seed state)
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const tasks: TaskState[] = await res.json();
          const bffMap: Record<string, TaskState> = {};
          tasks.forEach((t) => { bffMap[t.taskId] = t; });

          // 2. Merge with localStorage (client state wins)
          const stored = localStorage.getItem(STORAGE_KEY);
          const localMap: Record<string, TaskState> = stored ? JSON.parse(stored) : {};
          const merged = { ...bffMap, ...localMap };

          setTaskStates(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch {
        // If BFF is unavailable, fall back to localStorage only
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setTaskStates(JSON.parse(stored));
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      const completedAt = status === 'DONE' ? new Date().toISOString() : null;

      // Optimistic update
      setTaskStates((prev) => {
        const updated = {
          ...prev,
          [taskId]: { ...prev[taskId], taskId, status, completedAt },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      // Fire-and-forget BFF sync
      fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {
        // BFF sync failure is non-fatal in Phase 1; localStorage holds the truth
      });
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

  return { taskStates, loading, updateTaskStatus, cycleTaskStatus };
}
