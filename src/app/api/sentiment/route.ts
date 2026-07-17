import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { auth } from '@/auth';
import { SentimentRepository } from '@/lib/sentiment/repository';

const sentimentBodySchema = z.object({
  mood: z.enum(['overwhelmed', 'getting-there', 'good', 'excellent']),
  notes: z.string().optional(),
});

const repository = new SentimentRepository();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = sentimentBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mood, notes } = parsed.data;

    const entry = await repository.createSentimentEntry({
      entryId: randomUUID(),
      userId: session.user.id,
      mood,
      notes: notes ?? null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
