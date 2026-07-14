'use client';

import type { Plan90Config } from '@/plugins/schemas/plan-90';

interface Plan90PluginProps {
  config: Plan90Config;
}

const PHASE_STYLES = [
  { borderHex: '#1f70c1', dotClass: 'bg-ibm-blue', labelClass: 'text-ibm-blue' },
  { borderHex: '#7c5cd8', dotClass: 'bg-purple',   labelClass: 'text-purple'   },
  { borderHex: '#2d7a3e', dotClass: 'bg-green',    labelClass: 'text-green'    },
];

export function Plan90Plugin({ config }: Plan90PluginProps) {
  return (
    <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
      <h2 className="text-base font-bold mb-4 text-fg">{config.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {config.phases.map((phase, idx) => {
          const { borderHex, dotClass, labelClass } = PHASE_STYLES[idx] ?? PHASE_STYLES[0];
          return (
            <div
              key={idx}
              className="rounded-xl border border-border p-4"
              style={{ borderTopColor: borderHex, borderTopWidth: '4px' }}
            >
              <div className="mb-3">
                <p className={`text-xs font-extrabold uppercase tracking-wide mb-0.5 ${labelClass}`}>
                  {phase.subtitle}
                </p>
                <p className="text-sm font-bold text-fg">{phase.label}</p>
              </div>
              <ul className="space-y-2">
                {phase.goals.map((goal, gIdx) => (
                  <li key={gIdx} className="flex items-start gap-2 text-sm text-muted">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
