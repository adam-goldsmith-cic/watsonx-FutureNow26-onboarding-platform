/**
 * Tests for all auth-gated API routes:
 *   GET /api/user
 *   GET /api/tasks
 *   GET /api/meetings
 *   GET /api/slack-messages
 *
 * Each route must:
 *   1. Return 401 when there is no session
 *   2. Return data keyed to session.user.id (not a hardcoded mock ID)
 *   3. Return 500 when the repository throws
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Shared auth mock ──────────────────────────────────────────────────────────

type FakeSession = { user: { id: string; name: string; role: string } } | null;
let mockSession: FakeSession = null;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => mockSession),
}));

// ── Suppress NextAuth / Cognito side-effects ──────────────────────────────────

vi.mock('amazon-cognito-identity-js', () => ({
  CognitoUserPool: vi.fn(),
  CognitoUser: vi.fn(),
  AuthenticationDetails: vi.fn(),
}));

vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: vi.fn(() => ({ send: vi.fn() })),
  InitiateAuthCommand: vi.fn(),
}));

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn((c: unknown) => c),
}));

// ── Repository mocks ──────────────────────────────────────────────────────────

const { mockGetTasksForUser, mockGetMeetingsForUser, mockGetMessagesForUser } = vi.hoisted(() => ({
  mockGetTasksForUser: vi.fn(),
  mockGetMeetingsForUser: vi.fn(),
  mockGetMessagesForUser: vi.fn(),
}));

vi.mock('@/lib/tasks/repository', () => {
  function TaskRepository() { return { getTasksForUser: mockGetTasksForUser }; }
  return { TaskRepository };
});

vi.mock('@/lib/meetings/repository', () => {
  function MeetingRepository() { return { getMeetingsForUser: mockGetMeetingsForUser }; }
  return { MeetingRepository };
});

vi.mock('@/lib/slack/repository', () => {
  function SlackRepository() { return { getMessagesForUser: mockGetMessagesForUser }; }
  return { SlackRepository };
});

// ── Import routes after mocks ─────────────────────────────────────────────────

const { GET: getUserRoute } = await import('@/app/api/user/route');
const { GET: getTasksRoute } = await import('@/app/api/tasks/route');
const { GET: getMeetingsRoute } = await import('@/app/api/meetings/route');
const { GET: getSlackRoute } = await import('@/app/api/slack-messages/route');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSession(id = 'user-sub-abc') {
  return { user: { id, name: 'Test User', role: 'onboarders' } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession = null;
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/user
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/user', () => {
  it('returns 401 when unauthenticated', async () => {
    mockSession = null;
    const res = await getUserRoute();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns the session user profile when authenticated', async () => {
    mockSession = makeSession('cognito-sub-xyz');
    const res = await getUserRoute();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe('cognito-sub-xyz');
    expect(json.name).toBe('Test User');
    expect(json.role).toBe('onboarders');
  });

  it('falls back to "New Starter" when session name is null', async () => {
    mockSession = { user: { id: 'sub-1', name: null as unknown as string, role: 'onboarders' } };
    const res = await getUserRoute();
    const json = await res.json();
    expect(json.name).toBe('New Starter');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/tasks
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/tasks', () => {
  it('returns 401 when unauthenticated', async () => {
    mockSession = null;
    const res = await getTasksRoute();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('calls repository with session.user.id', async () => {
    mockSession = makeSession('sub-tasks-user');
    mockGetTasksForUser.mockResolvedValue([]);
    await getTasksRoute();
    expect(mockGetTasksForUser).toHaveBeenCalledWith('sub-tasks-user');
  });

  it('returns tasks from the repository', async () => {
    mockSession = makeSession();
    const tasks = [{ taskId: 't1', status: 'NOT_STARTED' }];
    mockGetTasksForUser.mockResolvedValue(tasks);
    const res = await getTasksRoute();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(tasks);
  });

  it('returns 500 when the repository throws', async () => {
    mockSession = makeSession();
    mockGetTasksForUser.mockRejectedValue(new Error('DynamoDB unavailable'));
    const res = await getTasksRoute();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('DynamoDB unavailable');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/meetings
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/meetings', () => {
  it('returns 401 when unauthenticated', async () => {
    mockSession = null;
    const res = await getMeetingsRoute();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('calls repository with session.user.id', async () => {
    mockSession = makeSession('sub-meetings-user');
    mockGetMeetingsForUser.mockResolvedValue([]);
    await getMeetingsRoute();
    expect(mockGetMeetingsForUser).toHaveBeenCalledWith('sub-meetings-user');
  });

  it('returns meetings from the repository', async () => {
    mockSession = makeSession();
    const meetings = [{ meetingId: 'm1', title: 'Standup' }];
    mockGetMeetingsForUser.mockResolvedValue(meetings);
    const res = await getMeetingsRoute();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(meetings);
  });

  it('returns 500 when the repository throws', async () => {
    mockSession = makeSession();
    mockGetMeetingsForUser.mockRejectedValue(new Error('Table not found'));
    const res = await getMeetingsRoute();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Table not found');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/slack-messages
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/slack-messages', () => {
  it('returns 401 when unauthenticated', async () => {
    mockSession = null;
    const res = await getSlackRoute();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('calls repository with session.user.id', async () => {
    mockSession = makeSession('sub-slack-user');
    mockGetMessagesForUser.mockResolvedValue([]);
    await getSlackRoute();
    expect(mockGetMessagesForUser).toHaveBeenCalledWith('sub-slack-user');
  });

  it('returns grouped messages from the repository', async () => {
    mockSession = makeSession();
    const messages = [
      { messageId: 'msg1', type: 'dm', isUnread: true },
      { messageId: 'msg2', type: 'channel', isUnread: false },
      { messageId: 'msg3', type: 'mention', isUnread: true },
    ];
    mockGetMessagesForUser.mockResolvedValue(messages);
    const res = await getSlackRoute();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.messages).toEqual(messages);
    expect(json.grouped.dm).toHaveLength(1);
    expect(json.grouped.channel).toHaveLength(1);
    expect(json.grouped.mention).toHaveLength(1);
  });

  it('returns 500 when the repository throws', async () => {
    mockSession = makeSession();
    mockGetMessagesForUser.mockRejectedValue(new Error('Slack table error'));
    const res = await getSlackRoute();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Slack table error');
  });
});
