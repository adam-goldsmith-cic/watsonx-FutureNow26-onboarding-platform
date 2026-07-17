import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { TaskRepository } from '@/lib/tasks/repository';

const repository = new TaskRepository();

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tasks = await repository.getTasksForUser(session.user.id);
    return NextResponse.json(tasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load tasks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
