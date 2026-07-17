'use client';

import { useState } from 'react';
import type { SentimentMood } from '@/lib/api-types';

interface SentimentWidgetProps {
  userName: string;
}

const MOOD_OPTIONS: { mood: SentimentMood; emoji: string; label: string }[] = [
  { mood: 'overwhelmed',   emoji: '😰', label: 'Overwhelmed'  },
  { mood: 'getting-there', emoji: '😐', label: 'Getting there' },
  { mood: 'good',          emoji: '🙂', label: 'Good'          },
  { mood: 'excellent',     emoji: '😄', label: 'Excellent'     },
];

export function SentimentWidget({ userName }: SentimentWidgetProps) {
  const firstName = userName.split(' ')[0];
  const [selected, setSelected]   = useState<SentimentMood | null>(null);
  const [notes, setNotes]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selected, notes: notes.trim() || null }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch {
      setError('Could not save — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="px-3 py-4 text-center">
        <div className="text-2xl mb-2">✅</div>
        <p className="text-sm font-semibold text-fg mb-1">Thanks, {firstName}!</p>
        <p className="text-xs text-muted">
          Bob will use this to personalise your support.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <p className="text-xs text-muted mb-2.5">
        How are you feeling this week, {firstName}?
      </p>

      {/* Emoji selector */}
      <div className="flex justify-between gap-1 mb-2.5">
        {MOOD_OPTIONS.map(({ mood, emoji, label }) => {
          const isSelected = selected === mood;
          return (
            <button
              key={mood}
              type="button"
              onClick={() => setSelected(mood)}
              className={[
                'flex flex-col items-center gap-1 flex-1 py-2 px-1 cursor-pointer',
                'border-2 transition-all duration-100',
                isSelected
                  ? 'bg-ibm-blue-bg border-ibm-blue'
                  : 'bg-subtle border-transparent hover:border-border',
              ].join(' ')}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span className="text-[9.5px] text-muted text-center leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Notes textarea */}
      <textarea
        rows={2}
        placeholder="Anything to flag? Where are you stuck?"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full border border-border bg-subtle text-xs text-fg px-2 py-1.5 resize-none outline-none mb-2 focus:border-ibm-blue focus:bg-card-bg"
      />

      {error && (
        <p className="text-xs text-red mb-1.5">{error}</p>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected || submitting}
        className="w-full bg-ibm-blue text-hero-text text-xs font-semibold py-2 text-center cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit to Bob →'}
      </button>

      <p className="text-[10px] text-faint mt-1.5 text-center leading-tight">
        Responses are anonymised. Bob uses this to personalise your support.
      </p>
    </div>
  );
}
