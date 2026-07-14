import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock fetch globally
const mockTasks = [
  { userId: 'u1', taskId: 'task-1', status: 'NOT_STARTED', dueDate: '2026-08-01', completedAt: null, notes: null },
  { userId: 'u1', taskId: 'task-2', status: 'NOT_STARTED', dueDate: '2026-08-05', completedAt: null, notes: null },
];

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useTaskState', () => {
  it('initialises task states from BFF', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTasks,
    }));

    const { useTaskState } = await import('@/hooks/useTaskState');
    const { result } = renderHook(() => useTaskState());

    // Wait for async init
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.taskStates['task-1'].status).toBe('NOT_STARTED');
    expect(result.current.loading).toBe(false);
  });

  it('cycles status NOT_STARTED → IN_PROGRESS → DONE → NOT_STARTED', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTasks,
    }));

    const { useTaskState } = await import('@/hooks/useTaskState');
    const { result } = renderHook(() => useTaskState());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => { result.current.cycleTaskStatus('task-1'); });
    expect(result.current.taskStates['task-1'].status).toBe('IN_PROGRESS');

    await act(async () => { result.current.cycleTaskStatus('task-1'); });
    expect(result.current.taskStates['task-1'].status).toBe('DONE');

    await act(async () => { result.current.cycleTaskStatus('task-1'); });
    expect(result.current.taskStates['task-1'].status).toBe('NOT_STARTED');
  });

  it('persists state to localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTasks,
    }));

    const { useTaskState } = await import('@/hooks/useTaskState');
    const { result } = renderHook(() => useTaskState());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => { result.current.cycleTaskStatus('task-1'); });

    const stored = JSON.parse(localStorage.getItem('ibm-onboarding-task-state') ?? '{}');
    expect(stored['task-1'].status).toBe('IN_PROGRESS');
  });
});
