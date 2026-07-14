import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolveOrgConfig } from '@/lib/config';
import type { TaskState, OrgPluginConfig } from '@/lib/api-types';
import type { ChecklistConfig } from '@/plugins/schemas/checklist';

const MOCK_USER_ID = 'usr-mock-001';
const MOCK_START_DATE = '2026-07-14';

function seedTasksFromConfig(): TaskState[] {
  const filePath = join(process.cwd(), 'src', 'config', 'org-config.json');
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const config = resolveOrgConfig(raw);

  const checklistEntry = config.find(
    (entry: OrgPluginConfig) => entry.pluginId === 'checklist'
  );
  if (!checklistEntry) return [];

  const checklistConfig = checklistEntry.config as ChecklistConfig;
  const startDate = new Date(MOCK_START_DATE);

  return checklistConfig.tasks.map((task) => {
    const dueDate = new Date(startDate);
    dueDate.setDate(startDate.getDate() + task.dueDayOffset);

    return {
      userId: MOCK_USER_ID,
      taskId: task.id,
      status: 'NOT_STARTED',
      dueDate: dueDate.toISOString().split('T')[0],
      completedAt: null,
      notes: null,
    };
  });
}

export async function GET() {
  try {
    const tasks = seedTasksFromConfig();
    return NextResponse.json(tasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load tasks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
