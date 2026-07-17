import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SlackRepository } from '@/lib/slack/repository';

const repository = new SlackRepository();

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const messages = await repository.getMessagesForUser(session.user.id);

    const grouped = {
      dm: messages.filter((m) => m.type === 'dm'),
      channel: messages.filter((m) => m.type === 'channel'),
      mention: messages.filter((m) => m.type === 'mention'),
    };

    return NextResponse.json({ messages, grouped });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load Slack messages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
