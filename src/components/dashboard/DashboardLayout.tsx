'use client';

import { createContext, useContext, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useTaskState } from '@/hooks/useTaskState';
import { HeroHeader } from '@/components/dashboard/HeroHeader';
import { BobBar } from '@/components/dashboard/BobBar';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { CalendarTab } from '@/components/dashboard/CalendarTab';
import { SlackTab } from '@/components/dashboard/SlackTab';
import { OrgChartTab } from '@/components/dashboard/OrgChartTab';
import { CommunitiesTab } from '@/components/dashboard/CommunitiesTab';
import { ChecklistPlugin } from '@/components/plugins/ChecklistPlugin';
import { TrainingPlugin } from '@/components/plugins/TrainingPlugin';
import { Plan90Plugin } from '@/components/plugins/Plan90Plugin';
import { ContactsPlugin } from '@/components/plugins/ContactsPlugin';
import { PolicyDocsPlugin } from '@/components/plugins/PolicyDocsPlugin';
import type { UserProfile, OrgPluginConfig } from '@/lib/api-types';
import type { ChecklistConfig } from '@/plugins/schemas/checklist';
import type { TrainingConfig } from '@/plugins/schemas/training';
import type { FaqLinksConfig } from '@/plugins/schemas/faq-links';
import type { Plan90Config } from '@/plugins/schemas/plan-90';
import type { ContactsConfig } from '@/plugins/schemas/contacts';
import type { PolicyDocsConfig } from '@/plugins/schemas/policy-docs';
import type { AnnouncementsConfig } from '@/plugins/schemas/announcements';
import type { CommunitiesConfig } from '@/plugins/schemas/communities';

// ── Tab types ──────────────────────────────────────────────────────────────

export type TabId =
  | 'overview'
  | 'calendar'
  | 'slack'
  | 'org'
  | 'contacts'
  | 'checklist'
  | 'plan'
  | 'learning'
  | 'communities';

export interface Tab {
  id: TabId;
  label: string;
}

export const TABS: Tab[] = [
  { id: 'overview',     label: 'Overview' },
  { id: 'calendar',     label: 'Calendar & Outlook' },
  { id: 'slack',        label: 'Slack Messages' },
  { id: 'org',          label: 'Org Chart' },
  { id: 'contacts',     label: 'Key Contacts' },
  { id: 'checklist',    label: 'First Week Checklist' },
  { id: 'plan',         label: '30/60/90 Plan' },
  { id: 'learning',     label: 'Learning & Training' },
  { id: 'communities',  label: 'Communities' },
];

// ── onTabSwitch context ────────────────────────────────────────────────────

export const TabSwitchContext = createContext<(tabId: TabId) => void>(() => {});

/** Hook for child components to programmatically switch the active tab. */
export function useTabSwitch(): (tabId: TabId) => void {
  return useContext(TabSwitchContext);
}

// ── Placeholder panel ──────────────────────────────────────────────────────

function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card-bg p-10 text-center">
      <p className="text-lg font-semibold text-fg mb-1">{label}</p>
      <p className="text-sm text-muted">Coming soon</p>
    </div>
  );
}

// ── Disabled plugin notice ─────────────────────────────────────────────────

function DisabledPanel() {
  return (
    <div className="rounded-lg border border-border bg-card-bg p-10 text-center">
      <p className="text-sm text-muted">This section is not currently enabled.</p>
    </div>
  );
}

// ── Bob suggestions ────────────────────────────────────────────────────────

const DEFAULT_BOB_SUGGESTIONS = [
  '"What should I focus on today?"',
  '"Build my 30/60/90 plan"',
  '"Who do I need to meet this week?"',
  '"Draft my intro email to the team"',
  '"Walk me through security training"',
  '"How do I connect to IBM VPN?"',
  '"Explain IBM\'s structure to me"',
];

// ── Sign out button ────────────────────────────────────────────────────────

