import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { OrgNode } from '@/lib/api-types';

// ── Shared mock data ──────────────────────────────────────────────────────────

const rootNode: OrgNode = {
  nodeId: 'org-001',
  name: 'Caroline Hughes',
  role: 'VP, IBM UK & Ireland',
  initials: 'CH',
  color: '#0043ce',
  bio: 'Caroline leads IBM UK & Ireland, overseeing all consulting, technology, and client engineering divisions.',
  parentId: null,
  isCurrentUser: false,
  level: 0,
};

const midNode: OrgNode = {
  nodeId: 'org-002',
  name: 'Marcus Reid',
  role: 'Director, Consulting Services',
  initials: 'MR',
  color: '#6929c4',
  bio: 'Marcus leads the Consulting Services division.',
  parentId: 'org-001',
  isCurrentUser: false,
  level: 1,
};

const currentUser: OrgNode = {
  nodeId: 'org-010',
  name: 'You',
  role: 'Consultant, Digital Strategy',
  initials: 'YO',
  color: '#f1c21b',
  bio: 'You are a new Consultant joining the Digital Strategy team.',
  parentId: 'org-002',
  isCurrentUser: true,
  level: 2,
};

const mockNodes = [rootNode, midNode, currentUser];

function makeFetch(nodes: OrgNode[] = mockNodes) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => nodes,
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── OrgChartTab tests ─────────────────────────────────────────────────────────

describe('OrgChartTab', () => {
  it('renders node names after fetch', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { OrgChartTab } = await import('@/components/dashboard/OrgChartTab');
    render(<OrgChartTab />);

    await waitFor(() => {
      expect(screen.getByText('Caroline Hughes')).toBeInTheDocument();
    });
    expect(screen.getByText('Marcus Reid')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders node roles', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { OrgChartTab } = await import('@/components/dashboard/OrgChartTab');
    render(<OrgChartTab />);

    // The component truncates the role to the first segment before the comma
    // so we match the truncated form shown in the card.
    await waitFor(() => {
      expect(screen.getByText('VP')).toBeInTheDocument();
    });
    expect(screen.getByText('Director')).toBeInTheDocument();
  });

  it('renders avatar initials for each node', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { OrgChartTab } = await import('@/components/dashboard/OrgChartTab');
    render(<OrgChartTab />);

    await waitFor(() => screen.getByText('CH'));
    expect(screen.getByText('MR')).toBeInTheDocument();
    expect(screen.getByText('YO')).toBeInTheDocument();
  });

  it('renders "YOU" tag on the current user node', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { OrgChartTab } = await import('@/components/dashboard/OrgChartTab');
    render(<OrgChartTab />);

    await waitFor(() => {
      expect(screen.getByText('YOU')).toBeInTheDocument();
    });
  });

  it('does NOT render "YOU" tag on non-current-user nodes', async () => {
    vi.stubGlobal('fetch', makeFetch([rootNode, midNode]));
    const { OrgChartTab } = await import('@/components/dashboard/OrgChartTab');
    render(<OrgChartTab />);

    await waitFor(() => screen.getByText('Caroline Hughes'));
    expect(screen.queryByText('YOU')).not.toBeInTheDocument();
  });

  it('renders the Bob tip callout', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { OrgChartTab } = await import('@/components/dashboard/OrgChartTab');
    render(<OrgChartTab />);

    expect(screen.getByText(/bob/i, { selector: 'strong,p *' })).toBeInTheDocument();
  });

  it('opens OrgModal when a node is clicked', async () => {
    vi.stubGlobal('fetch', makeFetch());
    const { OrgChartTab } = await import('@/components/dashboard/OrgChartTab');
    render(<OrgChartTab />);

    await waitFor(() => screen.getByText('Caroline Hughes'));

    fireEvent.click(
      screen.getByText('Caroline Hughes').closest('[role="button"]')!
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows a loading state before data arrives', async () => {
    // Mock that never resolves during the test — we just check the loading UI
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    const { OrgChartTab } = await import('@/components/dashboard/OrgChartTab');
    render(<OrgChartTab />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

// ── OrgModal tests ────────────────────────────────────────────────────────────

describe('OrgModal', () => {
  it('renders nothing when node is null', async () => {
    const { OrgModal } = await import('@/components/dashboard/OrgModal');
    const { container } = render(<OrgModal node={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the person name, role, and bio', async () => {
    const { OrgModal } = await import('@/components/dashboard/OrgModal');
    render(<OrgModal node={rootNode} onClose={() => {}} />);

    expect(screen.getByText('Caroline Hughes')).toBeInTheDocument();
    expect(screen.getByText('VP, IBM UK & Ireland')).toBeInTheDocument();
    expect(screen.getByText(rootNode.bio)).toBeInTheDocument();
  });

  it('renders three Bob conversation starter chips', async () => {
    const { OrgModal } = await import('@/components/dashboard/OrgModal');
    render(<OrgModal node={rootNode} onClose={() => {}} />);

    // The first chip always references the person's name
    expect(screen.getByText(/tell me more about Caroline Hughes/i)).toBeInTheDocument();
    expect(screen.getByText(/draft an intro message/i)).toBeInTheDocument();
    expect(screen.getByText(/what questions should I ask/i)).toBeInTheDocument();
  });

  it('calls onClose when the × button is clicked', async () => {
    const onClose = vi.fn();
    const { OrgModal } = await import('@/components/dashboard/OrgModal');
    render(<OrgModal node={rootNode} onClose={onClose} />);

    // Both the × and the "Close" button have aria-label="Close" — use the first
    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { OrgModal } = await import('@/components/dashboard/OrgModal');
    render(<OrgModal node={rootNode} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT call onClose when the modal panel is clicked', async () => {
    const onClose = vi.fn();
    const { OrgModal } = await import('@/components/dashboard/OrgModal');
    render(<OrgModal node={rootNode} onClose={onClose} />);

    fireEvent.click(screen.getByText(rootNode.bio));
    expect(onClose).not.toHaveBeenCalled();
  });
});
