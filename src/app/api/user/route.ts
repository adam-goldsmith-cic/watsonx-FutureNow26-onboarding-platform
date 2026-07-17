import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { UserProfile } from '@/lib/api-types';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user: UserProfile = {
    id: session.user.id,
    name: session.user.name ?? 'New Starter',
    role: session.user.role,
  };

  return NextResponse.json(user);
}
