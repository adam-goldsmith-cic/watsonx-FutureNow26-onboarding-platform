'use client';

import type { KeyContact } from '@/plugins/schemas/contacts';

interface ContactModalProps {
  contact: KeyContact | null;
  onClose: () => void;
}

// Avatar colour palette — cycles by contact name length for variety
const AVATAR_COLOURS = ['#0043ce', '#6929c4', '#009d9a', '#9f1853', '#198038', '#b28600'];

function avatarColor(name: string): string {
  return AVATAR_COLOURS[name.length % AVATAR_COLOURS.length];
}

export function ContactModal({ contact, onClose }: ContactModalProps) {
  if (!contact) return null;

  const color = avatarColor(contact.name);

  const chips = [
    `"Draft an intro message to ${contact.name}"`,
    `"What questions should I ask ${contact.name}?"`,
    `"Help me prepare for our 1-to-1 with ${contact.name}"`,
  ];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(0,10,50,0.65)] p-5"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="contact-modal-title"
    >
      {/* Modal panel */}
      <div
        className="bg-card-bg border-t-4 border-t-ibm-blue w-[480px] max-w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-ibm-blue-bg border-b border-border px-[18px] py-[14px]">
          <div>
            <h3 id="contact-modal-title" className="text-[14px] font-semibold text-fg leading-snug">
              {contact.name}
            </h3>
            <p className="text-[11px] text-muted mt-0.5">{contact.role}</p>
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
          {/* Avatar + name row */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0"
              style={{ background: color }}
            >
              {contact.initials}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-fg">{contact.name}</div>
              <div className="text-[12px] text-muted">{contact.role}</div>
            </div>
          </div>

          {/* Go to for */}
          <section className="mb-4">
            <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
              Go to for
            </h4>
            <p className="text-[13px] text-fg leading-[1.65]">{contact.description}</p>
          </section>

          {/* Contact details — only if fields exist */}
          {(contact.email || contact.slackHandle) && (
            <section className="mb-4">
              <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
                Contact
              </h4>
              {contact.email && (
                <div className="flex gap-3 mb-1.5 items-start">
                  <strong className="text-[11.5px] font-semibold text-muted min-w-[56px] shrink-0">Email</strong>
                  <span className="text-[13px] text-fg">{contact.email}</span>
                </div>
              )}
              {contact.slackHandle && (
                <div className="flex gap-3 items-start">
                  <strong className="text-[11.5px] font-semibold text-muted min-w-[56px] shrink-0">Slack</strong>
                  <span className="text-[13px] text-fg">{contact.slackHandle}</span>
                </div>
              )}
            </section>
          )}

          {/* Bob chips */}
          <section className="mb-4">
            <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
              Bob — Reach Out
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
