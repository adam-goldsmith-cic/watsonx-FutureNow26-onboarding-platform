'use client';

import type { Meeting } from '@/lib/api-types';

interface MeetingModalProps {
  meeting: Meeting | null;
  onClose: () => void;
}

export function MeetingModal({ meeting, onClose }: MeetingModalProps) {
  if (!meeting) return null;

  const durationLabel = meeting.duration < 60
    ? `${meeting.duration} min`
    : `${meeting.duration / 60} hr${meeting.duration > 60 ? 's' : ''}`;

  const isUrl = meeting.location.startsWith('http://') || meeting.location.startsWith('https://');

  // Format subtitle: time · location
  const subtitle = `${meeting.startTime} · ${meeting.location}`;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(0,10,50,0.65)] p-5"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="meeting-modal-title"
    >
      {/* Modal panel — stop clicks propagating to backdrop */}
      <div
        className="bg-card-bg border-t-4 border-t-ibm-blue w-[520px] max-w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-ibm-blue-bg border-b border-border px-[18px] py-[14px]">
          <div>
            <h3 id="meeting-modal-title" className="text-[14px] font-semibold text-fg leading-snug">
              {meeting.title}
            </h3>
            <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[20px] text-muted hover:text-fg leading-none px-1 cursor-pointer bg-transparent border-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-[18px]">
          {/* Detail rows */}
          <div className="mb-4">
            <DetailRow label="Time"      value={meeting.startTime} />
            <DetailRow label="Duration"  value={durationLabel} />
            <DetailRow label="Location"  value={meeting.location} />
            <DetailRow label="Attendees" value={meeting.attendees.join(', ')} />
          </div>

          {/* About this meeting */}
          <section className="mb-4">
            <SectionHeading>About this meeting</SectionHeading>
            <p className="text-[13px] text-fg leading-[1.65]">{meeting.bobPrepNote}</p>
          </section>

          {/* Bob prep tips */}
          <section className="mb-4">
            <SectionHeading>Bob&apos;s prep tips</SectionHeading>
            <div className="flex gap-3 bg-ibm-blue-bg border-l-4 border-l-ibm-blue px-3 py-3 rounded-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-ibm-blue text-white text-[10px] font-bold flex items-center justify-center">
                B
              </div>
              <p className="text-[12px] text-fg leading-[1.6]">{meeting.bobPrepNote}</p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-2 pt-[14px] border-t border-border">
            {isUrl ? (
              <a
                href={meeting.location}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-white bg-ibm-blue rounded hover:bg-[#1560a8] transition-colors"
              >
                Join Meeting
              </a>
            ) : (
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-white bg-ibm-blue rounded hover:bg-[#1560a8] transition-colors cursor-pointer"
              >
                Join Meeting
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-fg border border-border rounded hover:bg-subtle transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 mb-[10px] items-start">
      <strong className="text-[11.5px] font-semibold text-muted min-w-[80px] shrink-0">{label}</strong>
      <span className="text-[13px] text-fg">{value}</span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
      {children}
    </h4>
  );
}
