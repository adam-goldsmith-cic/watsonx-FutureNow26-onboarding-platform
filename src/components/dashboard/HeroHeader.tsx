'use client';

import { useMemo } from 'react';
import type { UserProfile } from '@/lib/api-types';

interface HeroHeaderProps {
  user: UserProfile;
  totalTasks: number;
  doneTasks: number;
  meetingsToday: number;
  slackUnreads: number;
}

export function HeroHeader({
  user,
  totalTasks,
  doneTasks,
  meetingsToday,
  slackUnreads,
}: HeroHeaderProps) {
  const { dayNumber, progressPct } = useMemo(() => {
    const start = new Date(user.startDate ?? new Date().toISOString().split('T')[0]);
    const today = new Date();
    const daysDiff = Math.max(
      0,
      Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const dayNumber = daysDiff + 1;
    const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return { dayNumber, progressPct };
  }, [user.startDate, totalTasks, doneTasks]);

  const kpiTileStyle = {
    background: 'rgba(0,0,0,.25)',
    border: '1px solid rgba(255,255,255,.1)',
  } as const;

  const kpis = [
    { value: dayNumber, sup: ordinalSuffix(dayNumber), label: 'Day at IBM', detail: 'Great start' },
    { value: progressPct, sup: '%', label: 'Progress', detail: 'On track' },
    { value: meetingsToday, sup: '', label: 'Meetings Today', detail: 'See calendar' },
    { value: slackUnreads, sup: '', label: 'Slack Unreads', detail: 'Check in' },
  ];

  return (
    <div className="bg-hero-bg rounded-2xl px-10 py-10 mb-6">
      <div className="flex items-end justify-between gap-5">
        {/* Left — welcome text */}
        <div className="pb-1">
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5 text-hero-muted">
            IBM Future Now · Onboarding Platform
          </p>
          <h1 className="text-3xl font-extrabold text-hero-text mb-1">
            Welcome, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-hero-muted mb-4">
            Started{' '}
            {new Date(user.startDate ?? new Date().toISOString().split('T')[0]).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          {/* Progress bar */}
          <div className="max-w-sm">
            <div className="flex justify-between text-xs mb-1 text-hero-muted">
              <span>{progressPct}% complete</span>
              <span>
                {doneTasks} / {totalTasks} tasks done
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-hero-track">
              <div
                className="h-full rounded-full bg-ibm-blue transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right — KPI tiles */}
        <div className="flex gap-2 mb-1 shrink-0">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="px-3.5 py-3 text-center min-w-[88px]"
              style={kpiTileStyle}
            >
              <div className="text-2xl font-light leading-none text-hero-text">
                {kpi.value}
                {kpi.sup && <sup className="text-[11px]">{kpi.sup}</sup>}
              </div>
              <div className="text-[9.5px] uppercase tracking-wide mt-1 text-hero-muted">
                {kpi.label}
              </div>
              <div className="text-[9.5px] font-semibold mt-0.5 text-green">
                {kpi.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'st';
  if (mod10 === 2 && mod100 !== 12) return 'nd';
  if (mod10 === 3 && mod100 !== 13) return 'rd';
  return 'th';
}
