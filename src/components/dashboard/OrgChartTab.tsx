'use client';

import { useState, useEffect } from 'react';
import type { OrgNode } from '@/lib/api-types';
import { OrgModal } from '@/components/dashboard/OrgModal';

// ── Types ───────────────────────────────────────────────────────────────────

interface OrgChartTabProps {
  onAskBob?: (prompt: string) => void;
}

// ── Section label map ───────────────────────────────────────────────────────
// Maps hierarchy level to a human-readable section label. The highest level in
// the tree is always the top of the org; deeper levels narrow toward the user.

const LEVEL_LABELS: Record<number, string> = {
  0: 'IBM UK & Ireland Leadership',
  1: 'Division Leadership',
  2: 'Your Department',
  3: 'Your Immediate Team',
};

// ── Node card ───────────────────────────────────────────────────────────────

interface NodeCardProps {
  node: OrgNode;
  onSelect: (n: OrgNode) => void;
}

function NodeCard({ node, onSelect }: NodeCardProps) {
  return (
    <div
      className="flex flex-col items-center cursor-pointer group"
      onClick={() => onSelect(node)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(node)}
      aria-label={`View profile of ${node.name}`}
    >
      {/* Avatar circle */}
      <div
        className={[
          'w-14 h-14 rounded-full flex items-center justify-center text-[13px] font-bold text-white',
          'group-hover:opacity-90 transition-opacity',
          node.isCurrentUser ? 'ring-4 ring-[#f1c21b] ring-offset-2' : '',
        ].join(' ')}
        style={{ background: node.color }}
      >
        {node.initials}
      </div>
      {/* Name + role */}
      <div className="mt-1.5 text-center max-w-[90px]">
        <div className="text-[11.5px] font-semibold text-fg leading-tight truncate">
          {node.name}
        </div>
        <div className="text-[10px] text-muted leading-tight truncate">
          {node.role.split(',')[0]}
        </div>
      </div>
      {/* YOU tag */}
      {node.isCurrentUser && (
        <div className="mt-1 text-[9px] font-bold px-1.5 py-0.5 bg-[#f1c21b] text-[#1c1c1e]">
          YOU
        </div>
      )}
    </div>
  );
}

// ── OrgChartTab ─────────────────────────────────────────────────────────────

const BOB_ORG_CHIPS = [
  '"Who should I meet in my first week?"',
  '"Tell me about my manager"',
  '"Draft an intro email to the team"',
  '"What does the VP of Consulting focus on?"',
];

export function OrgChartTab({ onAskBob }: OrgChartTabProps) {
  const [nodes, setNodes]   = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrgNode | null>(null);

  useEffect(() => {
    fetch('/api/org-chart')
      .then((r) => r.json())
      .then((data: OrgNode[]) => setNodes(Array.isArray(data) ? data : []))
      .catch(() => setNodes([]))
      .finally(() => setLoading(false));
  }, []);

  // Group nodes by level, sorted ascending
  const levels = Array.from(new Set(nodes.map((n) => n.level))).sort((a, b) => a - b);
  const nodesByLevel: Map<number, OrgNode[]> = new Map(
    levels.map((lv) => [lv, nodes.filter((n) => n.level === lv)])
  );

  return (
    <>
      <div className="bg-card-bg border border-border border-t-[3px] border-t-ibm-blue overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-subtle">
          <h3 className="text-[14px] font-semibold text-fg">
            IBM Future Now — Organisation Chart
          </h3>
          <span className="text-[10px] font-bold text-ibm-blue uppercase tracking-[0.06em]">
            Click anyone · You are highlighted in gold
          </span>
        </div>

        <div className="p-5">
          {/* Bob tip callout */}
          <div className="flex gap-3 bg-ibm-blue-bg border-l-4 border-l-ibm-blue px-3 py-3 mb-6 rounded-sm">
            <div className="shrink-0 w-7 h-7 rounded-full bg-ibm-blue text-white text-[11px] font-bold flex items-center justify-center">
              B
            </div>
            <div>
              <p className="text-[13px] text-fg leading-[1.6]">
                <strong>Bob tip:</strong> Click on anyone in the chart to see their background,
                focus areas, and how best to work with them.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {BOB_ORG_CHIPS.slice(0, 2).map((chip) => (
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

          {/* Tree */}
          {loading ? (
            <p className="text-sm text-muted py-8 text-center">Loading org chart…</p>
          ) : (
            <div className="flex flex-col items-center">
              {levels.map((level, idx) => {
                const levelNodes = nodesByLevel.get(level) ?? [];
                const label = LEVEL_LABELS[level] ?? `Level ${level}`;
                return (
                  <div key={level} className="w-full flex flex-col items-center">
                    {/* Connector from previous level */}
                    {idx > 0 && (
                      <div className="w-px h-8 bg-ibm-blue/30 mx-auto" />
                    )}

                    {/* Section label */}
                    <div className="text-[10.5px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-3 px-4 py-1 bg-ibm-blue-bg border border-[#d0e2ff]">
                      {label}
                    </div>

                    {/* Horizontal connector line for multi-node levels */}
                    {levelNodes.length > 1 && (
                      <div
                        className="h-px bg-ibm-blue/30 mb-0"
                        style={{ width: `${Math.min(levelNodes.length * 120, 900)}px`, maxWidth: '100%' }}
                      />
                    )}

                    {/* Node row */}
                    <div className="flex flex-wrap justify-center gap-8 mt-0 mb-2">
                      {levelNodes.map((node) => (
                        <div key={node.nodeId} className="flex flex-col items-center">
                          {/* Short vertical connector down to node */}
                          {levelNodes.length > 1 && (
                            <div className="w-px h-4 bg-ibm-blue/30" />
                          )}
                          <NodeCard node={node} onSelect={setSelected} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <OrgModal node={selected} onClose={() => setSelected(null)} />
    </>
  );
}
