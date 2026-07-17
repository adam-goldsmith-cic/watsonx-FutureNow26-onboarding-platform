'use client';

import { useState } from 'react';
import type { SlackMessage } from '@/lib/api-types';

interface SlackModalProps {
  message: SlackMessage | null;
  onClose: () => void;
}

const BOB_REPLY_CHIPS = [
  '"Write a friendly acknowledgement"',
  '"Draft a detailed response"',
];

export function SlackModal({ message, onClose }: SlackModalProps) {
  const [reply, setReply] = useState('');

  if (!message) return null;

  function handleChip(chip: string) {
    setReply(chip.replace(/^"|"$/g, ''));
  }

  const timeLabel = (() => {
    try {
      return new Date(message.timestamp).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  })();

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(0,10,50,0.65)] p-5"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="slack-modal-title"
    >
      {/* Modal panel */}
      <div
        className="bg-card-bg border-t-4 border-t-ibm-blue w-[520px] max-w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-ibm-blue-bg border-b border-border px-[18px] py-[14px]">
          <div>
            <h3 id="slack-modal-title" className="text-[14px] font-semibold text-fg leading-snug">
              {message.senderName}
            </h3>
            <p className="text-[11px] text-muted mt-0.5">{message.channel}</p>
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
          {/* Message bubble */}
          <div className="bg-subtle border border-border p-3 mb-4">
            <div className="flex items-start gap-2.5">
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: message.color }}
              >
                {message.initials}
              </div>
              <div>
                <div className="text-[12px] font-bold text-fg mb-0.5">{message.senderName}</div>
                <div className="text-[10.5px] text-muted mb-1.5">{timeLabel}</div>
                <p className="text-[13px] text-fg leading-[1.65] whitespace-pre-wrap">
                  {message.fullText}
                </p>
              </div>
            </div>
          </div>

          {/* Bob Suggested Replies */}
          <section className="mb-4">
            <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
              Bob — Suggested Replies
            </h4>
            <div className="flex flex-wrap gap-2">
              {BOB_REPLY_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChip(chip)}
                  className="text-[11.5px] text-ibm-blue border border-ibm-blue bg-ibm-blue-bg px-2.5 py-1 hover:bg-ibm-blue hover:text-white transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </section>

          {/* Draft reply */}
          <textarea
            rows={3}
            placeholder="Draft your reply here..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="w-full border border-border bg-subtle text-[13px] text-fg px-2.5 py-2 resize-none outline-none mb-4 focus:border-ibm-blue focus:bg-card-bg"
          />

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
