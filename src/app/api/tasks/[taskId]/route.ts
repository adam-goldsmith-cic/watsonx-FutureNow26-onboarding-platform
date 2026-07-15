import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TaskRepository } from '@/lib/tasks/repository';

const patchBodySchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']),
  notes: z.string().optional(),
});

const repository = new TaskRepository();

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

    const updated = await repository.updateTask(taskId, {
      status,
      completedAt,
      notes: notes ?? null,
    });

    if (updated === null) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      taskId: updated.taskId,
      status: updated.status,
      completedAt: updated.completedAt,
      notes: updated.notes,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
