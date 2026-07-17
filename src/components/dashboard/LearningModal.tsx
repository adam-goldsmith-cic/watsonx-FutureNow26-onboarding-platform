'use client';

import type { TrainingCourse } from '@/plugins/schemas/training';

interface LearningModalProps {
  course: TrainingCourse | null;
  onClose: () => void;
}

function formatDueDate(dueDate: string): string {
  try {
    return new Date(dueDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dueDate;
  }
}

export function LearningModal({ course, onClose }: LearningModalProps) {
  if (!course) return null;

  const statusLabel = {
    'not-started': 'Not Started',
    'in-progress':  'In Progress',
    'completed':    'Completed',
    'overdue':      'Overdue',
  }[course.status];

  const hasDetails = course.duration || course.platform || course.dueDate;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(0,10,50,0.65)] p-5"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="learning-modal-title"
    >
      {/* Modal panel */}
      <div
        className="bg-card-bg border-t-4 border-t-ibm-blue w-[520px] max-w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-ibm-blue-bg border-b border-border px-[18px] py-[14px]">
          <div>
            <h3 id="learning-modal-title" className="text-[14px] font-semibold text-fg leading-snug">
              {course.title}
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              {statusLabel} · {course.progress}% complete
            </p>
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
          {/* Detail rows — only rendered when at least one field exists */}
          {hasDetails && (
            <section className="mb-4">
              <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
                Course Details
              </h4>
              {course.duration && <DetailRow label="Duration"  value={course.duration} />}
              {course.platform && <DetailRow label="Platform"  value={course.platform} />}
              {course.dueDate  && <DetailRow label="Deadline"  value={formatDueDate(course.dueDate)} />}
              <DetailRow label="Progress" value={`${course.progress}%`} />
            </section>
          )}

          {/* If no detail rows, still render progress on its own */}
          {!hasDetails && (
            <section className="mb-4">
              <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
                Course Details
              </h4>
              <DetailRow label="Progress" value={`${course.progress}%`} />
            </section>
          )}

          {/* Description */}
          {course.description && (
            <section className="mb-4">
              <h4 className="text-[11px] font-bold text-ibm-blue uppercase tracking-[0.08em] mb-[7px] pb-1 border-b border-[#dce8ff]">
                About this course
              </h4>
              <p className="text-[13px] text-fg leading-[1.65]">{course.description}</p>
            </section>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-[14px] border-t border-border">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-white bg-ibm-blue hover:bg-[#1560a8] transition-colors cursor-pointer"
            >
              Start / Continue on IBM w3
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-fg border border-border hover:bg-subtle transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 mb-[10px] items-start">
      <strong className="text-[11.5px] font-semibold text-muted min-w-[80px] shrink-0">{label}</strong>
      <span className="text-[13px] text-fg">{value}</span>
    </div>
  );
}
