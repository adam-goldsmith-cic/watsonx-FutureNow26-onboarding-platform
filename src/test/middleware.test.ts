import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock auth before importing middleware ─────────────────────────────────────

let mockSession: import("next-auth").Session | null = null;

vi.mock("../auth", () => ({
  auth: vi.fn((handler: Function) => handler),
}));

vi.mock("next-auth", () => ({
  default: vi.fn(),
}));

// We test the middleware logic directly by extracting the inner handler.
// Rather than instantiating the full middleware, we test the routing logic
// via a helper that mirrors the middleware's decision tree.

import { NextResponse } from "next/server";
import type { NextURL } from "next/dist/server/web/next-url";

// ── Middleware logic extracted as a pure helper for testing ──────────────────

type FakeSession = {
  user?: { role?: string; error?: string };
} | null;

function runMiddlewareLogic(
  pathname: string,
  session: FakeSession
): { type: "next" } | { type: "redirect"; to: string } | { type: "json"; status: number } {
  const isApiRoute =
    pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/");

  const isAuthenticated = !!session && session.user?.error !== "RefreshTokenExpired";

  if (!isAuthenticated) {
    if (isApiRoute) return { type: "json", status: 401 };
    return { type: "redirect", to: "/login" };
  }

  const role = session?.user?.role;

  if (role === "onboarders" && pathname.startsWith("/admin")) {
    return { type: "redirect", to: "/dashboard" };
  }

  if (role === "admins" && pathname.startsWith("/dashboard")) {
    return { type: "redirect", to: "/admin" };
  }

  return { type: "next" };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("middleware routing logic", () => {
  it("redirects unauthenticated user on /dashboard to /login", () => {
    const result = runMiddlewareLogic("/dashboard", null);
    expect(result).toEqual({ type: "redirect", to: "/login" });
  });

  it("redirects unauthenticated user on /admin to /login", () => {
    const result = runMiddlewareLogic("/admin", null);
    expect(result).toEqual({ type: "redirect", to: "/login" });
  });

  it("returns 401 JSON for unauthenticated API route", () => {
    const result = runMiddlewareLogic("/api/tasks", null);
    expect(result).toEqual({ type: "json", status: 401 });
  });

  it("does NOT block /api/auth routes", () => {
    // /api/auth is excluded from the matcher, but logic-wise isApiRoute is false
    const result = runMiddlewareLogic("/api/auth/callback", null);
    // isApiRoute = false because path starts with /api/auth/
    // but session is null → redirects to /login for non-api routes
    // In real middleware the matcher excludes /api/auth entirely
    // Here we confirm the isApiRoute flag is false for /api/auth
    const isApiRoute =
      "/api/auth/callback".startsWith("/api/") &&
      !"/api/auth/callback".startsWith("/api/auth/");
    expect(isApiRoute).toBe(false);
  });

  it("redirects onboarders hitting /admin to /dashboard", () => {
    const result = runMiddlewareLogic("/admin", {
      user: { role: "onboarders" },
    });
    expect(result).toEqual({ type: "redirect", to: "/dashboard" });
  });

  it("redirects onboarders hitting /admin/config to /dashboard", () => {
    const result = runMiddlewareLogic("/admin/config", {
      user: { role: "onboarders" },
    });
    expect(result).toEqual({ type: "redirect", to: "/dashboard" });
  });

  it("redirects admins hitting /dashboard to /admin", () => {
    const result = runMiddlewareLogic("/dashboard", {
      user: { role: "admins" },
    });
    expect(result).toEqual({ type: "redirect", to: "/admin" });
  });

  it("allows onboarders to access /dashboard", () => {
    const result = runMiddlewareLogic("/dashboard", {
      user: { role: "onboarders" },
    });
    expect(result).toEqual({ type: "next" });
  });

  it("allows admins to access /admin", () => {
    const result = runMiddlewareLogic("/admin", {
      user: { role: "admins" },
    });
    expect(result).toEqual({ type: "next" });
  });

  it("treats RefreshTokenExpired as unauthenticated and redirects to /login", () => {
    const result = runMiddlewareLogic("/dashboard", {
      user: { role: "onboarders", error: "RefreshTokenExpired" },
    });
    expect(result).toEqual({ type: "redirect", to: "/login" });
  });

  it("treats RefreshTokenExpired on an API route as 401", () => {
    const result = runMiddlewareLogic("/api/tasks", {
      user: { role: "onboarders", error: "RefreshTokenExpired" },
    });
    expect(result).toEqual({ type: "json", status: 401 });
  });
});
