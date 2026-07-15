import { NextResponse } from 'next/server';
import { TaskRepository } from '@/lib/tasks/repository';

const MOCK_USER_ID = 'usr-mock-001';

const repository = new TaskRepository();

export async function GET() {
  try {
    const tasks = await repository.getTasksForUser(MOCK_USER_ID);
    return NextResponse.json(tasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load tasks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
