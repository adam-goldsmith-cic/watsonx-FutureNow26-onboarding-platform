import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockTasks = [
  { userId: 'u1', taskId: 'task-1', status: 'NOT_STARTED', dueDate: '2026-08-01', completedAt: null, notes: null },
  { userId: 'u1', taskId: 'task-2', status: 'NOT_STARTED', dueDate: '2026-08-05', completedAt: null, notes: null },
];

function mockFetchGet(tasks = mockTasks) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => tasks,
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useTaskState', () => {
  it('initialises task states from BFF', async () => {
    vi.stubGlobal('fetch', mockFetchGet());

    const { useTaskState } = await import('@/hooks/useTaskState');
    const { result } = renderHook(() => useTaskState());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.taskStates['task-1'].status).toBe('NOT_STARTED');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('cycles status NOT_STARTED → IN_PROGRESS → DONE → NOT_STARTED', async () => {
    const patchedTask = { ...mockTasks[0], status: 'IN_PROGRESS', completedAt: null };

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })   // GET /api/tasks
      .mockResolvedValue({ ok: true, json: async () => patchedTask })     // PATCH calls
    );

    const { useTaskState } = await import('@/hooks/useTaskState');
    const { result } = renderHook(() => useTaskState());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => { result.current.cycleTaskStatus('task-1'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(result.current.taskStates['task-1'].status).toBe('IN_PROGRESS');

    const doneTask = { ...mockTasks[0], status: 'DONE', completedAt: '2026-08-01T00:00:00.000Z' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => doneTask }));

    await act(async () => { result.current.cycleTaskStatus('task-1'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(result.current.taskStates['task-1'].status).toBe('DONE');

    const resetTask = { ...mockTasks[0], status: 'NOT_STARTED', completedAt: null };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => resetTask }));

    await act(async () => { result.current.cycleTaskStatus('task-1'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(result.current.taskStates['task-1'].status).toBe('NOT_STARTED');
  });

  it('sets error when GET /api/tasks fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const { useTaskState } = await import('@/hooks/useTaskState');
    const { result } = renderHook(() => useTaskState());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.error).toBe('Failed to load tasks (500)');
    expect(result.current.loading).toBe(false);
    expect(Object.keys(result.current.taskStates)).toHaveLength(0);
  });

  it('sets error when GET /api/tasks throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    const { useTaskState } = await import('@/hooks/useTaskState');
    const { result } = renderHook(() => useTaskState());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.error).toBe('Failed to load tasks — network error');
    expect(result.current.loading).toBe(false);
  });

  it('sets error when PATCH fails and does not mutate state', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })  // GET
      .mockResolvedValueOnce({ ok: false, status: 404 })                  // PATCH
    );

    const { useTaskState } = await import('@/hooks/useTaskState');
    const { result } = renderHook(() => useTaskState());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => { result.current.cycleTaskStatus('task-1'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    expect(result.current.error).toBe('Failed to update task "task-1" (404)');
    // State is unchanged — no optimistic mutation
    expect(result.current.taskStates['task-1'].status).toBe('NOT_STARTED');
  });

  it('clears error on successful update after a previous failure', async () => {
    const updatedTask = { ...mockTasks[0], status: 'IN_PROGRESS', completedAt: null };

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })   // GET
      .mockResolvedValueOnce({ ok: false, status: 500 })                   // first PATCH fails
      .mockResolvedValueOnce({ ok: true, json: async () => updatedTask }) // second PATCH succeeds
    );

    const { useTaskState } = await import('@/hooks/useTaskState');
    const { result } = renderHook(() => useTaskState());

    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    // First cycle — PATCH fails
    await act(async () => { result.current.cycleTaskStatus('task-1'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(result.current.error).not.toBeNull();

    // Second cycle — PATCH succeeds
    await act(async () => { result.current.cycleTaskStatus('task-1'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(result.current.error).toBeNull();
    expect(result.current.taskStates['task-1'].status).toBe('IN_PROGRESS');
  });
});
