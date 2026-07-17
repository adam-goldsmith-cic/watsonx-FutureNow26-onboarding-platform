#!/usr/bin/env tsx
/**
 * Seed tasks for a user into the onboarding-tasks DynamoDB table.
 *
 * Usage:
 *   npm run seed-tasks -- --userId usr-mock-001
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { resolveOrgConfig } from '../src/lib/config';
import { TaskRepository } from '../src/lib/tasks/repository';
import { addDays } from '../src/lib/tasks/date-utils';
import type { ChecklistConfig } from '../src/plugins/schemas/checklist';
import type { ResolvedPluginEntry } from '../src/lib/config';

// ── Parse --userId argument ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const userIdFlag = args.indexOf('--userId');

if (userIdFlag === -1 || !args[userIdFlag + 1]) {
  console.error('Error: --userId <value> is required');
  console.error('Usage: npm run seed-tasks -- --userId <userId>');
  process.exit(1);
}

const userId = args[userIdFlag + 1];

// Phase 1: use the mock start date as the baseline for dueDate calculations.
// Replace this with a real user start date lookup when the users table exists.
const MOCK_START_DATE = '2026-07-14';

// ── Load checklist tasks from org-config.json ────────────────────────────────
const filePath = join(process.cwd(), 'src', 'config', 'org-config.json');
const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
const config = resolveOrgConfig(raw);

const checklistEntry = config.find(
  (entry: ResolvedPluginEntry) => entry.pluginId === 'checklist'
);

if (!checklistEntry) {
  console.error('Error: checklist plugin not found in org-config.json');
  process.exit(1);
}

const checklistConfig = checklistEntry.config as ChecklistConfig;

const seedTasks = checklistConfig.tasks.map((task) => ({
  taskId: task.id,
  userId,
  dueDate: addDays(MOCK_START_DATE, task.dueDayOffset),
}));

// ── Seed ─────────────────────────────────────────────────────────────────────
const force = args.includes('--force');
const repository = new TaskRepository();

repository
  .seedTasksForUser(seedTasks, force)
  .then(({ seeded, skipped }) => {
    console.log(`Seeded: ${seeded}, Skipped: ${skipped}`);
    process.exit(0);
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exit(1);
  });
