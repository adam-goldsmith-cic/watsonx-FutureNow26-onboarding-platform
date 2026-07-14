import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { TaskState, TaskStatus } from '@/lib/api-types';

const patchBodySchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const parsed = patchBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, notes } = parsed.data;
    const completedAt = status === 'DONE' ? new Date().toISOString() : null;

    // In Phase 1 the BFF is stateless — the client (localStorage) owns state.
    // We return the updated task shape so the client can merge it.
    const updated: Partial<TaskState> & { taskId: string; status: TaskStatus } = {
      taskId,
      status,
      completedAt,
      notes: notes ?? null,
    };

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
