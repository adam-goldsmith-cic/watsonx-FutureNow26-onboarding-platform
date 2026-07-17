import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: import("next-auth").Session | null }) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  // ── Detect API routes (exclude auth endpoints) ─────────────────────────────
  const isApiRoute =
    pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/");

  // ── Unauthenticated or expired refresh token ───────────────────────────────
  const isAuthenticated =
    !!session && session.user?.error !== "RefreshTokenExpired";

  if (!isAuthenticated) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role;

  // ── RBAC: wrong role for route ─────────────────────────────────────────────
  if (role === "onboarders" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  if (role === "admins" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/admin", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /login           (public sign-in page)
     * - /api/auth/*      (NextAuth endpoints)
     * - /_next/static/*  (static assets)
     * - /_next/image/*   (image optimisation)
     * - /favicon.ico
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
