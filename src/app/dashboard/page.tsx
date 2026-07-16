import { connection } from 'next/server';
import { resolveOrgConfig } from '@/lib/config';
import { ConfigRepository } from '@/lib/config/repository';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import type { OrgPluginConfig, UserProfile } from '@/lib/api-types';

const MOCK_USER: UserProfile = {
  id: 'usr-mock-001',
  name: 'Alex Johnson',
  role: 'new_starter',
  startDate: '2026-07-14',
};

export default async function DashboardPage() {
  await connection();
  const raw = await new ConfigRepository().getAllPlugins();
  const plugins = resolveOrgConfig(raw) as OrgPluginConfig[];
  return <DashboardLayout plugins={plugins} user={MOCK_USER} />;
}
