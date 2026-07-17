'use client';

import { useState } from 'react';
import type { CommunitiesConfig, Community } from '@/plugins/schemas/communities';
import { CommunityModal } from '@/components/dashboard/CommunityModal';
import { SentimentWidget } from '@/components/dashboard/SentimentWidget';

// ── Types ───────────────────────────────────────────────────────────────────

interface CommunitiesTabProps {
  config: CommunitiesConfig;
  userName: string;
  onAskBob?: (prompt: string) => void;
}

// ── Bob chip data ───────────────────────────────────────────────────────────

const BOB_COMMUNITY_CHIPS = [
  '"Show communities for cloud professionals"',
  '"Are there any LGBT+ networks at IBM?"',
  '"Which community should I join first?"',
  '"What is the IBM Consulting alumni network?"',
];

// ── Community card ──────────────────────────────────────────────────────────

interface CommunityCardProps {
  community: Community;
  onSelect: (c: Community) => void;
}

function CommunityCard({ community, onSelect }: CommunityCardProps) {
  return (
    <div
      className="flex items-start gap-3 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-ibm-blue-bg transition-colors pl-0.5 pr-1"
      onClick={() => onSelect(community)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(community)}
      aria-label={`View details for ${community.name}`}
    >
      {/* Icon box */}
      <div className="w-9 h-9 min-w-[36px] flex items-center justify-center text-base border border-[#dce8ff] bg-ibm-blue-bg shrink-0">
        {community.iconEmoji}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-semibold text-fg mb-0.5 leading-snug">
          {community.name}
          {community.isRecommended && (
            <span className="ml-2 text-[9.5px] font-bold bg-ibm-blue-bg text-ibm-blue px-1.5 py-0.5 uppercase tracking-[0.06em] align-middle">
              Recommended
            </span>
          )}
        </h4>
        <p className="text-[12px] text-muted leading-[1.5] mb-1.5">{community.description}</p>
        <div className="flex flex-wrap gap-2">
          {[community.cadence, community.slackChannel, community.memberCount].map((chip) => (
            <span
              key={chip}
              className="text-[10.5px] text-muted border border-border bg-subtle px-2 py-0.5"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CommunitiesTab ──────────────────────────────────────────────────────────

export function CommunitiesTab({ config, userName, onAskBob }: CommunitiesTabProps) {
  const [selected, setSelected] = useState<Community | null>(null);

  return (
    <>
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>

        {/* ── Main column ── */}
        <div className="min-w-0">
          <p className="text-[13px] text-muted mb-4 leading-[1.6]">
            Internal communities and networks Bob recommends based on your role, interests, and location.
            Joining early accelerates your network and helps you settle in faster.
          </p>

          <div className="bg-card-bg border border-border border-t-[3px] border-t-ibm-blue overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-subtle">
              <h3 className="text-[14px] font-semibold text-fg">{config.title}</h3>
              <span className="text-[10px] font-bold text-ibm-blue uppercase tracking-[0.06em]">
                Personalised by Bob
              </span>
            </div>

            {/* Community list */}
            <div className="px-4 py-1">
              {config.communities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* Bob Check-in — reuses SentimentWidget */}
          <div className="bg-card-bg border border-border border-t-[3px] border-t-ibm-blue overflow-hidden">
            <div className="bg-ibm-nav px-4 py-3 border-b border-border flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-hero-text">Weekly Check-in</h3>
              <span className="text-[9px] font-bold uppercase tracking-wider text-ibm-blue-light">BOB PULSE</span>
            </div>
            <SentimentWidget userName={userName} />
          </div>

          {/* Bob Community Help */}
          <div className="bg-card-bg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-ibm-nav">
              <h3 className="text-[14px] font-semibold text-white">Bob — Community Help</h3>
            </div>
            <div className="p-3 bg-ibm-blue-bg flex flex-col gap-1.5">
              {BOB_COMMUNITY_CHIPS.map((chip) => (
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

      <CommunityModal community={selected} onClose={() => setSelected(null)} />
    </>
  );
}
