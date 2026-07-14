'use client';

import type { FaqLinksConfig } from '@/plugins/schemas/faq-links';

interface FaqLinksPluginProps {
  config: FaqLinksConfig;
}

const ICON_PALETTE = [
  { bg: 'bg-ibm-blue-bg', fg: 'text-ibm-blue' },
  { bg: 'bg-purple-bg',   fg: 'text-purple'   },
  { bg: 'bg-amber-bg',    fg: 'text-amber'     },
  { bg: 'bg-green-bg',    fg: 'text-green'     },
  { bg: 'bg-pink-bg',     fg: 'text-pink'      },
  { bg: 'bg-red-bg',      fg: 'text-red'       },
];

export function FaqLinksPlugin({ config }: FaqLinksPluginProps) {
  return (
    <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
      <h2 className="text-base font-bold mb-4 text-fg">{config.title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {config.links.map((link, idx) => {
          const { bg, fg } = ICON_PALETTE[idx % ICON_PALETTE.length];
          return (
            <a
              key={link.id}
              href={link.url}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:shadow-sm transition-shadow group"
            >
              <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${bg} ${fg}`}>
                {link.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-fg">{link.label}</p>
                <p className="text-xs truncate text-muted">{link.description}</p>
              </div>
              <svg
                className="w-4 h-4 flex-shrink-0 text-faint group-hover:text-muted transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
}
