/**
 * Tests for auth token logic:
 *
 * 1. refreshCognitoTokens (src/lib/auth/cognito-refresh.ts)
 *    — tested by injecting a fake client; no vi.mock needed.
 *
 * 2. jwt callback token-expiry decision (pure function mirroring src/auth.ts logic)
 *    — no mocking needed at all.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { refreshCognitoTokens } from '../lib/auth/cognito-refresh';

// ── Fake Cognito client factory ───────────────────────────────────────────────

type FakeSendResult = {
  AuthenticationResult?: {
    AccessToken?: string;
    IdToken?: string;
    ExpiresIn?: number;
  };
};

function makeFakeClient(result: FakeSendResult | Error) {
  return {
    send: async (_command: unknown) => {
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

beforeEach(() => {
  process.env.COGNITO_CLIENT_ID = 'test-client-id';
  process.env.COGNITO_REGION = 'eu-west-1';
});

// ── refreshCognitoTokens ──────────────────────────────────────────────────────

describe('refreshCognitoTokens', () => {
  it('returns new tokens when Cognito responds with AccessToken and IdToken', async () => {
    const client = makeFakeClient({
      AuthenticationResult: {
        AccessToken: 'new-access-token',
        IdToken: 'new-id-token',
        ExpiresIn: 3600,
      },
    });

    const result = await refreshCognitoTokens('valid-refresh-token', client);

    expect(result).not.toBeNull();
    expect(result!.accessToken).toBe('new-access-token');
    expect(result!.idToken).toBe('new-id-token');
    const now = Math.floor(Date.now() / 1000);
    expect(result!.accessTokenExpiry).toBeGreaterThanOrEqual(now + 3590);
    expect(result!.accessTokenExpiry).toBeLessThanOrEqual(now + 3610);
  });

  it('returns null when AuthenticationResult is missing', async () => {
    const client = makeFakeClient({ AuthenticationResult: undefined });
    const result = await refreshCognitoTokens('some-token', client);
    expect(result).toBeNull();
  });

  it('returns null when AccessToken is missing from the response', async () => {
    const client = makeFakeClient({ AuthenticationResult: { IdToken: 'id' } });
    const result = await refreshCognitoTokens('some-token', client);
    expect(result).toBeNull();
  });

  it('returns null when IdToken is missing from the response', async () => {
    const client = makeFakeClient({ AuthenticationResult: { AccessToken: 'at' } });
    const result = await refreshCognitoTokens('some-token', client);
    expect(result).toBeNull();
  });

  it('returns null when the client throws (e.g. refresh token expired)', async () => {
    const client = makeFakeClient(new Error('NotAuthorizedException'));
    const result = await refreshCognitoTokens('expired-token', client);
    expect(result).toBeNull();
  });

  it('defaults ExpiresIn to 3600 when not present in the response', async () => {
    const client = makeFakeClient({
      AuthenticationResult: { AccessToken: 'at', IdToken: 'it' },
    });
    const result = await refreshCognitoTokens('rt', client);
    const now = Math.floor(Date.now() / 1000);
    expect(result).not.toBeNull();
    expect(result!.accessTokenExpiry).toBeGreaterThanOrEqual(now + 3590);
  });
});

// ── jwt callback token-expiry decision ───────────────────────────────────────
// Pure function mirroring the decision tree in src/auth.ts jwt callback.
// No mocking — just logic.

function jwtCallbackDecision(
  expiry: number | undefined,
  hasRefreshToken: boolean,
  fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 5 * 60
): 'valid' | 'no-refresh-token' | 'needs-refresh' {
  if (expiry && expiry > fiveMinutesFromNow) return 'valid';
  if (!hasRefreshToken) return 'no-refresh-token';
  return 'needs-refresh';
}

describe('jwt callback token-expiry decision', () => {
  const now = Math.floor(Date.now() / 1000);

  it('returns "valid" when token expires more than 5 minutes from now', () => {
    expect(jwtCallbackDecision(now + 600, false)).toBe('valid');
  });

  it('returns "needs-refresh" when token expires in less than 5 minutes', () => {
    expect(jwtCallbackDecision(now + 60, true)).toBe('needs-refresh');
  });

  it('returns "needs-refresh" when token is already expired', () => {
    expect(jwtCallbackDecision(now - 100, true)).toBe('needs-refresh');
  });

  it('returns "no-refresh-token" when expiring and no refresh token available', () => {
    expect(jwtCallbackDecision(now + 60, false)).toBe('no-refresh-token');
  });

  it('returns "needs-refresh" when expiry is undefined (treat as expired)', () => {
    expect(jwtCallbackDecision(undefined, true)).toBe('needs-refresh');
  });

  it('returns "no-refresh-token" when expiry is undefined and no refresh token', () => {
    expect(jwtCallbackDecision(undefined, false)).toBe('no-refresh-token');
  });
});
