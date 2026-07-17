'use client';

import { useState, useEffect } from 'react';
import type { Meeting } from '@/lib/api-types';
import { MeetingModal } from '@/components/dashboard/MeetingModal';

// ── Types ───────────────────────────────────────────────────────────────────

interface CalendarTabProps {
  onAskBob?: (prompt: string) => void;
}

// ── Status pill computation ─────────────────────────────────────────────────

type PillKind = 'done' | 'now' | 'soon' | 'urgent' | 'community' | 'future';

interface StatusPill {
  kind: PillKind;
  label: string;
}

function computePill(meeting: Meeting, now: Date): StatusPill {
  if (meeting.status === 'done') {
    return { kind: 'done', label: 'Done' };
  }
  if (meeting.status === 'happening-now') {
    return { kind: 'now', label: 'Happening Now' };
  }

  const meetingDate = new Date(meeting.date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mDay  = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());

  const diffDays = Math.round((mDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return { kind: 'done', label: 'Done' };
  }

  if (diffDays === 0) {
    // Same day — compute hours until start
    const [hStr, mStr] = meeting.startTime.split(':');
    const startMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const hoursAway = (startMins - nowMins) / 60;

    if (hoursAway <= 0) {
      return { kind: 'now', label: 'Happening Now' };
    }
    const roundedH = Math.round(hoursAway * 2) / 2; // round to nearest 0.5
    const label = roundedH === Math.round(roundedH)
      ? `In ${Math.round(roundedH)}h`
      : `In ${roundedH}h`;
    return { kind: 'soon', label };
  }

  if (diffDays === 1) return { kind: 'future', label: 'Tomorrow' };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { kind: 'future', label: dayNames[meetingDate.getDay()] };
}

// ── Time-block colour ────────────────────────────────────────────────────────

function timeBlockClasses(meeting: Meeting, pill: StatusPill): { className: string; style?: React.CSSProperties } {
  if (meeting.status === 'done' || pill.kind === 'done') {
    return { className: 'bg-green' };
  }
  if (pill.kind === 'urgent') {
    return { className: '', style: { background: '#da1e28' } };
  }
  // Detect community events by a teal colour flag — check title heuristic
  // (In real data this would be a field; here we match the V2 seed data pattern)
  if (meeting.title.toLowerCase().includes('community')) {
    return { className: '', style: { background: '#009d9a' } };
  }
  return { className: 'bg-ibm-blue' };
}

// ── Pill styling ─────────────────────────────────────────────────────────────

function pillClasses(kind: PillKind): string {
  switch (kind) {
    case 'done':      return 'text-green bg-green-bg border border-green';
    case 'now':       return 'text-amber bg-amber-bg border border-amber';
    case 'soon':      return 'text-ibm-blue bg-ibm-blue-bg border border-ibm-blue';
    case 'urgent':    return 'text-red bg-red-bg border border-red';
    case 'community': return 'text-purple bg-purple-bg border border-purple';
    case 'future':    return 'text-muted bg-subtle border border-border';
    default:          return 'text-muted bg-subtle border border-border';
  }
}

// ── Week helpers ─────────────────────────────────────────────────────────────

function getWeekDays(now: Date): Date[] {
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDayHeader(d: Date, today: Date): string {
  const days   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const base   = `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  const todayIso   = isoDate(today);
  const dIso       = isoDate(d);
  if (dIso === todayIso)           return `${base} — Today`;
  if (d < today) {
    // past day — mark complete
    return `${base} — Complete`;
  }
  return base;
}

function durationLabel(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = mins / 60;
  return `${h} hr${h > 1 ? 's' : ''}`;
}

// ── Per-day glance data ──────────────────────────────────────────────────────

interface DayGlance {
  label: string;
  done: number;
  total: number;
}

function buildGlance(weekDays: Date[], meetings: Meeting[]): DayGlance[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const months   = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return weekDays.slice(0, 5).map((d) => {
    const iso = isoDate(d);
    const dayMeetings = meetings.filter((m) => m.date === iso);
    const doneMeetings = dayMeetings.filter(
      (m) => m.status === 'done' || m.status === 'happening-now'
    );
    const label = `${dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1] ?? 'Mon'} ${d.getDate()} ${months[d.getMonth()]}`;
    return { label, done: doneMeetings.length, total: dayMeetings.length };
  });
}

// ── Bob prep prompts ──────────────────────────────────────────────────────────

const BOB_PREP_CHIPS = [
  '"Prep notes for today\'s standup"',
  '"Draft my 2-min team introduction"',
  '"What should I know before the client briefing?"',
  '"Questions to ask James at coffee tomorrow"',
];

// ── CalendarTab ──────────────────────────────────────────────────────────────

export function CalendarTab({ onAskBob }: CalendarTabProps) {
  const [meetings, setMeetings]       = useState<Meeting[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedMeeting, setSelected] = useState<Meeting | null>(null);
  const [now] = useState<Date>(() => new Date());

  useEffect(() => {
    fetch('/api/meetings')
      .then((r) => r.json())
      .then((data: Meeting[]) => {
        setMeetings(Array.isArray(data) ? data : []);
      })
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, []);

  const weekDays = getWeekDays(now);
  const glanceData = buildGlance(weekDays, meetings);
  const totalCount = meetings.length;

  return (
    <>
      {/* Main two-column layout */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>

        {/* ── Main column ── */}
        <div className="min-w-0">
          {/* Card */}
          <div className="bg-card-bg border border-border border-t-[3px] border-t-ibm-blue rounded-lg overflow-hidden">

            {/* Card header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
              <h3 className="text-[14px] font-semibold text-fg">Outlook Calendar — This Week</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Microsoft Outlook badge */}
                <span
                  className="text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                  style={{ background: '#0078d4' }}
                >
                  Microsoft Outlook
                </span>
                {/* Connected pill */}
                <span className="flex items-center gap-1 text-[11px] text-green bg-green-bg border border-green px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
                  Connected · Syncing
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="p-4">

              {/* Bob callout */}
              <div className="flex gap-3 bg-ibm-blue-bg border-l-4 border-l-ibm-blue px-3 py-3 mb-5 rounded-sm">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-ibm-blue text-white text-[11px] font-bold flex items-center justify-center">
                  B
                </div>
                <div>
                  <p className="text-[13px] text-fg leading-[1.6]">
                    <strong>Bob&apos;s calendar summary:</strong> You have {loading ? '…' : totalCount} meetings this week.
                    I&apos;d recommend protecting 2 hours each morning for focused onboarding work.
                    Click any meeting to see full details and prep notes.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['"Prep notes for today\'s standup"', '"What should I know before the client briefing?"'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => onAskBob?.(chip.replace(/^"|"$/g, ''))}
                        className="text-[11px] text-ibm-blue border border-ibm-blue bg-card-bg px-2.5 py-1 rounded-full hover:bg-ibm-blue-bg transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Day sections */}
              {loading ? (
                <p className="text-sm text-muted py-8 text-center">Loading meetings…</p>
              ) : (
                weekDays.map((day) => {
                  const iso = isoDate(day);
                  const dayMeetings = meetings
                    .filter((m) => m.date === iso)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));
                  if (dayMeetings.length === 0) return null;
                  return (
                    <DaySection
                      key={iso}
                      day={day}
                      today={now}
                      meetings={dayMeetings}
                      now={now}
                      onSelect={setSelected}
                    />
                  );
                })
              )}

            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* This Week at a Glance */}
          <div className="bg-card-bg border border-border border-t-[3px] border-t-ibm-blue rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[14px] font-semibold text-fg">This Week at a Glance</h3>
            </div>
            <div className="px-4 py-3 space-y-3">
              {glanceData.map((row) => {
                const pct = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0;
                const isComplete = row.total > 0 && row.done === row.total;
                return (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted w-[78px] shrink-0">{row.label}</span>
                    <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isComplete ? 'bg-green' : 'bg-ibm-blue'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted w-7 text-right shrink-0">
                      {row.done}/{row.total}
                    </span>
                  </div>
                );
              })}
              {glanceData.every((r) => r.total === 0) && (
                <p className="text-[12px] text-muted text-center py-2">No meetings this week</p>
              )}
            </div>
          </div>

          {/* Bob — Meeting Prep */}
          <div className="bg-card-bg border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-ibm-nav">
              <h3 className="text-[14px] font-semibold text-white">Bob — Meeting Prep</h3>
            </div>
            <div className="px-3 py-3 bg-ibm-blue-bg flex flex-col gap-2">
              {BOB_PREP_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onAskBob?.(chip.replace(/^"|"$/g, ''))}
                  className="text-[11.5px] text-fg bg-card-bg border border-border px-3 py-2 rounded text-left hover:bg-subtle transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Meeting detail modal */}
      <MeetingModal meeting={selectedMeeting} onClose={() => setSelected(null)} />
    </>
  );
}

// ── DaySection sub-component ─────────────────────────────────────────────────

interface DaySectionProps {
  day: Date;
  today: Date;
  meetings: Meeting[];
  now: Date;
  onSelect: (m: Meeting) => void;
}

function DaySection({ day, today, meetings, now, onSelect }: DaySectionProps) {
  const header = formatDayHeader(day, today);
  return (
    <div className="mb-5">
      <div className="text-[11.5px] font-semibold text-muted uppercase tracking-[0.06em] mb-2 pb-1 border-b border-border">
        {header}
      </div>
      <div className="flex flex-col gap-0.5">
        {meetings.map((m) => (
          <MeetingRow key={m.meetingId} meeting={m} now={now} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

// ── MeetingRow sub-component ──────────────────────────────────────────────────

interface MeetingRowProps {
  meeting: Meeting;
  now: Date;
  onSelect: (m: Meeting) => void;
}

function MeetingRow({ meeting, now, onSelect }: MeetingRowProps) {
  const pill = computePill(meeting, now);
  const timeBlock = timeBlockClasses(meeting, pill);

  return (
    <div
      className="flex items-stretch border border-border bg-card-bg hover:bg-subtle transition-colors cursor-pointer rounded"
      onClick={() => onSelect(meeting)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(meeting)}
      aria-label={`Open details for ${meeting.title}`}
    >
      {/* Time block */}
      <div
        className={`flex-shrink-0 w-16 flex flex-col items-center justify-center py-2.5 px-1 text-white ${timeBlock.className}`}
        style={timeBlock.style}
      >
        <span className="text-[12px] font-bold leading-tight">{meeting.startTime}</span>
        <span className="text-[9px] text-white/75 mt-0.5">{durationLabel(meeting.duration)}</span>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <div className="text-[13px] font-semibold text-fg leading-snug mb-0.5 truncate">
          {meeting.title}
        </div>
        <div className="text-[11px] text-muted flex gap-2.5 flex-wrap">
          <span>{meeting.location}</span>
          {meeting.attendees.length > 0 && (
            <span>
              {meeting.attendees.length === 1
                ? meeting.attendees[0]
                : `${meeting.attendees.length} attendees`}
            </span>
          )}
        </div>
      </div>

      {/* Right: pill + optional join */}
      <div
        className="flex flex-col items-end justify-center gap-1.5 px-3 py-2.5 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status pill */}
        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${pillClasses(pill.kind)}`}>
          {pill.label}
        </span>

        {/* Join button — only for happening-now */}
        {(meeting.status === 'happening-now' || pill.kind === 'now') && (
          <button
            type="button"
            onClick={() => onSelect(meeting)}
            className="text-[11px] font-semibold px-2.5 py-1 text-white bg-ibm-blue rounded hover:bg-[#1560a8] transition-colors cursor-pointer"
          >
            Join Teams
          </button>
        )}
      </div>
    </div>
  );
}
