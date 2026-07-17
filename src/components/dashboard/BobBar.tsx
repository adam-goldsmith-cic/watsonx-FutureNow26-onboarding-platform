'use client';

import { useState } from 'react';

interface BobBarProps {
  suggestions: string[];
}

const chipBorderStyle = { border: '1px solid rgba(255,255,255,.15)' } as const;
const inputStyle = {
  background: 'rgba(0,0,0,.3)',
  border: '1px solid rgba(255,255,255,.15)',
} as const;

export function BobBar({ suggestions }: BobBarProps) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);

  function handleSubmit() {
    if (!input.trim()) return;
    setResponse('Bob is coming in Phase 2 — stay tuned!');
    setInput('');
  }

  function handleChip(chip: string) {
    setInput(chip);
    setResponse(null);
  }

  return (
    <div className="bg-hero-bg border-b-2 border-ibm-blue">
      {/* Input row */}
      <div className="max-w-[1200px] mx-auto flex items-center gap-2.5 px-6 py-4 pb-2.5">
        {/* Label */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-ibm-blue shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-hero-muted">
            Ask Bob
          </span>
        </div>

        {/* Text input */}
        <input
          type="text"
          className="flex-1 text-[13px] text-hero-text placeholder:text-hero-muted px-3 py-[7px] outline-none focus:border-ibm-blue"
          style={inputStyle}
          placeholder={`Ask anything... e.g. "What should I do today?" or "Summarise the expense policy"`}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResponse(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-ibm-blue text-hero-text text-xs font-semibold px-4 py-2 whitespace-nowrap hover:opacity-90 transition-opacity cursor-pointer"
        >
          Ask Bob →
        </button>
      </div>

      {/* Suggestion chips row */}
      <div className="max-w-[1200px] mx-auto flex gap-1.5 px-6 pb-4 overflow-x-auto scrollbar-hide">
        {suggestions.map((sug) => (
          <button
            key={sug}
            type="button"
            onClick={() => handleChip(sug)}
            className="bg-transparent text-hero-muted text-[11px] px-2.5 py-0.5 whitespace-nowrap cursor-pointer hover:bg-white/5 hover:text-hero-text transition-colors shrink-0"
            style={chipBorderStyle}
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Placeholder response */}
      {response && (
        <div className="max-w-[1200px] mx-auto px-6 pb-4">
          <div className="flex items-start gap-2 bg-ibm-blue-bg border border-border rounded px-3 py-2 text-sm text-fg">
            <span className="text-ibm-blue font-bold shrink-0">Bob:</span>
            <span>{response}</span>
          </div>
        </div>
      )}
    </div>
  );
}
