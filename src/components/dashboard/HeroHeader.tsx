'use client';

import { useMemo } from 'react';
import type { UserProfile } from '@/lib/api-types';

interface HeroHeaderProps {
  user: UserProfile;
  totalTasks: number;
  doneTasks: number;
}

const MILESTONES = ['Day 1', 'Week 1', '30 Days', '90 Days'];

export function HeroHeader({ user, totalTasks, doneTasks }: HeroHeaderProps) {
  const { weekNumber, progressPct } = useMemo(() => {
    const start = new Date(user.startDate);
    const today = new Date();
    const daysDiff = Math.max(
      0,
      Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const weekNumber = Math.min(12, Math.floor(daysDiff / 7) + 1);
    const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return { weekNumber, progressPct };
  }, [user.startDate, totalTasks, doneTasks]);

  return (
    <div className="bg-hero-bg rounded-2xl p-8 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-hero-muted">
            IBM Future Now · Onboarding Platform
          </p>
          <h1 className="text-3xl font-extrabold text-hero-text mb-1">
            Welcome, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-hero-muted">
            Started {new Date(user.startDate).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full mt-1 bg-ibm-blue text-hero-text">
          Week {weekNumber} of 12
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1 text-hero-muted">
          <span>{progressPct}% complete</span>
          <span>{doneTasks} / {totalTasks} tasks done</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-hero-track">
          <div
            className="h-full rounded-full bg-ibm-blue transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="flex gap-4 mt-4">
        {MILESTONES.map((m) => (
          <span key={m} className="text-xs px-2 py-1 rounded bg-hero-surface text-hero-muted">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
