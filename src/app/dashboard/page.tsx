import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { resolveOrgConfig } from '@/lib/config';
import { ConfigRepository } from '@/lib/config/repository';
import { MeetingRepository } from '@/lib/meetings/repository';
import { SlackRepository } from '@/lib/slack/repository';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { auth } from '@/auth';
import type { OrgPluginConfig, UserProfile } from '@/lib/api-types';

export default async function DashboardPage() {
  await connection();

  const session = await auth();
  if (!session?.user) redirect('/login');

  const user: UserProfile = {
    id: session.user.id,
    name: session.user.name ?? 'New Starter',
    role: session.user.role,
  };

  const raw = await new ConfigRepository().getAllPlugins();
  const plugins = resolveOrgConfig(raw) as OrgPluginConfig[];

  const todayStr = new Date().toISOString().split('T')[0];

  const [meetingsToday, slackUnreads] = await Promise.all([
    new MeetingRepository()
      .getMeetingsForUser(user.id)
      .then((ms) => ms.filter((m) => m.date === todayStr).length)
      .catch(() => 0),
    new SlackRepository()
      .getMessagesForUser(user.id)
      .then((msgs) => msgs.filter((m) => m.isUnread).length)
      .catch(() => 0),
  ]);

  return (
    <DashboardLayout
      plugins={plugins}
      user={user}
      meetingsToday={meetingsToday}
      slackUnreads={slackUnreads}
    />
  );
}
