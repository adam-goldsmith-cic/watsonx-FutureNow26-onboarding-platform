'use client';

import type { OrgNode } from '@/lib/api-types';

interface OrgModalProps {
  node: OrgNode | null;
  onClose: () => void;
}

export function OrgModal({ node, onClose }: OrgModalProps) {
  if (!node) return null;

  const chips = [
    `"Tell me more about ${node.name}"`,
    `"Draft an intro message to ${node.name}"`,
    `"What questions should I ask ${node.name}?"`,
  ];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(0,10,50,0.65)] p-5"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="org-modal-title"
    >
      {/* Modal panel */}
      <div
        className="bg-card-bg border-t-4 border-t-ibm-blue w-[480px] max-w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-ibm-blue-bg border-b border-border px-[18px] py-[14px]">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded flex items-center justify-center text-[13px] font-bold text-white shrink-0"
              style={{ background: node.color }}
            >
              {node.initials}
            </div>
            <div>
              <h3 id="org-modal-title" className="text-[14px] font-semibold text-fg leading-snug">
                {node.name}
              </h3>
              <p className="text-[11px] text-muted mt-0.5">{node.role}</p>
            </div>
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
          {/* Bio */}
          <section className="mb-4">
            <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
              About
            </h4>
            <p className="text-[13px] text-fg leading-[1.65]">{node.bio}</p>
          </section>

          {/* Bob chips */}
          <section className="mb-4">
            <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
              Bob — Conversation Starters
            </h4>
            <div className="flex flex-col gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="text-left text-[11.5px] text-ibm-blue border border-ibm-blue bg-ibm-blue-bg px-2.5 py-1.5 hover:bg-ibm-blue hover:text-white transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-2 pt-[14px] border-t border-border">
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
