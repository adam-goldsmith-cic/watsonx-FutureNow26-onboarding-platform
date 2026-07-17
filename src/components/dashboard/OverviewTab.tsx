'use client';

import { useState, useEffect, useMemo } from 'react';
import { SentimentWidget } from '@/components/dashboard/SentimentWidget';
import { useTabSwitch } from '@/components/dashboard/DashboardLayout';
import type { Meeting, SlackMessage, TaskState } from '@/lib/api-types';
import type { ChecklistConfig } from '@/plugins/schemas/checklist';
import type { FaqLinksConfig } from '@/plugins/schemas/faq-links';
import type { AnnouncementsConfig } from '@/plugins/schemas/announcements';

// ── Props ──────────────────────────────────────────────────────────────────

interface OverviewTabProps {
  taskStates:          Record<string, TaskState>;
  checklistConfig:     ChecklistConfig | undefined;
  faqLinksConfig:      FaqLinksConfig  | undefined;
  announcementsConfig: AnnouncementsConfig | undefined;
  userName:            string;
  /** Pre-fetched count of today's meetings (from hero KPI). */
  meetingsToday:       number;
  /** Pre-fetched count of unread Slack messages (from hero KPI). */
  slackUnreads:        number;
  /** Callback passed in from BobBar to pre-populate its input. */
  onAskBob?:           (prompt: string) => void;
}

// ── Meeting status logic ───────────────────────────────────────────────────

type DisplayStatus = 'done' | 'now' | 'soon' | 'later';

function getMeetingDisplayStatus(m: Meeting): DisplayStatus {
  if (m.status === 'done') return 'done';
  if (m.status === 'happening-now') return 'now';

  // Same day upcoming — compute hours until start
  const todayStr = new Date().toISOString().split('T')[0];
  if (m.date === todayStr) {
    const now = new Date();
    const [hh, mm] = m.startTime.split(':').map(Number);
    const start = new Date(now);
    start.setHours(hh, mm, 0, 0);
    if (start > now) return 'soon';
  }
  return 'later';
}

function hoursUntil(startTime: string): number {
  const now = new Date();
  const [hh, mm] = startTime.split(':').map(Number);
  const start = new Date(now);
  start.setHours(hh, mm, 0, 0);
  return Math.max(0, Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60)));
}

// ── Status pill ────────────────────────────────────────────────────────────

function StatusPill({ status, startTime }: { status: DisplayStatus; startTime: string }) {
  switch (status) {
    case 'done':
      return (
        <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 bg-green-bg text-green border border-green/40">
          Done
        </span>
      );
    case 'now':
      return (
        <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 bg-amber-bg text-amber border border-amber/40">
          Now
        </span>
      );
    case 'soon': {
      const h = hoursUntil(startTime);
      return (
        <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 bg-ibm-blue-bg text-ibm-blue border border-ibm-blue/20">
          {h === 0 ? 'Soon' : `In ${h}h`}
        </span>
      );
    }
    case 'later':
      return (
        <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 bg-subtle text-muted border border-border">
          Later
        </span>
      );
  }
}

// ── Card shell ─────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card-bg border border-border border-t-[3px] border-t-ibm-blue rounded-none ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-subtle px-4 py-3 border-b border-border flex items-center justify-between gap-2">
      {children}
    </div>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────────

function StatTile({
  value,
  label,
  detail,
}: {
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <div className="bg-card-bg border border-border border-t-[3px] border-t-ibm-blue px-3.5 py-3.5">
      <div className="text-[28px] font-light leading-none text-ibm-blue">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted mt-1">{label}</div>
      <div className="text-[10px] font-semibold text-green mt-0.5">{detail}</div>
    </div>
  );
}

// ── Try Asking Bob chips ────────────────────────────────────────────────────

