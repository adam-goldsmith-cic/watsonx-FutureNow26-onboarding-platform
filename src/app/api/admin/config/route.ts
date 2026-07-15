import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveOrgConfig } from '@/lib/config';
import { ConfigRepository } from '@/lib/config/repository';

const repository = new ConfigRepository();

const updateEntrySchema = z.object({
  pluginId: z.string(),
  enabled: z.boolean(),
  order: z.number().int().nonnegative(),
  config: z.unknown(),
});

export async function GET() {
  try {
    const raw = await repository.getAllPlugins();
    const config = resolveOrgConfig(raw);
    return NextResponse.json(config);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = z.array(updateEntrySchema).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid config shape', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Validate each plugin's config against its schema
    resolveOrgConfig(parsed.data);

    await repository.putAllPlugins(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
