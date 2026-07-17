import { NextResponse } from 'next/server';
import { OrgChartRepository } from '@/lib/org-chart/repository';

const repository = new OrgChartRepository();

export async function GET() {
  try {
    const nodes = await repository.getAllNodes();
    return NextResponse.json(nodes);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load org chart';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
