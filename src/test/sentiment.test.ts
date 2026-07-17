import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the SentimentRepository before importing the route so the module
// receives the mocked version. The route instantiates the repository at
// module scope, so we mock the whole module.
vi.mock('@/lib/sentiment/repository', () => {
  const mockCreateSentimentEntry = vi.fn(async (entry: unknown) => entry);
  function SentimentRepository() {
    return { createSentimentEntry: mockCreateSentimentEntry };
  }
  return { SentimentRepository };
});

// Mock auth() to return a session with a known userId.
vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { id: 'test-user-sub-001', role: 'onboarders', name: 'Test User' },
  })),
}));

// Also mock amazon-cognito-identity-js and next-auth to prevent real instantiation.
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

// Import the route AFTER the mocks are registered.
const { POST } = await import('@/app/api/sentiment/route');

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/sentiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/sentiment', () => {
  it('returns 201 with the created entry for a valid payload (no notes)', async () => {
    const req = makeRequest({ mood: 'good' });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mood).toBe('good');
    expect(json.notes).toBeNull();
    expect(typeof json.entryId).toBe('string');
    expect(json.entryId.length).toBeGreaterThan(0);
    expect(json.userId).toBe('test-user-sub-001');
  });

  it('returns 201 with notes when notes field is provided', async () => {
    const req = makeRequest({ mood: 'excellent', notes: 'Great first week!' });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mood).toBe('excellent');
    expect(json.notes).toBe('Great first week!');
  });

  it('accepts all four valid mood values', async () => {
    const moods = ['overwhelmed', 'getting-there', 'good', 'excellent'] as const;
    for (const mood of moods) {
      const res = await POST(makeRequest({ mood }));
      expect(res.status, `mood "${mood}" should return 201`).toBe(201);
      const json = await res.json();
      expect(json.mood).toBe(mood);
    }
  });

  it('returns 400 when mood is an invalid value', async () => {
    const req = makeRequest({ mood: 'happy' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid request body');
    expect(json.details).toBeDefined();
  });

  it('returns 400 when mood field is missing entirely', async () => {
    const req = makeRequest({ notes: 'No mood provided' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid request body');
  });

  it('returns 400 when the body is an empty object', async () => {
    const req = makeRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when the request body is not valid JSON', async () => {
    const req = new NextRequest('http://localhost/api/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid JSON body');
  });

  it('includes a createdAt ISO timestamp in the response', async () => {
    const req = makeRequest({ mood: 'getting-there' });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.createdAt).toBeDefined();
    // Should be parseable as a date
    expect(isNaN(Date.parse(json.createdAt))).toBe(false);
  });
});
