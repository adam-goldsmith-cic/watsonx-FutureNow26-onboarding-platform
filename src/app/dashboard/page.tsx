import { readFileSync } from 'fs';
import { join } from 'path';
import { resolveOrgConfig } from '@/lib/config';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import type { OrgPluginConfig, UserProfile } from '@/lib/api-types';

const MOCK_USER: UserProfile = {
  id: 'usr-mock-001',
  name: 'Alex Johnson',
  role: 'new_starter',
  startDate: '2026-07-14',
};

function getConfig(): OrgPluginConfig[] {
  const filePath = join(process.cwd(), 'src', 'config', 'org-config.json');
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  return resolveOrgConfig(raw) as OrgPluginConfig[];
}

export default async function DashboardPage() {
  const plugins = getConfig();
  return <DashboardLayout plugins={plugins} user={MOCK_USER} />;
}
