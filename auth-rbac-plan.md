# Auth & RBAC Plan — Cognito SRP + NextAuth.js v5

## Overview

Add stateless, encrypted JWT-based authentication and role-based access control (RBAC) to the IBM Onboarding Portal.

**Auth flow:**
1. User submits email + password on a custom `/login` page.
2. The form calls a **Next.js Server Action** — the SRP computation and `InitiateAuth` call happen entirely on the server. `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` never appear in the browser bundle.
3. The Server Action delegates to NextAuth's **Credentials provider** `authorize` function, which performs Cognito SRP (`COGNITO_USER_SRP_AUTH`) via `amazon-cognito-identity-js` running in Node.
4. On success, Cognito returns `AccessToken`, `IdToken`, and `RefreshToken`.
5. NextAuth reads `cognito:groups` from the decoded `IdToken` and stores `{ sub, email, name, role, accessToken, idToken, refreshToken, accessTokenExpiry }` in a **JWE-encrypted** session cookie (via `jose`).
6. Subsequent requests: middleware decrypts the JWE cookie, checks role, enforces access rules — no external call needed.
7. **Silent refresh**: the NextAuth `jwt` callback checks `accessTokenExpiry`; if within 5 minutes of expiry it calls Cognito `InitiateAuth` with `REFRESH_TOKEN_AUTH` and silently rotates the tokens in the cookie.

**Roles (Cognito User Pool Groups):**
- `onboarders` → can only access `/dashboard`
- `admins` → can only access `/admin`

**Role-based redirect after login:** onboarders → `/dashboard`, admins → `/admin`.

**Admin page** is hard-blocked at the middleware level — wrong role gets redirected, not a 403 page.

**No self-registration** — users are created exclusively via `scripts/create-user.ts`.

**Session storage:** stateless JWE cookie — no Redis, no database. Compatible with Vercel serverless.

**userId for DynamoDB:** Cognito `sub` (UUID) — stable, never changes.

---

## Sub-Tasks

---

### Sub-Task 1 — Provision Cognito Infrastructure via SST

**Intent**
Add a Cognito User Pool, App Client, and two User Pool Groups (`admins`, `onboarders`) to `sst.config.ts`. No hosted UI or OIDC — the App Client is configured for `USER_PASSWORD_AUTH` / SRP only (no OAuth flows needed).

**Expected Outcomes**
- Running `npx sst deploy --stage prod` creates a Cognito User Pool with email as the sign-in attribute.
- An App Client is created with `ALLOW_USER_SRP_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH` flows only. No OAuth flows, no hosted UI domain.
- `adminCreateUserOnly: true` — no self-registration.
- Two groups exist: `admins` and `onboarders`.
- Stack outputs emit `userPoolId` and `userPoolClientId` for use in env vars.
- The IAM policy is extended to include the Cognito admin actions needed by the user management script.

**Todo List**
1. Extend the `import` destructure in `sst.config.ts` to include `cognito` from `@pulumi/aws`.
2. Declare a `cognito.UserPool` resource:
   - `usernameAttributes: ["email"]` — email is the login identifier.
   - `adminCreateUserConfig: { allowAdminCreateUserOnly: true }` — no self-registration.
   - Password policy: minimum 8 chars, require uppercase, lowercase, number, symbol.
   - Auto-verify the `email` attribute.
   - `schemas`: no custom attributes needed — role comes from group membership.
3. Declare a `cognito.UserPoolClient`:
   - `explicitAuthFlows: ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]` — SRP + refresh only.
   - `generateSecret: false` — public client; SRP does not require a client secret.
   - No OAuth flows, no callback URLs, no hosted UI.
   - `tokenValidityUnits` — set AccessToken to 1 hour, RefreshToken to 30 days.
4. Declare two `cognito.UserGroup` resources: `admins` and `onboarders`, both linked to the User Pool.
5. Add stack outputs: `userPoolId`, `userPoolClientId`.
6. Extend the existing IAM policy `Statement` to include:
   - `cognito-idp:AdminCreateUser`
   - `cognito-idp:AdminSetUserPassword`
   - `cognito-idp:AdminAddUserToGroup`
   - `cognito-idp:AdminGetUser`
   - Resource: `arn:aws:cognito-idp:eu-west-1:*:userpool/*` (or derive from the pool ARN output).

**Relevant Context**
- `sst.config.ts` — existing pattern; `@pulumi/aws` already imported, just extend the destructure
- Region is `eu-west-1` throughout
- `generateSecret: false` is correct for SRP flows initiated from a server without a client secret

