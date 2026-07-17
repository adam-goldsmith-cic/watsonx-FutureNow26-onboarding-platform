'use client';

import { useState, useEffect } from 'react';
import type { SlackMessage, SlackMessageType } from '@/lib/api-types';
import { SlackModal } from '@/components/dashboard/SlackModal';

// ── Types ───────────────────────────────────────────────────────────────────

interface SlackTabProps {
  onAskBob?: (prompt: string) => void;
}

type SubTab = 'dm' | 'channel' | 'mention';

interface SubTabDef {
  id: SubTab;
  label: string;
  type: SlackMessageType;
}

const SUB_TABS: SubTabDef[] = [
  { id: 'dm',      label: 'Direct Messages',     type: 'dm'      },
  { id: 'channel', label: 'Channels',             type: 'channel' },
  { id: 'mention', label: 'Mentions & Reactions', type: 'mention' },
];

// ── Static sidebar data ─────────────────────────────────────────────────────

interface RecommendedChannel {
  name: string;
  description: string;
}

const RECOMMENDED_CHANNELS: RecommendedChannel[] = [
  { name: '#consulting-uk',  description: 'IBM Consulting UK · 850 members'    },
  { name: '#watsonx-ai',     description: 'watsonx practitioners · 1,200 members' },
  { name: '#client-zero',    description: 'IBM Client Zero · 420 members'       },
];

const BOB_SLACK_CHIPS = [
  '"Draft a reply to Sarah\'s message"',
  '"What channels should I join?"',
  '"Help me introduce myself in #general"',
  '"Summarise what I missed in #future-now"',
];

// ── Timestamp helper ────────────────────────────────────────────────────────

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffH < 24) {
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return 'Yesterday';
  } catch {
    return '';
  }
}

// ── Message row ─────────────────────────────────────────────────────────────

interface MessageRowProps {
  message: SlackMessage;
  onSelect: (m: SlackMessage) => void;
}

