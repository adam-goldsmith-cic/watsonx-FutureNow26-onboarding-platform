'use client';

import { useState } from 'react';
import type { Community } from '@/plugins/schemas/communities';

interface CommunityModalProps {
  community: Community | null;
  onClose: () => void;
}

export function CommunityModal({ community, onClose }: CommunityModalProps) {
  if (!community) return null;

  const meta = [community.cadence, community.slackChannel, community.memberCount]
    .filter(Boolean)
    .join(' · ');

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(0,10,50,0.65)] p-5"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="community-modal-title"
    >
      {/* Modal panel */}
      <div
        className="bg-card-bg border-t-4 border-t-ibm-blue w-[500px] max-w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-ibm-blue-bg border-b border-border px-[18px] py-[14px]">
          <div>
            <h3 id="community-modal-title" className="text-[14px] font-semibold text-fg leading-snug">
              {community.name}
            </h3>
            <p className="text-[11px] text-muted mt-0.5">{meta}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[20px] text-muted hover:text-fg leading-none px-1 cursor-pointer bg-transparent border-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-[18px]">
          {/* About */}
          <section className="mb-4">
            <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
              About this community
            </h4>
            <p className="text-[13px] text-fg leading-[1.65]">{community.description}</p>
          </section>

          {/* Bob says */}
          <section className="mb-4">
            <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
              Bob says
            </h4>
            <div className="flex gap-3 bg-ibm-blue-bg border-l-4 border-l-ibm-blue px-3 py-3 rounded-sm">
              <div className="shrink-0 w-6 h-6 rounded-full bg-ibm-blue text-white text-[10px] font-bold flex items-center justify-center">
                B
              </div>
              <div>
                <p className="text-[12px] text-fg leading-[1.6]">{community.bobNote}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['"How do I join?"', '"Tell me more about this group"'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="text-[11px] text-ibm-blue border border-ibm-blue bg-card-bg px-2.5 py-1 hover:bg-ibm-blue-bg transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-2 pt-[14px] border-t border-border">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-white bg-ibm-blue hover:bg-[#1560a8] transition-colors cursor-pointer"
            >
              Join Community
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-fg border border-border hover:bg-subtle transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
