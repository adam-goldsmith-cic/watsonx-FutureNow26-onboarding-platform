'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { OrgPluginConfig } from '@/lib/api-types';

const CATEGORY_PILL: Record<string, { bg: string; fg: string }> = {
  core:    { bg: 'bg-ibm-blue-bg', fg: 'text-ibm-blue' },
  hr:      { bg: 'bg-pink-bg',     fg: 'text-pink'      },
  it:      { bg: 'bg-purple-bg',   fg: 'text-purple'    },
  learning:{ bg: 'bg-amber-bg',    fg: 'text-amber'     },
  comms:   { bg: 'bg-green-bg',    fg: 'text-green'     },
  custom:  { bg: 'bg-subtle',      fg: 'text-muted'     },
};

const PLUGIN_META: Record<string, { name: string; category: string; description: string }> = {
  announcements: { name: 'Announcements',        category: 'comms',    description: 'Banner messages for new starters' },
  checklist:     { name: 'Task Checklist',        category: 'core',     description: 'Onboarding task list with state tracking' },
  training:      { name: 'Training Tracker',      category: 'learning', description: 'Compliance courses and progress' },
  'faq-links':   { name: 'FAQ & Quick Links',     category: 'core',     description: 'Quick-access tiles to key portals' },
  'plan-90':     { name: '30/60/90 Day Plan',     category: 'core',     description: 'Milestone goals for first 90 days' },
  contacts:      { name: 'Key Contacts & Tools',  category: 'hr',       description: 'Key contacts and tools setup status' },
  'policy-docs': { name: 'Policy Documents',      category: 'hr',       description: 'Policy library with Ask Bob prompts' },
};

export default function AdminPage() {
  const [plugins, setPlugins] = useState<OrgPluginConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlugins(data.sort((a, b) => a.order - b.order));
      });
  }, []);

  const save = useCallback(async (updated: OrgPluginConfig[]) => {
    setSaving(true);
    setSaved(false);
    await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  function toggleEnabled(pluginId: string) {
    const updated = plugins.map((p) =>
      p.pluginId === pluginId ? { ...p, enabled: !p.enabled } : p
    );
    setPlugins(updated);
    save(updated);
  }

  function move(pluginId: string, direction: 'up' | 'down') {
    const sorted = [...plugins].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((p) => p.pluginId === pluginId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const updated = sorted.map((p, i) => {
      if (i === idx) return { ...p, order: sorted[swapIdx].order };
      if (i === swapIdx) return { ...p, order: sorted[idx].order };
      return p;
    });
    setPlugins(updated.sort((a, b) => a.order - b.order));
    save(updated);
  }

  function updateAnnouncementMessage(itemId: string, message: string) {
    const updated = plugins.map((p) => {
      if (p.pluginId !== 'announcements') return p;
      const config = p.config as { title: string; items: Array<{ id: string; message: string; [key: string]: unknown }> };
      return {
        ...p,
        config: {
          ...config,
          items: config.items.map((item) =>
            item.id === itemId ? { ...item, message } : item
          ),
        },
      };
    });
    setPlugins(updated);
  }

  const announcementsPlugin = plugins.find((p) => p.pluginId === 'announcements');
  const announcementsConfig = announcementsPlugin?.config as
    | { title: string; items: Array<{ id: string; message: string; audience: string }> }
    | undefined;

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1 text-faint">
              IBM Onboarding Platform
            </p>
            <h1 className="text-2xl font-extrabold text-fg">Admin Config Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-muted">Saving…</span>}
            {saved && <span className="text-xs font-semibold text-green">✓ Saved</span>}
            <Link
              href="/dashboard"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-ibm-blue text-hero-text hover:opacity-90 transition-opacity"
            >
              View Dashboard →
            </Link>
          </div>
        </div>

        {/* Phase 1 warning */}
        <div className="flex items-start gap-3 p-4 rounded-xl border-l-4 border-amber bg-amber-bg mb-6 text-sm">
          <span className="text-lg leading-none">⚠</span>
          <div>
            <p className="font-semibold mb-0.5 text-amber">Phase 1 — No access control</p>
            <p className="text-muted">
              This admin portal is accessible to anyone in Phase 1. Real role-based access control
              (OIDC + RBAC) will be added in Phase 2.
            </p>
          </div>
        </div>

        {/* Plugin list */}
        <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
          <h2 className="text-base font-bold mb-1 text-fg">Plugin Configuration</h2>
          <p className="text-sm mb-5 text-muted">
            Toggle plugins on/off and reorder them. Changes are saved immediately.
          </p>
          <div className="flex flex-col gap-3">
            {[...plugins].sort((a, b) => a.order - b.order).map((plugin, idx) => {
              const meta = PLUGIN_META[plugin.pluginId];
              const pill = CATEGORY_PILL[meta?.category ?? 'custom'];
              const isFirst = idx === 0;
              const isLast = idx === plugins.length - 1;

              return (
                <div
                  key={plugin.pluginId}
                  className={`flex items-center gap-4 p-4 rounded-xl border border-border transition-opacity ${plugin.enabled ? '' : 'opacity-50'}`}
                >
                  {/* Order controls */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => move(plugin.pluginId, 'up')}
                      disabled={isFirst}
                      className="text-xs px-1.5 py-0.5 rounded border border-border text-muted disabled:opacity-20 hover:bg-surface"
                      aria-label="Move up"
                    >▲</button>
                    <button
                      onClick={() => move(plugin.pluginId, 'down')}
                      disabled={isLast}
                      className="text-xs px-1.5 py-0.5 rounded border border-border text-muted disabled:opacity-20 hover:bg-surface"
                      aria-label="Move down"
                    >▼</button>
                  </div>

                  {/* Order number */}
                  <span className="text-sm font-extrabold w-5 text-center text-faint">{idx + 1}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-fg">{meta?.name ?? plugin.pluginId}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pill?.bg} ${pill?.fg}`}>
                        {meta?.category ?? 'custom'}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{meta?.description}</p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleEnabled(plugin.pluginId)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                    style={{ background: plugin.enabled ? '#1f70c1' : '#d1d5db' }}
                    aria-label={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                  >
                    <span
                      className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"
                      style={{ transform: plugin.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Announcement editor */}
        {announcementsConfig && (
          <div className="bg-card-bg rounded-xl border border-border p-6">
            <h2 className="text-base font-bold mb-1 text-fg">Edit Announcements</h2>
            <p className="text-sm mb-5 text-muted">
              Edit announcement messages below. Click &quot;Save Announcements&quot; to apply.
            </p>
            <div className="flex flex-col gap-4">
              {announcementsConfig.items.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-xs font-semibold text-muted">Audience:</label>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize bg-ibm-blue-bg text-ibm-blue">
                      {item.audience}
                    </span>
                  </div>
                  <textarea
                    className="w-full text-sm text-fg px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 resize-none bg-card-bg"
                    rows={2}
                    value={item.message}
                    onChange={(e) => updateAnnouncementMessage(item.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => save(plugins)}
              className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg bg-ibm-blue text-hero-text hover:opacity-90 transition-opacity"
            >
              Save Announcements
            </button>
          </div>
        )}

        <p className="text-xs text-center mt-8 text-faint">
          IBM Onboarding Platform · Phase 1 · Made with IBM Bob
        </p>
      </div>
    </div>
  );
}
