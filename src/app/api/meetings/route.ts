import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MeetingRepository } from '@/lib/meetings/repository';

const repository = new MeetingRepository();

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const meetings = await repository.getMeetingsForUser(session.user.id);
    return NextResponse.json(meetings);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load meetings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
