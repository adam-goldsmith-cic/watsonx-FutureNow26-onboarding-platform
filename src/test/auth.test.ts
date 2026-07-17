import { describe, it, expect, vi } from "vitest";

// Mock AWS/Cognito modules before importing auth.ts so no real clients are created
vi.mock("amazon-cognito-identity-js", () => ({
  CognitoUserPool: vi.fn(),
  CognitoUser: vi.fn(),
  AuthenticationDetails: vi.fn(),
}));

vi.mock("@aws-sdk/client-cognito-identity-provider", () => ({
  CognitoIdentityProviderClient: vi.fn(() => ({ send: vi.fn() })),
  InitiateAuthCommand: vi.fn(),
}));

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((c: unknown) => c),
}));

import { deriveRole, type UserRole } from "../auth";

// ── deriveRole ────────────────────────────────────────────────────────────────

describe("deriveRole", () => {
  it('returns "admins" when groups includes "admins"', () => {
    expect(deriveRole(["admins"])).toBe("admins");
  });

  it('returns "admins" when groups includes "admins" alongside other groups', () => {
    expect(deriveRole(["onboarders", "admins"])).toBe("admins");
  });

  it('returns "onboarders" when groups does not include "admins"', () => {
    expect(deriveRole(["onboarders"])).toBe("onboarders");
  });

  it('returns "onboarders" when groups is an empty array', () => {
    expect(deriveRole([])).toBe("onboarders");
  });

  it('returns "onboarders" when groups is undefined', () => {
    expect(deriveRole(undefined)).toBe("onboarders");
  });
});

// ── UserRole type ─────────────────────────────────────────────────────────────

describe("UserRole type", () => {
  it("accepts admins", () => {
    const role: UserRole = "admins";
    expect(role).toBe("admins");
  });

  it("accepts onboarders", () => {
    const role: UserRole = "onboarders";
    expect(role).toBe("onboarders");
  });
});
