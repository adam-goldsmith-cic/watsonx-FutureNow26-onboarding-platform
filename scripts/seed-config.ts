#!/usr/bin/env tsx
/**
 * Seed plugin config from org-config.json into the onboarding-config DynamoDB table.
 *
 * Usage:
 *   npm run seed-config
 *
 * Safe to run multiple times — existing items are overwritten with the same values.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { resolveOrgConfig } from '../src/lib/config';
import { ConfigRepository } from '../src/lib/config/repository';

// ── Load and validate config from org-config.json ───────────────────────────
const filePath = join(process.cwd(), 'src', 'config', 'org-config.json');
const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
const config = resolveOrgConfig(raw);

// ── Seed ─────────────────────────────────────────────────────────────────────
const repository = new ConfigRepository();

repository
  .putAllPlugins(config)
  .then(() => {
    console.log(`Seeded ${config.length} plugins to onboarding-config`);
    process.exit(0);
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exit(1);
  });
