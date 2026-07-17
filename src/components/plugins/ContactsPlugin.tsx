'use client';

import { useState } from 'react';
import type { ContactsConfig, KeyContact, ToolStatus } from '@/plugins/schemas/contacts';
import { ContactModal } from '@/components/dashboard/ContactModal';

interface ContactsPluginProps {
  config: ContactsConfig;
}

const AVATAR_PALETTE = [
  { bg: 'bg-ibm-blue-bg', fg: 'text-ibm-blue' },
  { bg: 'bg-purple-bg',   fg: 'text-purple'   },
  { bg: 'bg-pink-bg',     fg: 'text-pink'      },
  { bg: 'bg-amber-bg',    fg: 'text-amber'     },
];

const TOOL_STATUS_STYLES: Record<ToolStatus, { label: string; bg: string; fg: string }> = {
  'done':         { label: 'Done',        bg: 'bg-green-bg',  fg: 'text-green' },
  'in-progress':  { label: 'In Progress', bg: 'bg-amber-bg',  fg: 'text-amber' },
  'not-started':  { label: 'Not Started', bg: 'bg-subtle',    fg: 'text-muted' },
};

export function ContactsPlugin({ config }: ContactsPluginProps) {
  const [selected, setSelected] = useState<KeyContact | null>(null);

  return (
    <>
      <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
        <h2 className="text-base font-bold mb-4 text-fg">{config.title}</h2>

        <h3 className="text-sm font-semibold mb-3 text-muted">Key Contacts</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {config.contacts.map((contact, idx) => {
            const { bg, fg } = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-ibm-blue-bg transition-colors"
                onClick={() => setSelected(contact)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelected(contact)}
                aria-label={`View contact details for ${contact.name}`}
              >
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${bg} ${fg}`}>
                  {contact.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight text-fg">{contact.name}</p>
                  <p className="text-xs text-muted">{contact.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="text-sm font-semibold mb-3 text-muted">Tools to Set Up</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {config.tools.map((tool, idx) => {
            const { label, bg, fg } = TOOL_STATUS_STYLES[tool.status];
            return (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border">
                <span className="text-sm font-medium truncate mr-2 text-fg">{tool.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${bg} ${fg}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ContactModal contact={selected} onClose={() => setSelected(null)} />
    </>
  );
}
