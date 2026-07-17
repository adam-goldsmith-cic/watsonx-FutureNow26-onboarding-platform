import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { SlackMessage } from '@/lib/api-types';

// ── Shared mock data ──────────────────────────────────────────────────────────

const dmMessage: SlackMessage = {
  messageId: 'slack-dm-001',
  userId: 'usr-mock-001',
  senderName: 'Priya Patel',
  channel: 'Direct Message',
  type: 'dm',
  timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h ago
  preview: 'Hey! How are you settling in?',
  fullText: 'Hey! How are you settling in? Let me know if you need anything.',
  initials: 'PP',
  color: '#b28600',
  isUnread: true,
};

const channelMessage: SlackMessage = {
  messageId: 'slack-ch-001',
  userId: 'usr-mock-001',
  senderName: 'James Okafor',
  channel: '#digital-strategy-team',
  type: 'channel',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  preview: 'Just shared the Project Horizon brief.',
  fullText: 'Just shared the Project Horizon brief in the thread — please review before Tuesday.',
  initials: 'JO',
  color: '#198038',
  isUnread: true,
};

const mentionMessage: SlackMessage = {
  messageId: 'slack-mn-001',
  userId: 'usr-mock-001',
  senderName: 'Sarah Chen',
  channel: '#digital-strategy-team',
  type: 'mention',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  preview: 'Welcome to the team!',
  fullText: 'Welcome to the team! Everyone please make them feel at home.',
  initials: 'SC',
  color: '#0072c3',
  isUnread: true,
};

const readMessage: SlackMessage = {
  messageId: 'slack-dm-002',
  userId: 'usr-mock-001',
  senderName: 'Tom Walsh',
  channel: 'Direct Message',
  type: 'dm',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  preview: 'Grab me for coffee any time this week.',
  fullText: 'Grab me for coffee any time this week!',
  initials: 'TW',
  color: '#da1e28',
  isUnread: false,
};

const mockMessages = [dmMessage, channelMessage, mentionMessage, readMessage];

function makeFetch(messages: SlackMessage[] = mockMessages) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      messages,
      grouped: {
        dm:      messages.filter((m) => m.type === 'dm'),
        channel: messages.filter((m) => m.type === 'channel'),
        mention: messages.filter((m) => m.type === 'mention'),
      },
    }),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── SlackTab tests ────────────────────────────────────────────────────────────

