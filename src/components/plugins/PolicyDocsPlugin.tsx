'use client';

import type { PolicyDocsConfig } from '@/plugins/schemas/policy-docs';

interface PolicyDocsPluginProps {
  config: PolicyDocsConfig;
}

export function PolicyDocsPlugin({ config }: PolicyDocsPluginProps) {
  return (
    <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
      <h2 className="text-base font-bold mb-4 text-fg">{config.title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="border-b border-border">
              {['Resource', 'What it covers', 'View', 'Ask Bob'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold py-2 px-3 text-muted bg-surface">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {config.documents.map((doc) => (
              <tr key={doc.id} className="border-b border-subtle last:border-0">
                <td className="py-3 px-3 font-semibold text-sm text-fg">{doc.title}</td>
                <td className="py-3 px-3 text-sm text-muted">{doc.description}</td>
                <td className="py-3 px-3">
                  <button className="text-xs font-semibold px-3 py-1 rounded-lg border border-border text-ibm-blue hover:bg-surface transition-colors">
                    View
                  </button>
                </td>
                <td className="py-3 px-3">
                  {doc.askBobPrompt ? (
                    <span
                      className="text-xs px-2 py-1 rounded-full cursor-default bg-ibm-blue-bg text-ibm-blue"
                      title="Ask Bob (Phase 2)"
                    >
                      &ldquo;{doc.askBobPrompt}&rdquo;
                    </span>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