function MessageRow({ message, onSelect }: MessageRowProps) {
  return (
    <div
      className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-b-0 cursor-pointer hover:bg-ibm-blue-bg transition-colors pl-0.5 pr-1"
      onClick={() => onSelect(message)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(message)}
      aria-label={`Open message from ${message.senderName}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        style={{ background: message.color }}
      >
        {message.initials}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-[12.5px] font-semibold text-fg">{message.senderName}</span>
          <span className="text-[11px] text-muted">{message.channel}</span>
          <span className="text-[10px] text-faint ml-auto whitespace-nowrap">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="text-[12px] text-muted truncate">{message.preview}</div>
      </div>

      {/* Unread dot */}
      {message.isUnread && (
        <div
          data-testid="unread-dot"
          className="w-2 h-2 rounded-full bg-ibm-blue shrink-0 mt-2.5"
        />
      )}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ subTab }: { subTab: SubTab }) {
  const labels: Record<SubTab, string> = {
    dm:      'No direct messages yet.',
    channel: 'No channel messages.',
    mention: 'No mentions or reactions yet.',
  };
  return (
    <p className="text-sm text-muted py-6 text-center">{labels[subTab]}</p>
  );
}

// ── SlackTab ────────────────────────────────────────────────────────────────

export function SlackTab({ onAskBob }: SlackTabProps) {
  const [messages, setMessages]   = useState<SlackMessage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeSubTab, setSubTab] = useState<SubTab>('dm');
  const [selected, setSelected]   = useState<SlackMessage | null>(null);
  const [joined, setJoined]       = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/slack-messages')
      .then((r) => r.json())
      .then((data: { messages: SlackMessage[] }) => {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  const activeType = SUB_TABS.find((t) => t.id === activeSubTab)!.type;
  const filtered = messages.filter((m) => m.type === activeType);

  return (
    <>
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>

        {/* ── Main column ── */}
        <div className="min-w-0">
          <div className="bg-card-bg border border-border border-t-[3px] border-t-ibm-blue overflow-hidden">

            {/* Card header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-subtle">
              <h3 className="text-[14px] font-semibold text-fg">Slack — Messages &amp; Channels</h3>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide"
                  style={{ background: '#4a154b' }}
                >
                  Slack Workspace
                </span>
                <span className="flex items-center gap-1 text-[11px] text-green bg-green-bg border border-green px-2 py-0.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
                  Connected
                </span>
              </div>
            </div>

            {/* Bob tip callout */}
            <div className="px-4 pt-3">
              <div className="flex gap-3 bg-ibm-blue-bg border-l-4 border-l-ibm-blue px-3 py-3 mb-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-ibm-blue text-white text-[11px] font-bold flex items-center justify-center">
                  B
                </div>
                <div>
                  <p className="text-[13px] text-fg leading-[1.6]">
                    <strong>Bob&apos;s tip:</strong> You have{' '}
                    {messages.filter((m) => m.isUnread).length} unread messages.
                    Click any message to read it and draft a reply.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['"What channels should I join?"', '"Help me introduce myself in #general"'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => onAskBob?.(chip.replace(/^"|"$/g, ''))}
                        className="text-[11px] text-ibm-blue border border-ibm-blue bg-card-bg px-2.5 py-1 hover:bg-ibm-blue-bg transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="px-4">
              <div className="flex border-b-2 border-ibm-blue-bg mb-3 overflow-x-auto scrollbar-hide">
                {SUB_TABS.map((tab) => {
                  const isActive = tab.id === activeSubTab;
                  const unreadCount = messages.filter(
                    (m) => m.type === tab.type && m.isUnread
                  ).length;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-label={tab.label}
                      onClick={() => setSubTab(tab.id)}
                      className={[
                        'text-[12.5px] px-3.5 py-2 whitespace-nowrap cursor-pointer border-b-2 -mb-0.5 transition-colors',
                        isActive
                          ? 'text-ibm-blue border-ibm-blue font-semibold'
                          : 'text-muted border-transparent hover:text-fg hover:border-border',
                      ].join(' ')}
                    >
                      {tab.label}
                      {unreadCount > 0 && (
                        <span className="ml-1.5 bg-ibm-blue text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message list */}
            <div className="px-4 pb-3">
              {loading ? (
                <p className="text-sm text-muted py-6 text-center">Loading messages…</p>
              ) : filtered.length === 0 ? (
                <EmptyState subTab={activeSubTab} />
              ) : (
                <div>
                  {filtered.map((msg) => (
                    <MessageRow key={msg.messageId} message={msg} onSelect={setSelected} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* Channels to Join */}
          <div className="bg-card-bg border border-border border-t-[3px] border-t-ibm-blue overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-subtle">
              <h3 className="text-[14px] font-semibold text-fg">Channels to Join</h3>
            </div>
            <div className="p-3">
              <p className="text-[12px] text-muted mb-2.5">
                Bob recommends these based on your role:
              </p>
              <div className="flex flex-col gap-1.5">
                {RECOMMENDED_CHANNELS.map((ch) => {
                  const isJoined = joined.has(ch.name);
                  return (
                    <div
                      key={ch.name}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 bg-ibm-blue-bg border border-[#d0e2ff]"
                    >
                      <div>
                        <div className="text-[12.5px] font-semibold text-fg">{ch.name}</div>
                        <div className="text-[11px] text-muted">{ch.description}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setJoined((prev) => {
                            const next = new Set(prev);
                            isJoined ? next.delete(ch.name) : next.add(ch.name);
                            return next;
                          })
                        }
                        className={[
                          'text-[11px] font-semibold px-2.5 py-1 shrink-0 cursor-pointer transition-colors',
                          isJoined
                            ? 'bg-green text-white'
                            : 'bg-ibm-blue text-white hover:opacity-90',
                        ].join(' ')}
                      >
                        {isJoined ? 'Joined ✓' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bob Slack Help */}
          <div className="bg-card-bg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-ibm-nav">
              <h3 className="text-[14px] font-semibold text-white">Bob — Slack Help</h3>
            </div>
            <div className="p-3 bg-ibm-blue-bg flex flex-col gap-1.5">
              {BOB_SLACK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onAskBob?.(chip.replace(/^"|"$/g, ''))}
                  className="text-left text-[11.5px] text-fg bg-card-bg border border-border px-3 py-2 hover:bg-subtle transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Slack message modal */}
      <SlackModal message={selected} onClose={() => setSelected(null)} />
    </>
  );
}