describe('SlackTab', () => {
  it('renders the three sub-tab buttons', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    render(<SlackTab />);

    expect(screen.getByRole('button', { name: 'Direct Messages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mentions/i })).toBeInTheDocument();
  });

  it('shows DM messages by default after fetch', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    render(<SlackTab />);

    await waitFor(() => {
      expect(screen.getByText('Priya Patel')).toBeInTheDocument();
    });

    // Channel-only sender should not appear on the DM sub-tab
    expect(screen.queryByText('James Okafor')).not.toBeInTheDocument();
  });

  it('switches to Channels sub-tab and shows channel messages', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    render(<SlackTab />);

    await waitFor(() => screen.getByText('Priya Patel'));

    fireEvent.click(screen.getByRole('button', { name: 'Channels' }));

    await waitFor(() => {
      expect(screen.getByText('James Okafor')).toBeInTheDocument();
    });
    // DM sender should no longer be visible
    expect(screen.queryByText('Priya Patel')).not.toBeInTheDocument();
  });

  it('switches to Mentions sub-tab and shows mention messages', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    render(<SlackTab />);

    await waitFor(() => screen.getByText('Priya Patel'));

    fireEvent.click(screen.getByRole('button', { name: /mentions/i }));

    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });
  });

  it('renders unread dot for unread messages', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    const { container } = render(<SlackTab />);

    await waitFor(() => screen.getByText('Priya Patel'));

    // DMs: dmMessage is unread, readMessage is read
    // At least one unread dot should exist on the DM tab
    const unreadDots = container.querySelectorAll('[data-testid="unread-dot"]');
    expect(unreadDots.length).toBeGreaterThan(0);
  });

  it('does not render unread dot for read messages', async () => {
    // Only the read DM in the list
    vi.stubGlobal('fetch', makeFetch([readMessage]));
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    const { container } = render(<SlackTab />);

    await waitFor(() => screen.getByText('Tom Walsh'));

    const unreadDots = container.querySelectorAll('[data-testid="unread-dot"]');
    expect(unreadDots.length).toBe(0);
  });

  it('renders "Channels to Join" sidebar with 3 recommended channels', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    render(<SlackTab />);

    expect(screen.getByText('Channels to Join')).toBeInTheDocument();
    expect(screen.getByText('#consulting-uk')).toBeInTheDocument();
    expect(screen.getByText('#watsonx-ai')).toBeInTheDocument();
    expect(screen.getByText('#client-zero')).toBeInTheDocument();
  });

  it('renders Bob Slack Help sidebar with chips', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    render(<SlackTab />);

    expect(screen.getByText('Bob — Slack Help')).toBeInTheDocument();
  });

  it('shows "No messages" when the active sub-tab has no data', async () => {
    // Only DM messages — no channels
    vi.stubGlobal('fetch', makeFetch([dmMessage, readMessage]));
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    render(<SlackTab />);

    await waitFor(() => screen.getByText('Priya Patel'));

    fireEvent.click(screen.getByRole('button', { name: 'Channels' }));

    await waitFor(() => {
      expect(screen.getByText(/no channel messages/i)).toBeInTheDocument();
    });
  });

  it('opens SlackModal when a message is clicked', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { SlackTab } = await import('@/components/dashboard/SlackTab');
    render(<SlackTab />);

    await waitFor(() => screen.getByText('Priya Patel'));

    fireEvent.click(screen.getByText('Priya Patel').closest('[role="button"]')!);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ── SlackModal tests ──────────────────────────────────────────────────────────

describe('SlackModal', () => {
  it('renders nothing when message is null', async () => {
    const { SlackModal } = await import('@/components/dashboard/SlackModal');
    const { container } = render(<SlackModal message={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the sender name, channel, and full message text', async () => {
    const { SlackModal } = await import('@/components/dashboard/SlackModal');
    render(<SlackModal message={dmMessage} onClose={() => {}} />);

    // The name appears in both the modal header and the message bubble — check both exist
    expect(screen.getAllByText('Priya Patel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Direct Message')).toBeInTheDocument();
    expect(screen.getByText(dmMessage.fullText)).toBeInTheDocument();
  });

  it('renders the Bob Suggested Replies section', async () => {
    const { SlackModal } = await import('@/components/dashboard/SlackModal');
    render(<SlackModal message={dmMessage} onClose={() => {}} />);

    expect(screen.getByText(/suggested repl/i)).toBeInTheDocument();
    // Two chip buttons should exist
    expect(screen.getByText(/friendly acknowledgement/i)).toBeInTheDocument();
    expect(screen.getByText(/detailed response/i)).toBeInTheDocument();
  });

  it('renders the draft reply textarea', async () => {
    const { SlackModal } = await import('@/components/dashboard/SlackModal');
    render(<SlackModal message={dmMessage} onClose={() => {}} />);

    expect(screen.getByPlaceholderText(/draft your reply/i)).toBeInTheDocument();
  });

  it('calls onClose when the × button is clicked', async () => {
    const onClose = vi.fn();
    const { SlackModal } = await import('@/components/dashboard/SlackModal');
    render(<SlackModal message={dmMessage} onClose={onClose} />);

    // Click the × dismiss button (aria-label="Close") — use the first match (the × at the top)
    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { SlackModal } = await import('@/components/dashboard/SlackModal');
    render(<SlackModal message={dmMessage} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT call onClose when the modal panel itself is clicked', async () => {
    const onClose = vi.fn();
    const { SlackModal } = await import('@/components/dashboard/SlackModal');
    render(<SlackModal message={dmMessage} onClose={onClose} />);

    // Click the full-text paragraph — inside the panel
    fireEvent.click(screen.getByText(dmMessage.fullText));
    expect(onClose).not.toHaveBeenCalled();
  });
});
