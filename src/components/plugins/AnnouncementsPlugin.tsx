'use client';

import { useMemo } from 'react';
import type { AnnouncementsConfig } from '@/plugins/schemas/announcements';

interface AnnouncementsPluginProps {
  config: AnnouncementsConfig;
}

const AUDIENCE_STYLES: Record<string, { label: string; borderClass: string; bgClass: string; pillBg: string; pillFg: string }> = {
  all:    { label: 'All Staff',    borderClass: 'border-ibm-blue', bgClass: 'bg-ibm-blue-bg', pillBg: 'bg-card-bg', pillFg: 'text-ibm-blue' },
  cohort: { label: 'Your Cohort', borderClass: 'border-purple',   bgClass: 'bg-purple-bg',   pillBg: 'bg-card-bg', pillFg: 'text-purple'   },
  team:   { label: 'Your Team',   borderClass: 'border-green',    bgClass: 'bg-green-bg',    pillBg: 'bg-card-bg', pillFg: 'text-green'    },
};

export function AnnouncementsPlugin({ config }: AnnouncementsPluginProps) {
  const now = useMemo(() => new Date(), []);

  const activeItems = useMemo(
    () => config.items.filter((item) => !item.expiresAt || new Date(item.expiresAt) > now),
    [config.items, now]
  );

  if (activeItems.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-3 text-fg">{config.title}</h2>
      <div className="flex flex-col gap-3">
        {activeItems.map((item) => {
          const s = AUDIENCE_STYLES[item.audience] ?? AUDIENCE_STYLES.all;
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${s.borderClass} ${s.bgClass}`}
            >
              <p className="flex-1 text-sm font-medium text-fg">{item.message}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${s.pillBg} ${s.pillFg}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
