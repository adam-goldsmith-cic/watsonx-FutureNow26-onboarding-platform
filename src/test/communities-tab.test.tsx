import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CommunitiesConfig, Community } from '@/plugins/schemas/communities';

// ── Shared mock data ──────────────────────────────────────────────────────────

const recommendedCommunity: Community = {
  id: 'ai-automation',
  name: 'IBM AI & Automation Community',
  description: 'Cross-IBM practitioners working on AI, ML, and automation. Monthly deep-dives, demos, and a highly active Slack channel.',
  slackChannel: '#ai-community',
  cadence: 'Monthly meetup',
  memberCount: '2,400 members',
  isRecommended: true,
  iconEmoji: '◈',
  bobNote: 'This community is a great fit for your role as a consultant at IBM Future Now.',
};

const regularCommunity: Community = {
  id: 'ibm-wit',
  name: 'IBM Women in Technology UK',
  description: 'Supports gender diversity and inclusion across IBM UK. Regular events, mentorship, and an active sponsorship programme.',
  slackChannel: '#ibm-wit-uk',
  cadence: 'Monthly event',
  memberCount: 'Open to all',
  isRecommended: false,
  iconEmoji: '◈',
  bobNote: 'Open to everyone — all are actively encouraged to participate.',
};

const mockConfig: CommunitiesConfig = {
  title: 'Recommended for You',
  communities: [recommendedCommunity, regularCommunity],
};

// ── CommunitiesTab tests ───────────────────────────────────────────────────────

describe('CommunitiesTab', () => {
  it('renders community names', async () => {
    const { CommunitiesTab } = await import('@/components/dashboard/CommunitiesTab');
    render(<CommunitiesTab config={mockConfig} userName="Alex Johnson" />);

    expect(screen.getByText('IBM AI & Automation Community')).toBeInTheDocument();
    expect(screen.getByText('IBM Women in Technology UK')).toBeInTheDocument();
  });

  it('renders community descriptions', async () => {
    const { CommunitiesTab } = await import('@/components/dashboard/CommunitiesTab');
    render(<CommunitiesTab config={mockConfig} userName="Alex Johnson" />);

    expect(screen.getByText(recommendedCommunity.description)).toBeInTheDocument();
  });

  it('renders metadata chips (cadence, slack channel, member count)', async () => {
    const { CommunitiesTab } = await import('@/components/dashboard/CommunitiesTab');
    render(<CommunitiesTab config={mockConfig} userName="Alex Johnson" />);

    expect(screen.getByText('Monthly meetup')).toBeInTheDocument();
    expect(screen.getByText('#ai-community')).toBeInTheDocument();
    expect(screen.getByText('2,400 members')).toBeInTheDocument();
  });

  it('renders "Recommended" tag only for isRecommended communities', async () => {
    const { CommunitiesTab } = await import('@/components/dashboard/CommunitiesTab');
    render(<CommunitiesTab config={mockConfig} userName="Alex Johnson" />);

    const tags = screen.getAllByText('Recommended');
    expect(tags).toHaveLength(1);
  });

  it('does NOT render "Recommended" tag for non-recommended communities', async () => {
    const { CommunitiesTab } = await import('@/components/dashboard/CommunitiesTab');
    // Only the non-recommended community
    render(<CommunitiesTab config={{ ...mockConfig, communities: [regularCommunity] }} userName="Alex Johnson" />);

    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
  });

  it('renders the icon emoji for each community', async () => {
    const { CommunitiesTab } = await import('@/components/dashboard/CommunitiesTab');
    render(<CommunitiesTab config={mockConfig} userName="Alex Johnson" />);

    const icons = screen.getAllByText('◈');
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the sidebar SentimentWidget with the user name', async () => {
    const { CommunitiesTab } = await import('@/components/dashboard/CommunitiesTab');
    render(<CommunitiesTab config={mockConfig} userName="Alex Johnson" />);

    // SentimentWidget renders "How are you feeling this week, Alex?"
    expect(screen.getByText(/how are you feeling this week, Alex/i)).toBeInTheDocument();
  });

  it('renders the "Bob — Community Help" sidebar section', async () => {
    const { CommunitiesTab } = await import('@/components/dashboard/CommunitiesTab');
    render(<CommunitiesTab config={mockConfig} userName="Alex Johnson" />);

    expect(screen.getByText('Bob — Community Help')).toBeInTheDocument();
  });

  it('opens CommunityModal when a community card is clicked', async () => {
    const { CommunitiesTab } = await import('@/components/dashboard/CommunitiesTab');
    render(<CommunitiesTab config={mockConfig} userName="Alex Johnson" />);

    fireEvent.click(
      screen.getByText('IBM AI & Automation Community').closest('[role="button"]')!
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ── CommunityModal tests ──────────────────────────────────────────────────────

describe('CommunityModal', () => {
  it('renders nothing when community is null', async () => {
    const { CommunityModal } = await import('@/components/dashboard/CommunityModal');
    const { container } = render(<CommunityModal community={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the community name and metadata in the header', async () => {
    const { CommunityModal } = await import('@/components/dashboard/CommunityModal');
    render(<CommunityModal community={recommendedCommunity} onClose={() => {}} />);

    expect(screen.getAllByText('IBM AI & Automation Community').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Monthly meetup/)).toBeInTheDocument();
  });

  it('renders the "About this community" description', async () => {
    const { CommunityModal } = await import('@/components/dashboard/CommunityModal');
    render(<CommunityModal community={recommendedCommunity} onClose={() => {}} />);

    expect(screen.getByText(/About this community/i)).toBeInTheDocument();
    expect(screen.getByText(recommendedCommunity.description)).toBeInTheDocument();
  });

  it('renders the Bob recommendation note', async () => {
    const { CommunityModal } = await import('@/components/dashboard/CommunityModal');
    render(<CommunityModal community={recommendedCommunity} onClose={() => {}} />);

    expect(screen.getByText(recommendedCommunity.bobNote)).toBeInTheDocument();
  });

  it('renders the "Join Community" button', async () => {
    const { CommunityModal } = await import('@/components/dashboard/CommunityModal');
    render(<CommunityModal community={recommendedCommunity} onClose={() => {}} />);

    expect(screen.getByRole('button', { name: /join community/i })).toBeInTheDocument();
  });

  it('calls onClose when the × button is clicked', async () => {
    const onClose = vi.fn();
    const { CommunityModal } = await import('@/components/dashboard/CommunityModal');
    render(<CommunityModal community={recommendedCommunity} onClose={onClose} />);

    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { CommunityModal } = await import('@/components/dashboard/CommunityModal');
    render(<CommunityModal community={recommendedCommunity} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT call onClose when the modal panel is clicked', async () => {
    const onClose = vi.fn();
    const { CommunityModal } = await import('@/components/dashboard/CommunityModal');
    render(<CommunityModal community={recommendedCommunity} onClose={onClose} />);

    fireEvent.click(screen.getByText(recommendedCommunity.description));
    expect(onClose).not.toHaveBeenCalled();
  });
});
