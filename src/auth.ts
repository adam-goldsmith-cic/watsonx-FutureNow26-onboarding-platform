import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { decodeJwt } from "jose";
import { refreshCognitoTokens } from "@/lib/auth/cognito-refresh";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "admins" | "onboarders";

interface CognitoIdTokenClaims {
  sub: string;
  email: string;
  name?: string;
  "cognito:username"?: string;
  "cognito:groups"?: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extracts the app role from Cognito groups claim. */
export function deriveRole(groups: string[] | undefined): UserRole {
  if (groups?.includes("admins")) return "admins";
  return "onboarders";
}

/** Performs Cognito SRP authentication. Returns Cognito tokens on success. */
function authenticateWithCognito(
  email: string,
  password: string
): Promise<{ accessToken: string; idToken: string; refreshToken: string }> {
  return new Promise((resolve, reject) => {
    const pool = new CognitoUserPool({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      ClientId: process.env.COGNITO_CLIENT_ID!,
    });

    const user = new CognitoUser({ Username: email, Pool: pool });
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess(session) {
        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        });
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

// ── NextAuth configuration ────────────────────────────────────────────────────

// Auth.js v5 encrypts the JWT cookie with JWE (A256CBC-HS512) by default
// when AUTH_SECRET / NEXTAUTH_SECRET is set. No extra encode/decode config needed.

export const { handlers: { GET, POST }, handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        try {
          const tokens = await authenticateWithCognito(email, password);
          const claims = decodeJwt(tokens.idToken) as unknown as CognitoIdTokenClaims;
          const role = deriveRole(claims["cognito:groups"]);
          const name = claims.name ?? claims["cognito:username"] ?? email;
          // ExpiresIn from the access token (default 3600s) — derive from decoded jwt
          const accessClaims = decodeJwt(tokens.accessToken) as { exp?: number };
          const accessTokenExpiry = accessClaims.exp ?? Math.floor(Date.now() / 1000) + 3600;

          return {
            id: claims.sub,
            email: claims.email,
            name,
            role,
            accessToken: tokens.accessToken,
            idToken: tokens.idToken,
            refreshToken: tokens.refreshToken,
            accessTokenExpiry,
          };
        } catch {
          // Return null — Auth.js treats null as invalid credentials
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, `user` is populated from authorize()
      if (user) {
        const u = user as typeof user & {
          role: UserRole;
          accessToken: string;
          idToken: string;
          refreshToken: string;
          accessTokenExpiry: number;
        };
        token.role = u.role;
        token.accessToken = u.accessToken;
        token.idToken = u.idToken;
        token.refreshToken = u.refreshToken;
        token.accessTokenExpiry = u.accessTokenExpiry;
        token.error = undefined;
        return token;
      }

      // On subsequent calls, check whether the access token needs refreshing.
      const expiry = token.accessTokenExpiry as number | undefined;
      const refreshToken = token.refreshToken as string | undefined;
      const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 5 * 60;

      if (expiry && expiry > fiveMinutesFromNow) {
        // Token is still valid — return as-is
        return token;
      }

      // Token is expiring or expired — attempt silent refresh
      if (!refreshToken) {
        token.error = "RefreshTokenExpired";
        return token;
      }

      const refreshed = await refreshCognitoTokens(refreshToken);
      if (!refreshed) {
        token.error = "RefreshTokenExpired";
        return token;
      }

      token.accessToken = refreshed.accessToken;
      token.idToken = refreshed.idToken;
      token.accessTokenExpiry = refreshed.accessTokenExpiry;
      token.error = undefined;
      return token;
    },

    async session({ session, token }) {
      session.user.role = token.role as UserRole;
      session.user.id = token.sub ?? (token.id as string);
      if (token.error) {
        session.user.error = token.error as string;
      }
      return session;
    },
  },
});