**Status:** [x] done

---

### Sub-Task 2 — Install Dependencies and Configure NextAuth v5 with Cognito SRP

**Intent**
Install the required packages and create `src/auth.ts` — the central NextAuth configuration. The Credentials provider performs Cognito SRP authentication, extracts the user's group from the `IdToken`, and returns a user object that NextAuth stores in a JWE-encrypted cookie.

**Expected Outcomes**
- `next-auth@beta`, `amazon-cognito-identity-js`, and `jose` are installed (check if `jose` is already a transitive dependency before adding explicitly).
- `src/auth.ts` exports `{ handlers, auth, signIn, signOut }` from a configured `NextAuth` instance.
- The Credentials provider: accepts `email` + `password`, performs SRP via `amazon-cognito-identity-js`, on success returns `{ id: sub, email, name, role, accessToken, idToken, refreshToken, accessTokenExpiry }`.
- The `jwt` callback:
  - On initial sign-in: writes all fields from the Credentials `user` object into the token.
  - On subsequent calls: checks `token.accessTokenExpiry`; if within 5 minutes, calls `InitiateAuth` with `REFRESH_TOKEN_AUTH` via `@aws-sdk/client-cognito-identity-provider` and updates `accessToken`, `idToken`, and `accessTokenExpiry` in the token.
  - If refresh fails (e.g. refresh token expired): sets `token.error = "RefreshTokenExpired"`.
- The `session` callback: copies `token.role`, `token.error`, and `token.sub` to `session.user`.
- Session strategy is `"jwt"`.
- The JWE cookie is configured by providing a `secret` of ≥ 32 bytes (from `NEXTAUTH_SECRET`) — Auth.js v5 uses this for both signing and encryption when `jose` is present; verify exact config against the Auth.js v5 docs in `node_modules/next/dist/docs/` before implementation.
- TypeScript module augmentation: extend `Session` and `JWT` types with `role: "admins" | "onboarders"`, `accessToken`, `idToken`, `refreshToken`, `accessTokenExpiry`, `error?`.

**Todo List**
1. Install `next-auth@beta` and `amazon-cognito-identity-js`. Check if `jose` is already present; install only if missing.
2. Install `@types/amazon-cognito-identity-js` if needed.
3. Create `src/auth.ts`:
   - Configure `CredentialsProvider` with `email` and `password` fields.
   - Inside `authorize`: use `amazon-cognito-identity-js` `CognitoUser.authenticateUser()` with `AuthenticationDetails` to perform SRP. Wrap in a Promise. This runs in Node (server-side) — the Cognito credentials never touch the browser.
   - On success: decode the `IdToken` with `jose` `decodeJwt` to extract `sub`, `email`, `name` (or `cognito:username`), and `cognito:groups`. Derive `role` as `"admins"` if `cognito:groups` includes `"admins"`, else `"onboarders"`.
   - Return the user object; return `null` on auth failure (do not throw — NextAuth treats `null` as a credentials failure).
   - Configure `jwt` callback with refresh logic as described above.
   - Configure `session` callback.
   - Set `session: { strategy: "jwt" }`.
   - Configure JWE: set `secret` from `process.env.NEXTAUTH_SECRET`. Verify in Auth.js v5 docs whether a separate `encode`/`decode` override is needed or whether a long secret is sufficient to enable JWE automatically.
4. Create `src/app/api/auth/[...nextauth]/route.ts` — re-export `handlers` from `src/auth.ts`.
5. Add TypeScript declaration file `src/types/next-auth.d.ts` with the module augmentation.
6. Write unit tests for:
   - The role extraction logic (pure function, test `"admins"` group → `"admins"` role, no groups → `"onboarders"`).
   - The token refresh logic (mock `InitiateAuth`, assert token fields updated).
   - The `session` callback (assert `role` and `error` propagate correctly).

**Relevant Context**
- Read `node_modules/next/dist/docs/` for Auth.js v5 JWT + JWE configuration specifics before writing `src/auth.ts`
- `amazon-cognito-identity-js` provides `CognitoUserPool`, `CognitoUser`, `AuthenticationDetails`, `CognitoUserSession` — use these for SRP
- `@aws-sdk/client-cognito-identity-provider` is used for the refresh (`InitiateAuth` with `REFRESH_TOKEN_AUTH`) and the user management script — check if already installed
- `src/lib/api-types.ts` — `UserProfile` type for reference; the session `user` shape is separate but should be compatible
- `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` env vars are needed inside `authorize`