const BOB_CHIPS = [
  '"What should I prioritise this week?"',
  '"Explain IBM Future Now\'s mission"',
  '"How does IBM\'s performance review work?"',
  '"Write my weekly update for Sarah"',
  '"What certifications should I aim for first?"',
];

// ── Main component ─────────────────────────────────────────────────────────

export function OverviewTab({
  taskStates,
  checklistConfig,
  faqLinksConfig,
  announcementsConfig,
  userName,
  meetingsToday,
  slackUnreads,
  onAskBob,
}: OverviewTabProps) {
  const switchTab   = useTabSwitch();
  const firstName   = userName.split(' ')[0];

  // ── Fetch meetings & slack messages on mount ──────────────────────────
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [slackMessages, setSlackMessages] = useState<SlackMessage[]>([]);

  useEffect(() => {
    fetch('/api/meetings')
      .then((r) => r.json())
      .then((data: unknown) => { if (Array.isArray(data)) setMeetings(data as Meeting[]); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/slack-messages')
      .then((r) => r.json())
      .then((data: { messages: SlackMessage[] }) => setSlackMessages(data.messages ?? []))
      .catch(() => {});
  }, []);

  // ── Compute stat tiles ────────────────────────────────────────────────
  const { done, remaining } = useMemo(() => {
    const states = Object.values(taskStates);
    return {
      done:      states.filter((s) => s.status === 'DONE').length,
      remaining: states.filter((s) => s.status !== 'DONE').length,
    };
  }, [taskStates]);

  // Phase 1: Days-to-milestone is static (startDate not passed into this component)
  const daysToMilestone = 30;

  // ── Filter today's meetings ───────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeetings = meetings.filter((m) => m.date === todayStr);

  // ── Top 3 slack messages sorted by timestamp desc ────────────────────
  const recentSlack = [...slackMessages]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  // ── Onboarding progress bars ──────────────────────────────────────────
  const progressBars = useMemo(() => {
    const tasks = checklistConfig?.tasks ?? [];
    function pct(ids: string[]) {
      if (ids.length === 0) return 0;
      const done = ids.filter((id) => taskStates[id]?.status === 'DONE').length;
      return Math.round((done / ids.length) * 100);
    }

    const itTasks   = tasks.filter((t) => t.category === 'IT').map((t) => t.id);
    const secTasks  = tasks.filter((t) => t.category === 'SEC').map((t) => t.id);
    const teamTasks = tasks.filter((t) => t.category === 'TEAM' || t.category === 'MGR').map((t) => t.id);
    const hrTasks   = tasks.filter((t) => t.category === 'HR').map((t) => t.id);

    return [
      { label: 'Setup & Access', pct: pct(itTasks) },
      { label: 'Compliance',     pct: pct(secTasks) },
      { label: 'Team Intros',    pct: pct(teamTasks) },
      { label: 'Learning',       pct: pct(hrTasks) },
      { label: 'Communities',    pct: 0 },
    ];
  }, [checklistConfig, taskStates]);

  // ── Urgent tasks count ────────────────────────────────────────────────
  const urgentTasks = useMemo(() => {
    return (checklistConfig?.tasks ?? []).filter((t) => {
      const state = taskStates[t.id];
      return t.mandatory && (!state || state.status !== 'DONE');
    }).length;
  }, [checklistConfig, taskStates]);

  // ── Quick links ───────────────────────────────────────────────────────
  const quickLinks = (faqLinksConfig?.links ?? []).slice(0, 7);

  // ── Format slack timestamp ────────────────────────────────────────────
  function formatSlackTime(ts: string): string {
    try {
      return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 300px', alignItems: 'start' }}>

      {/* ── Main column ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">

        {/* Bob notification banner — shows first announcement or computed KPI summary */}
        <div className="bg-ibm-blue-bg border border-border border-l-4 border-l-ibm-blue px-3.5 py-2.5 flex items-start gap-2.5 text-[12.5px] text-fg">
          <span className="text-base shrink-0 mt-px">🤖</span>
          {announcementsConfig?.items[0] ? (
            <span><strong>Bob says:</strong> {announcementsConfig.items[0].message}</span>
          ) : (
            <span>
              <strong>Bob says:</strong>{' '}
              Good morning {firstName}. You have{' '}
              <strong>{meetingsToday}</strong> meeting{meetingsToday !== 1 ? 's' : ''} today,{' '}
              <strong>{slackUnreads}</strong> unread Slack message{slackUnreads !== 1 ? 's' : ''}, and{' '}
              <strong>{urgentTasks}</strong> urgent checklist task{urgentTasks !== 1 ? 's' : ''}.{' '}
              Check each tab to stay on track.
            </span>
          )}
        </div>

        {/* Stat tiles row */}
        <div className="grid grid-cols-4 gap-2.5">
          <StatTile value={done}             label="Tasks Complete"       detail="Ahead of pace" />
          <StatTile value={remaining}        label="Tasks Remaining"      detail="Next: laptop setup" />
          <StatTile value={3}                label="People Met"           detail="5 recommended" />
          <StatTile value={daysToMilestone}  label="Days to Milestone 1"  detail="On track" />
        </div>

        {/* Today's Meetings card */}
        <Card>
          <CardHeader>
            <h3 className="text-[13px] font-semibold text-fg">Today&#39;s Meetings</h3>
            <div className="flex items-center gap-2 shrink-0">
              {/* Outlook badge */}
              <span className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider text-white" style={{ background: '#0078d4' }}>
                Outlook
              </span>
              {/* Live pill */}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-bg text-green border border-green/40">
                <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" />
                Live
              </span>
              <button
                type="button"
                onClick={() => switchTab('calendar')}
                className="text-[10px] font-semibold px-2.5 py-1 bg-ibm-blue text-white cursor-pointer hover:opacity-90 transition-opacity"
              >
                Full Calendar →
              </button>
            </div>
          </CardHeader>
          <div className="p-2.5">
            {todayMeetings.length === 0 ? (
              <p className="text-sm text-muted p-3">No meetings today.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {todayMeetings.map((m) => {
                  const ds = getMeetingDisplayStatus(m);
                  const tcBg = ds === 'done' ? 'bg-green' : ds === 'now' ? 'bg-amber' : 'bg-ibm-blue';
                  return (
                    <div
                      key={m.meetingId}
                      className="flex border border-border hover:bg-ibm-blue-bg transition-colors cursor-pointer"
                    >
                      {/* Time block */}
                      <div
                        className={`${tcBg} min-w-[64px] flex flex-col items-center justify-center py-2.5 px-2 text-white shrink-0`}
                      >
                        <div className="text-xs font-bold leading-tight">{m.startTime}</div>
                        <div className="text-[9px] opacity-75 mt-0.5">{m.duration} min</div>
                      </div>
                      {/* Body */}
                      <div className="px-3 py-2 flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-fg truncate">{m.title}</div>
                        <div className="text-[11px] text-muted flex gap-2.5 mt-0.5 flex-wrap">
                          <span>{m.location}</span>
                          {m.attendees.length > 0 && (
                            <span>
                              {m.attendees.length === 1
                                ? m.attendees[0]
                                : `${m.attendees[0]} + ${m.attendees.length - 1}`}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Right: pill + join */}
                      <div className="flex flex-col items-end justify-center gap-1 px-3 py-2 shrink-0">
                        <StatusPill status={ds} startTime={m.startTime} />
                        {ds === 'now' && (
                          <button
                            type="button"
                            className="text-[10px] font-semibold px-2.5 py-1 bg-ibm-blue text-white cursor-pointer hover:opacity-90"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Slack Messages card */}
        <Card>
          <CardHeader>
            <h3 className="text-[13px] font-semibold text-fg">Recent Slack Messages</h3>
            <div className="flex items-center gap-2 shrink-0">
              {/* Slack badge */}
              <span className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider text-white" style={{ background: '#4a154b' }}>
                Slack
              </span>
              {/* Connected pill */}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-bg text-green border border-green/40">
                <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" />
                Connected
              </span>
              <button
                type="button"
                onClick={() => switchTab('slack')}
                className="text-[10px] font-semibold px-2.5 py-1 bg-ibm-blue text-white cursor-pointer hover:opacity-90 transition-opacity"
              >
                All Messages →
              </button>
            </div>
          </CardHeader>
          <div className="px-3.5 py-1">
            {recentSlack.length === 0 ? (
              <p className="text-sm text-muted py-3">No recent messages.</p>
            ) : (
              <div>
                {recentSlack.map((msg) => (
                  <div
                    key={msg.messageId}
                    className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-b-0 cursor-pointer hover:bg-ibm-blue-bg transition-colors"
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: msg.color }}
                    >
                      {msg.initials}
                    </div>
                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[12.5px] font-semibold text-fg">{msg.senderName}</span>
                        <span className="text-[11px] text-muted">{msg.channel}</span>
                        <span className="text-[10px] text-faint ml-auto whitespace-nowrap">
                          {formatSlackTime(msg.timestamp)}
                        </span>
                      </div>
                      <div className="text-[12px] text-muted truncate">{msg.preview}</div>
                    </div>
                    {/* Unread dot */}
                    {msg.isUnread && (
                      <div className="w-2 h-2 rounded-full bg-ibm-blue shrink-0 mt-2.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

      </div>{/* end main column */}

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">

        {/* Sentiment / Weekly Check-in card — dark blue header matching V2 */}
        <Card>
          <div className="bg-ibm-nav px-4 py-3 border-b border-border flex items-center justify-between gap-2">
            <h3 className="text-[13px] font-semibold text-hero-text">Weekly Check-in</h3>
            <span className="text-[9px] font-bold uppercase tracking-wider text-ibm-blue-light">BOB PULSE</span>
          </div>
          <SentimentWidget userName={userName} />
        </Card>

        {/* Onboarding Progress card */}
        <Card>
          <CardHeader>
            <h3 className="text-[13px] font-semibold text-fg">Onboarding Progress</h3>
            <span className="text-[10px] font-bold text-ibm-blue uppercase tracking-wide">DAY 1 OF 90</span>
          </CardHeader>
          <div className="p-3 flex flex-col gap-2">
            {progressBars.map(({ label, pct }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[11.5px] text-muted min-w-[95px]">{label}</span>
                <div className="flex-1 bg-ibm-blue-bg h-1.5">
                  <div
                    className="h-1.5 bg-ibm-blue transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[11.5px] font-bold text-ibm-blue min-w-[28px] text-right">
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links card */}
        <Card>
          <CardHeader>
            <h3 className="text-[13px] font-semibold text-fg">Quick Links</h3>
          </CardHeader>
          <div>
            {quickLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                className="flex items-center justify-between px-4 py-2 border-b border-border last:border-b-0 text-[12.5px] text-fg hover:bg-ibm-blue-bg transition-colors cursor-pointer"
              >
                <span>{link.label}</span>
                <span className="text-muted text-sm">›</span>
              </a>
            ))}
          </div>
        </Card>

        {/* Try Asking Bob card */}
        <Card>
          <div className="bg-ibm-nav px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-hero-text">Try Asking Bob</h3>
          </div>
          <div className="p-3 bg-ibm-blue-bg flex flex-col gap-1.5">
            {BOB_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onAskBob?.(chip)}
                className="text-left text-[11px] text-ibm-blue font-medium px-2.5 py-1.5 bg-card-bg border border-ibm-blue/30 hover:bg-ibm-blue-bg hover:border-ibm-blue cursor-pointer transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </Card>

      </div>{/* end sidebar */}

    </div>
  );
}
