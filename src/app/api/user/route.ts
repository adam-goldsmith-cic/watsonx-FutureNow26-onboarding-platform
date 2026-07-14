import { NextResponse } from 'next/server';
import type { UserProfile } from '@/lib/api-types';

const MOCK_USER: UserProfile = {
  id: 'usr-mock-001',
  name: 'Alex Johnson',
  role: 'new_starter',
  startDate: '2026-07-14',
};

export async function GET() {
  return NextResponse.json(MOCK_USER);
}