function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:bg-card-bg transition-colors"
    >
      Sign out
    </button>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  plugins: OrgPluginConfig[];
  user: UserProfile;
  meetingsToday: number;
  slackUnreads: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export function DashboardLayout({
  plugins,
  user,
  meetingsToday,
  slackUnreads,
}: DashboardLayoutProps) {
  const { taskStates, cycleTaskStatus } = useTaskState();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [bobInput, setBobInput] = useState<string>('');
  void bobInput; // wired to BobBar in future iteration

  // ── Progress calculation for hero ──────────────────────────────────────
  const checklistEntry = plugins.find((p) => p.pluginId === 'checklist');
  const checklistConfig = checklistEntry?.config as ChecklistConfig | undefined;
  const totalTasks = checklistConfig?.tasks.length ?? 0;
  const doneTasks =
    checklistConfig?.tasks.filter((t) => taskStates[t.id]?.status === 'DONE').length ?? 0;

  // ── Plugin lookup helpers ───────────────────────────────────────────────
  function getPlugin(id: string): OrgPluginConfig | undefined {
    return plugins.find((p) => p.pluginId === id);
  }

  // ── Tab panel renderer ──────────────────────────────────────────────────
  function renderPanel(tabId: TabId) {
    switch (tabId) {
      case 'overview': {
        const checklistEntry     = getPlugin('checklist');
        const faqEntry           = getPlugin('faq-links');
        const announcementsEntry = getPlugin('announcements');
        return (
          <OverviewTab
            taskStates={taskStates}
            checklistConfig={checklistEntry?.config as ChecklistConfig | undefined}
            faqLinksConfig={faqEntry?.config as FaqLinksConfig | undefined}
            announcementsConfig={announcementsEntry?.config as AnnouncementsConfig | undefined}
            userName={user.name}
            meetingsToday={meetingsToday}
            slackUnreads={slackUnreads}
            onAskBob={setBobInput}
          />
        );
      }

      case 'calendar':
        return <CalendarTab onAskBob={setBobInput} />;

      case 'slack':
        return <SlackTab onAskBob={setBobInput} />;

      case 'org':
        return <OrgChartTab onAskBob={setBobInput} />;

      case 'contacts': {
        const entry = getPlugin('contacts');
        if (!entry) return <DisabledPanel />;
        if (!entry.enabled) return <DisabledPanel />;
        return <ContactsPlugin config={entry.config as ContactsConfig} />;
      }

      case 'checklist': {
        const entry = getPlugin('checklist');
        if (!entry) return <DisabledPanel />;
        if (!entry.enabled) return <DisabledPanel />;
        return (
          <ChecklistPlugin
            config={entry.config as ChecklistConfig}
            taskStates={taskStates}
            startDate={user.startDate ?? new Date().toISOString().split('T')[0]}
            onCycleTask={cycleTaskStatus}
          />
        );
      }

      case 'plan': {
        const entry = getPlugin('plan-90');
        if (!entry) return <DisabledPanel />;
        if (!entry.enabled) return <DisabledPanel />;
        return <Plan90Plugin config={entry.config as Plan90Config} />;
      }

      case 'learning': {
        const trainingEntry = getPlugin('training');
        const policyEntry = getPlugin('policy-docs');
        const hasTraining = trainingEntry?.enabled;
        const hasPolicy = policyEntry?.enabled;
        if (!hasTraining && !hasPolicy) return <DisabledPanel />;
        return (
          <div className="space-y-6">
            {hasTraining && (
              <TrainingPlugin config={trainingEntry!.config as TrainingConfig} />
            )}
            {hasPolicy && (
              <PolicyDocsPlugin config={policyEntry!.config as PolicyDocsConfig} />
            )}
          </div>
        );
      }

      case 'communities': {
        const entry = getPlugin('communities');
        if (!entry?.enabled) return <DisabledPanel />;
        return (
          <CommunitiesTab
            config={entry.config as CommunitiesConfig}
            userName={user.name}
            onAskBob={setBobInput}
          />
        );
      }

      default:
        return null;
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <TabSwitchContext.Provider value={setActiveTab}>
      <div className="min-h-screen bg-page-bg">

        {/* Top bar — sign out (always shown) */}
        <div className="max-w-[1200px] mx-auto px-6 pt-10">
          <div className="flex justify-end mb-4">
            <SignOutButton />
          </div>
        </div>

        {/* Hero — full-width within the layout */}
        <div className="max-w-[1200px] mx-auto px-6">
          <HeroHeader
            user={user}
            totalTasks={totalTasks}
            doneTasks={doneTasks}
            meetingsToday={meetingsToday}
            slackUnreads={slackUnreads}
          />
        </div>

        {/* Bob AI bar — sits between hero and tab nav */}
        <BobBar suggestions={DEFAULT_BOB_SUGGESTIONS} />

        {/* Sticky tab navigation bar */}
        <nav
          className="sticky top-0 z-[200] bg-ibm-nav border-b-2 border-ibm-nav-bd overflow-x-auto scrollbar-hide"
          aria-label="Dashboard tabs"
        >
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex justify-center">
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'relative whitespace-nowrap text-[12.5px] px-[18px] py-[11px] cursor-pointer',
                      'border-b-[3px] -mb-0.5 transition-colors duration-100',
                      'flex items-center gap-1.5',
                      isActive
                        ? 'text-white font-semibold border-tab-active'
                        : 'text-white/60 font-normal border-transparent hover:text-white hover:bg-black/10',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Active tab panel */}
        <div className="max-w-[1200px] mx-auto px-6 py-5 pb-16">
          {renderPanel(activeTab)}
        </div>

      </div>

    </TabSwitchContext.Provider>
  );
}
