import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolveOrgConfig } from '@/lib/config';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'src', 'config', 'org-config.json');
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    const config = resolveOrgConfig(raw);
    return NextResponse.json(config);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