**Status:** [x] done

---

### Sub-Task 3 — Middleware Route Protection

**Intent**
Add `src/middleware.ts` as the single enforcement point for authentication and RBAC. It reads the decrypted JWE session, checks the role, and redirects or blocks accordingly — no per-page auth checks needed.

**Expected Outcomes**
- Unauthenticated requests to any protected route are redirected to `/login`.
- Authenticated `onboarders` hitting `/admin/*` are redirected to `/dashboard`.
- Authenticated `admins` hitting `/dashboard/*` are redirected to `/admin`.
- Requests with `token.error === "RefreshTokenExpired"` are treated as unauthenticated and redirected to `/login`.
- `/login` and `/api/auth/*` are public — never intercepted.
- API routes (`/api/*` excluding `/api/auth/*`) return `401` JSON (not an HTML redirect) when unauthenticated.
- Static assets (`_next/static`, `_next/image`, `favicon.ico`) are excluded via the `matcher`.

**Todo List**
1. Create `src/middleware.ts` using `auth` from `src/auth.ts` as the middleware export (Auth.js v5 pattern).
2. Define `config.matcher` to cover `/dashboard/:path*`, `/admin/:path*`, `/api/:path*` while excluding `/api/auth/:path*` and static assets.
3. Inside the middleware callback:
   - If no session or `session.user.error === "RefreshTokenExpired"` → redirect to `/login` (or return 401 for API routes).
   - If `session.user.role === "onboarders"` and `pathname.startsWith("/admin")` → redirect to `/dashboard`.
   - If `session.user.role === "admins"` and `pathname.startsWith("/dashboard")` → redirect to `/admin`.
   - API routes: check `pathname.startsWith("/api/")` and return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })` instead of redirecting.
4. Write tests for middleware routing logic — mock `auth()` return values and assert `NextResponse` behaviour for each case:
   - No session + `/dashboard` → redirect `/login`
   - `onboarders` + `/admin` → redirect `/dashboard`
   - `admins` + `/dashboard` → redirect `/admin`
   - No session + `/api/tasks` → 401 JSON
   - `RefreshTokenExpired` + any route → redirect `/login`

**Relevant Context**
- Auth.js v5 middleware pattern: `export const { auth: middleware } = NextAuth(config)` or a wrapper — verify in `node_modules/next/dist/docs/`
- No `middleware.ts` currently exists — net-new file
- `src/auth.ts` from Sub-Task 2 must be complete first

**Status:** [x] done

---

### Sub-Task 4 — Login Page

**Intent**
Add a `/login` page with a custom email + password form. On submit, it calls `signIn("credentials", ...)` from Auth.js. On success, NextAuth performs the role-based redirect automatically. No redirect to Cognito hosted UI — fully in-app.

**Expected Outcomes**
- `/login` renders a centred, IBM-branded card with email and password fields and a "Sign in" button.
- Form submission calls `signIn("credentials", { email, password, redirectTo: "/" })` — NextAuth resolves the role-based redirect via the `signIn` callback or the middleware handles it post-login.
- Invalid credentials show an inline error message (NextAuth returns an error string on failure).
- Already-authenticated users visiting `/login` are redirected immediately (handled in the page via `auth()` server-side check).
- All colours use theme tokens from `globals.css` — no inline hex values.
- Page is covered by tests: renders form fields, shows error on failed sign-in, calls `signIn` on submit.

**Todo List**
1. Create `src/app/login/page.tsx` as a **client component**.
2. Add a server-side session check at the top (using `auth()`) — if already authenticated, `redirect()` to the appropriate route based on role.
3. Build the form: `email` input, `password` input, submit button, error display area.
4. On submit: call `signIn("credentials", { email, password, redirect: false })` — this invokes the NextAuth Server Action under the hood; the browser posts to the NextAuth endpoint, SRP runs on the server. Check for error in the response, display it inline if present; on success navigate to `/` (middleware handles the role-based redirect from there).
5. Style using existing tokens: `bg-page-bg`, `bg-card-bg`, `border-border`, `text-ibm-blue`, `bg-ibm-blue` for the button — match the visual language of `DashboardLayout`.
6. Write `src/test/login-page.test.tsx`:
   - Renders email field, password field, submit button.
   - Shows error message when `signIn` returns an error.
   - Calls `signIn("credentials", ...)` with correct args on submit.

**Relevant Context**
- `src/app/globals.css` — all theme tokens
- `src/components/dashboard/DashboardLayout.tsx` — IBM brand styling reference
- Auth.js v5: `signIn` from `next-auth/react` for client components; `redirect: false` to handle errors inline without a page reload

**Status:** [x] done

---

### Sub-Task 5 — Remove Mock User, Wire Real Session into Dashboard and Admin

**Intent**
Replace the hardcoded `MOCK_USER` everywhere with the real authenticated session user. The `userId` used for all DynamoDB queries becomes the Cognito `sub`. The admin link in `DashboardLayout` is hidden from onboarders.

**Expected Outcomes**
- `src/app/dashboard/page.tsx` uses `auth()` to get the session; `session.user.sub` is used as the DynamoDB `userId`.
- `src/app/api/user/route.ts` returns the session user's fields instead of the hardcoded mock.
- All other API routes that currently use the hardcoded `"usr-mock-001"` userId are updated to read the userId from the session (check `/api/tasks`, `/api/meetings`, `/api/slack-messages`, `/api/sentiment`).
- The "⚙ Admin Config" link in `DashboardLayout` is only rendered when the user's role is `"admins"`.
- `src/app/admin/page.tsx` reads the session user's name for display.
- No `any` types introduced. No existing tests broken without replacement tests.

**Todo List**
1. Update `src/app/dashboard/page.tsx`:
   - Remove `MOCK_USER` constant.
   - Call `await auth()` at the top; if no session, redirect to `/login` (belt-and-suspenders — middleware already handles this, but good for type safety).
   - Map `session.user` to the `UserProfile` shape: `{ id: session.user.sub, name: session.user.name, role: session.user.role, startDate: ... }` — note `startDate` is not in the Cognito session; decide whether to drop it from `UserProfile` or default it to the current date for now.
   - Pass `session.user.sub` as `userId` to all DynamoDB queries.
2. Audit all API routes for hardcoded `"usr-mock-001"` and replace with `session.user.sub` from `auth()`:
   - `src/app/api/tasks/route.ts`
   - `src/app/api/tasks/[taskId]/route.ts`
   - `src/app/api/meetings/route.ts`
   - `src/app/api/slack-messages/route.ts`
   - `src/app/api/sentiment/route.ts`
   - `src/app/api/user/route.ts`
3. Update `src/components/dashboard/DashboardLayout.tsx`:
   - Add `role` to the props interface (or derive from the `user` prop).
   - Wrap the admin link render in `{role === "admins" && ...}`.
4. Update `src/app/admin/page.tsx`:
   - Call `auth()` to get the session user's name.
   - Remove the Phase 1 "no access control" warning banner.
5. Update affected tests to mock `auth()` instead of the hardcoded mock user.

**Relevant Context**
- `src/app/dashboard/page.tsx` — `MOCK_USER` constant; all DynamoDB calls pass `userId: MOCK_USER.id`
- `src/app/api/user/route.ts` — returns hardcoded object
- `src/components/dashboard/DashboardLayout.tsx` lines 231–241 — admin link
- `src/lib/api-types.ts` — `UserProfile` type; make `startDate` optional (`startDate?: string`) since it is not present in the Cognito session
- Search for `usr-mock-001` across `src/app/api/` to catch all usages

**Status:** [x] done

---

### Sub-Task 6 — User Management Script

**Intent**
Provide a CLI script to create users in Cognito and assign them to a group. This is the only mechanism for adding users — no self-registration exists.

**Expected Outcomes**
- `scripts/create-user.ts` accepts `--email`, `--name`, `--role` (`admins` | `onboarders`), and `--temp-password` CLI flags.
- The script: creates the Cognito user, sets the password as permanent (skips forced-change flow), and adds them to the correct group.
- Running `npm run create-user -- --email alice@ibm.com --name "Alice Smith" --role onboarders --temp-password TempP@ss1` creates a user who can log in immediately.
- Inputs are Zod-validated before any AWS calls.
- Passwords are not logged (masked in output).
- `npm run create-user` is added to `package.json`.

**Todo List**
1. Check if `@aws-sdk/client-cognito-identity-provider` is already installed (it may be pulled in by `amazon-cognito-identity-js`); install if missing.
2. Create `scripts/create-user.ts`:
   - Parse `process.argv` for `--email`, `--name`, `--role`, `--temp-password` flags.
   - Zod-validate: email format, name non-empty string, role is `z.enum(["admins", "onboarders"])`, password min 8 chars.
   - Instantiate `CognitoIdentityProviderClient` from env vars: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `COGNITO_USER_POOL_ID`.
   - Call `AdminCreateUserCommand`: `Username: email`, `TemporaryPassword: tempPassword`, `MessageAction: "SUPPRESS"`, `UserAttributes: [{ Name: "name", Value: name }, { Name: "email", Value: email }, { Name: "email_verified", Value: "true" }]`.
   - Call `AdminSetUserPasswordCommand`: `Username: email`, `Password: tempPassword`, `Permanent: true`.
   - Call `AdminAddUserToGroupCommand`: `Username: email`, `GroupName: role`.
   - Log success: `User alice@ibm.com created and added to onboarders` (password masked).
3. Add `"create-user": "tsx --env-file=.env.local scripts/create-user.ts"` to `package.json` `scripts`.

**Relevant Context**
- `scripts/seed-tasks.ts` — existing script pattern using `tsx --env-file=.env.local`
- `COGNITO_USER_POOL_ID` env var added in Sub-Task 7
- IAM permissions for Cognito admin actions added in Sub-Task 1

**Status:** [x] done

---

### Sub-Task 7 — Environment Variables and Documentation

**Intent**
Document all new environment variables, clean up Phase 1 warnings, and update `AGENTS.md` so future agents have accurate context.

**Expected Outcomes**
- `.env.example` has a new `── Cognito / Auth ──` section with all new variables and comments.
- `AGENTS.md` project structure section reflects `src/auth.ts`, `src/middleware.ts`, `src/app/login/`, and `src/types/next-auth.d.ts`.
- The Phase 1 "no access control" warning banner in `src/app/admin/page.tsx` is removed (also covered in Sub-Task 5).
- `mvp-plan.md` auth section is updated to reflect the implemented approach.

**Todo List**
1. Update `.env.example` — add section:
   ```
   # ── Cognito / Auth ────────────────────────────────────────────────────────────
   # NEXTAUTH_SECRET=        # generate: openssl rand -base64 32  (≥32 bytes for JWE)
   # NEXTAUTH_URL=           # http://localhost:3000 for local dev; set to prod URL in Vercel dashboard
   # COGNITO_USER_POOL_ID=   # from SST stack output: userPoolId
   # COGNITO_CLIENT_ID=      # from SST stack output: userPoolClientId
   # COGNITO_REGION=         # eu-west-1
   ```
2. Update `AGENTS.md`:
   - Add `src/auth.ts`, `src/middleware.ts`, `src/app/login/page.tsx`, `src/types/next-auth.d.ts` to the project structure table.
   - Update the "No real auth" Phase 1 constraint to reflect that auth is now implemented.
   - Add a note about `session.user.sub` as the DynamoDB `userId`.
3. Note: no `COGNITO_CLIENT_SECRET` is needed — `generateSecret: false` on the App Client (SRP flows don't require a client secret).

**Relevant Context**
- `.env.example` — add after the existing DynamoDB section
- `AGENTS.md` — Phase 1 constraints section and project structure section

**Status:** [x] done

---

## Implementation Order

Sub-tasks must be completed in this sequence. Sub-Tasks 3 and 4 can be parallelised once Sub-Task 2 is done. Sub-Task 6 can be worked in parallel with Sub-Tasks 3–5.

```
1 (SST infra)
    ↓
2 (NextAuth + Cognito SRP + JWE config)
    ↓              ↓
3 (Middleware)   4 (Login page)
    ↓
5 (Wire real session — remove mock user)
    ↓
6 (create-user script)   ← can start after Sub-Task 1
    ↓
7 (Env vars + docs)
```

---

## Key Design Decisions (Summary)

| Decision | Choice | Rationale |
|---|---|---|
| Auth flow | Cognito SRP (`COGNITO_USER_SRP_AUTH`) | Password never leaves client in plaintext; no OIDC redirect |
| Session storage | Stateless JWE cookie | No Redis/DB needed; tokens encrypted and opaque to client |
| Token refresh | Silent refresh in `jwt` callback | Transparent to user; 5-min window before expiry |
| Role storage | Cognito User Pool Groups (`cognito:groups` in IdToken) | Idiomatic Cognito RBAC; easy to manage; supports future roles |
| User identity | Cognito `sub` (UUID) | Stable primary key even if email changes |
| User provisioning | Admin-only CLI script | No self-registration in MVP |
| App Client secret | None (`generateSecret: false`) | SRP does not require a client secret; simpler credential management |
