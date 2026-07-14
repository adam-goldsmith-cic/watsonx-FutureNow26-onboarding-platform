'use client';

import { useTaskState } from '@/hooks/useTaskState';
import { HeroHeader } from '@/components/dashboard/HeroHeader';
import { ChecklistPlugin } from '@/components/plugins/ChecklistPlugin';
import { TrainingPlugin } from '@/components/plugins/TrainingPlugin';
import { FaqLinksPlugin } from '@/components/plugins/FaqLinksPlugin';
import { Plan90Plugin } from '@/components/plugins/Plan90Plugin';
import { ContactsPlugin } from '@/components/plugins/ContactsPlugin';
import { PolicyDocsPlugin } from '@/components/plugins/PolicyDocsPlugin';
import { AnnouncementsPlugin } from '@/components/plugins/AnnouncementsPlugin';
import type { UserProfile, OrgPluginConfig } from '@/lib/api-types';
import type { ChecklistConfig } from '@/plugins/schemas/checklist';
import type { TrainingConfig } from '@/plugins/schemas/training';
import type { FaqLinksConfig } from '@/plugins/schemas/faq-links';
import type { Plan90Config } from '@/plugins/schemas/plan-90';
import type { ContactsConfig } from '@/plugins/schemas/contacts';
import type { PolicyDocsConfig } from '@/plugins/schemas/policy-docs';
import type { AnnouncementsConfig } from '@/plugins/schemas/announcements';

interface DashboardLayoutProps {
  plugins: OrgPluginConfig[];
  user: UserProfile;
}

export function DashboardLayout({ plugins, user }: DashboardLayoutProps) {
  const { taskStates, cycleTaskStatus } = useTaskState();

  const enabledPlugins = [...plugins]
    .filter((p) => p.enabled)
    .sort((a, b) => a.order - b.order);

  const checklistEntry = plugins.find((p) => p.pluginId === 'checklist');
  const checklistConfig = checklistEntry?.config as ChecklistConfig | undefined;
  const totalTasks = checklistConfig?.tasks.length ?? 0;
  const doneTasks = checklistConfig?.tasks.filter(
    (t) => taskStates[t.id]?.status === 'DONE'
  ).length ?? 0;

  function renderPlugin(plugin: OrgPluginConfig) {
    switch (plugin.pluginId) {
      case 'announcements':
        return <AnnouncementsPlugin key={plugin.pluginId} config={plugin.config as AnnouncementsConfig} />;
      case 'checklist':
        return (
          <ChecklistPlugin
            key={plugin.pluginId}
            config={plugin.config as ChecklistConfig}
            taskStates={taskStates}
            startDate={user.startDate}
            onCycleTask={cycleTaskStatus}
          />
        );
      case 'training':
        return <TrainingPlugin key={plugin.pluginId} config={plugin.config as TrainingConfig} />;
      case 'faq-links':
        return <FaqLinksPlugin key={plugin.pluginId} config={plugin.config as FaqLinksConfig} />;
      case 'plan-90':
        return <Plan90Plugin key={plugin.pluginId} config={plugin.config as Plan90Config} />;
      case 'contacts':
        return <ContactsPlugin key={plugin.pluginId} config={plugin.config as ContactsConfig} />;
      case 'policy-docs':
        return <PolicyDocsPlugin key={plugin.pluginId} config={plugin.config as PolicyDocsConfig} />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-2">
          <a
            href="/admin"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:bg-card-bg transition-colors"
          >
            ⚙ Admin Config
          </a>
        </div>
        <HeroHeader user={user} totalTasks={totalTasks} doneTasks={doneTasks} />
        {enabledPlugins.map((plugin) => renderPlugin(plugin))}
      </div>
    </div>
  );
}
