import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { KeyContact } from '@/plugins/schemas/contacts';
import type { TrainingCourse } from '@/plugins/schemas/training';

// ── Shared mock data ──────────────────────────────────────────────────────────

const mockContact: KeyContact = {
  initials: 'SC',
  name: 'Sarah Chen',
  role: 'Senior Manager, Digital Strategy',
  description: 'Performance, objectives, project allocation, career development',
  email: 'sarah.chen@uk.ibm.com',
  slackHandle: '@sarah.chen',
};

const contactNoExtras: KeyContact = {
  initials: 'HR',
  name: 'HR Business Partner',
  role: 'HR',
  description: 'Policies, pay & benefits',
};

const mockCourse: TrainingCourse = {
  id: 'course-001',
  title: 'IBM Security Awareness Training 2025',
  category: 'SEC',
  progress: 0,
  status: 'not-started',
  dueDate: '2026-07-18',
  duration: '45 min',
  platform: 'IBM w3 Learning',
  description: 'IBM mandatory annual security awareness training. Covers phishing awareness, data handling, and IBM security policies.',
};

const courseMinimal: TrainingCourse = {
  id: 'course-002',
  title: 'Business Conduct Guidelines',
  category: 'COC',
  progress: 100,
  status: 'completed',
};

// ── ContactModal tests ────────────────────────────────────────────────────────

describe('ContactModal', () => {
  it('renders nothing when contact is null', async () => {
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    const { container } = render(<ContactModal contact={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the contact name and role in the header', async () => {
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    render(<ContactModal contact={mockContact} onClose={() => {}} />);

    expect(screen.getAllByText('Sarah Chen').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Senior Manager, Digital Strategy').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the "Go to for" description', async () => {
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    render(<ContactModal contact={mockContact} onClose={() => {}} />);

    expect(screen.getByText('Go to for')).toBeInTheDocument();
    expect(screen.getByText(mockContact.description)).toBeInTheDocument();
  });

  it('renders email when provided', async () => {
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    render(<ContactModal contact={mockContact} onClose={() => {}} />);

    expect(screen.getByText('sarah.chen@uk.ibm.com')).toBeInTheDocument();
  });

  it('renders Slack handle when provided', async () => {
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    render(<ContactModal contact={mockContact} onClose={() => {}} />);

    expect(screen.getByText('@sarah.chen')).toBeInTheDocument();
  });

  it('omits email/slack rows when fields are absent', async () => {
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    render(<ContactModal contact={contactNoExtras} onClose={() => {}} />);

    expect(screen.queryByText(/ibm\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/@\w/)).not.toBeInTheDocument();
  });

  it('renders three Bob reach-out chips', async () => {
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    render(<ContactModal contact={mockContact} onClose={() => {}} />);

    expect(screen.getByText(/draft an intro message to Sarah Chen/i)).toBeInTheDocument();
    expect(screen.getByText(/what questions should I ask/i)).toBeInTheDocument();
    expect(screen.getByText(/help me prepare for our 1-to-1/i)).toBeInTheDocument();
  });

  it('calls onClose when the × button is clicked', async () => {
    const onClose = vi.fn();
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    render(<ContactModal contact={mockContact} onClose={onClose} />);

    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    render(<ContactModal contact={mockContact} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT call onClose when the modal panel is clicked', async () => {
    const onClose = vi.fn();
    const { ContactModal } = await import('@/components/dashboard/ContactModal');
    render(<ContactModal contact={mockContact} onClose={onClose} />);

    fireEvent.click(screen.getByText(mockContact.description));
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── LearningModal tests ───────────────────────────────────────────────────────

describe('LearningModal', () => {
  it('renders nothing when course is null', async () => {
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    const { container } = render(<LearningModal course={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the course title in the header', async () => {
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={() => {}} />);

    expect(screen.getAllByText('IBM Security Awareness Training 2025').length).toBeGreaterThanOrEqual(1);
  });

  it('renders duration when provided', async () => {
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={() => {}} />);

    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('renders platform when provided', async () => {
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={() => {}} />);

    expect(screen.getByText('IBM w3 Learning')).toBeInTheDocument();
  });

  it('renders formatted deadline when dueDate provided', async () => {
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={() => {}} />);

    // dueDate '2026-07-18' → "18 Jul 2026"
    expect(screen.getByText('18 Jul 2026')).toBeInTheDocument();
  });

  it('renders progress percentage', async () => {
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={() => {}} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders the course description when provided', async () => {
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={() => {}} />);

    expect(screen.getByText(mockCourse.description!)).toBeInTheDocument();
  });

  it('renders the "Start / Continue on IBM w3" button', async () => {
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={() => {}} />);

    expect(screen.getByRole('button', { name: /start.*continue.*w3/i })).toBeInTheDocument();
  });

  it('omits duration/platform/deadline rows when fields are absent', async () => {
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={courseMinimal} onClose={() => {}} />);

    expect(screen.queryByText(/Duration/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Platform/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Deadline/i)).not.toBeInTheDocument();
  });

  it('calls onClose when the × button is clicked', async () => {
    const onClose = vi.fn();
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={onClose} />);

    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT call onClose when the modal panel is clicked', async () => {
    const onClose = vi.fn();
    const { LearningModal } = await import('@/components/dashboard/LearningModal');
    render(<LearningModal course={mockCourse} onClose={onClose} />);

    fireEvent.click(screen.getByText(mockCourse.description!));
    expect(onClose).not.toHaveBeenCalled();
  });
});
