<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# IBM Onboarding Platform — Agent Context

## What this project is

A **Next.js 15 (App Router) onboarding platform** for IBM new starters. It is currently in **Phase 1**: frontend only, DynamoDB for persistence, no auth. The plan lives in [`mvp-plan.md`](mvp-plan.md). The V2 feature plan lives in [`v2-portal-plan.md`](v2-portal-plan.md). Architecture decisions are in [`docs/adr/`](docs/adr/).

---

## Infra files

| File | Purpose |
|---|---|
| [`Dockerfile`](Dockerfile) | Multi-stage production build — UBI9 Node.js 22 Minimal, non-root UID 1001, standalone Next.js output |
| [`.dockerignore`](.dockerignore) | Excludes node_modules, .next, secrets, test files from the image context |
| [`next.config.ts`](next.config.ts) | `output: "standalone"` enabled — required for the Docker image |
| [`sst.config.ts`](sst.config.ts) | SST v3 infrastructure — DynamoDB tables and IAM policy for the app |

---

## Deployment

### Backend (SST — DynamoDB + IAM)

```bash
npx sst deploy --stage prod
```

Run once to provision all DynamoDB tables. Re-run after any changes to [`sst.config.ts`](sst.config.ts).

### Frontend (Vercel)

The Next.js app is deployed on **Vercel** with two environments:

| Environment | Trigger | URL |
|---|---|---|
| **Preview** | Every push / pull request | Auto-generated Vercel preview URL |
| **Production** | Merge to `main` | Production domain |

Vercel reads environment variables from the Vercel project dashboard — **do not commit `.env.local`**. Set all variables from [`.env.example`](.env.example) in the Vercel dashboard for both Preview and Production environments.

> **Note:** `next.config.ts` uses `output: "standalone"` for Docker builds. Vercel does **not** need standalone mode — if deploying exclusively to Vercel, this can be removed. Leave it in place for now so the Dockerfile remains valid.

### Seed scripts (run once after `sst deploy`)

```bash
npm run seed-meetings -- --userId usr-mock-001
npm run seed-org-chart
npm run seed-slack-messages -- --userId usr-mock-001
npm run seed-tasks -- --userId usr-mock-001
npm run seed-config
```

Seed scripts use `--env-file=.env.local` via `tsx`. Run from your local machine with valid AWS credentials — **do not run against production tables without verifying the `--userId` value first**.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, `src/` directory, Turbopack in dev) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 — **theme tokens defined in `src/app/globals.css`** |
| Validation | Zod v4 |
| Testing | Vitest + `@testing-library/react` |
| Runtime | Node.js 24 |
| Database | AWS DynamoDB (via `@aws-sdk/lib-dynamodb`) |

---

## Project structure

```
src/
├── auth.ts                      # NextAuth v5 config — Cognito SRP, JWE session, token refresh
├── middleware.ts                # Route protection — RBAC enforcement for all protected routes
├── types/
│   └── next-auth.d.ts           # Module augmentation: Session/JWT with role, tokens, error
├── app/
│   ├── dashboard/page.tsx       # New starter dashboard (server component — reads real session)
│   ├── admin/page.tsx           # Admin config portal (client component — admins only)
│   ├── login/page.tsx           # Login page — email/password form, Cognito SRP via server action
│   ├── page.tsx                 # Root redirect → /dashboard
│   ├── layout.tsx               # Root layout (no Geist font, system-ui)
│   ├── globals.css              # Tailwind @theme tokens — edit here for colours
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # NextAuth catch-all handler
│       ├── config/route.ts
│       ├── user/route.ts
│       ├── tasks/route.ts
│       ├── tasks/[taskId]/route.ts
│       ├── meetings/route.ts
│       ├── org-chart/route.ts
│       ├── slack-messages/route.ts
│       ├── sentiment/route.ts
│       └── admin/config/route.ts
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx      # Tab shell — 9 tabs, TabSwitchContext
│   │   ├── HeroHeader.tsx           # Dark hero with KPI tiles
│   │   ├── BobBar.tsx               # Persistent "Ask Bob" bar
│   │   ├── OverviewTab.tsx          # Overview tab panel
│   │   ├── CalendarTab.tsx          # Calendar & Outlook tab panel
│   │   ├── MeetingModal.tsx         # Meeting detail modal
│   │   ├── SlackTab.tsx             # Slack tab panel (3 sub-tabs)
│   │   ├── SlackModal.tsx           # Slack message modal
│   │   ├── OrgChartTab.tsx          # Org Chart tab panel (CSS tree)
│   │   ├── OrgModal.tsx             # Org node person modal
│   │   ├── CommunitiesTab.tsx       # Communities tab panel
│   │   ├── CommunityModal.tsx       # Community detail modal
│   │   ├── ContactModal.tsx         # Contact detail modal
│   │   ├── LearningModal.tsx        # Training course modal
│   │   └── SentimentWidget.tsx      # Bob Pulse weekly check-in
│   └── plugins/
│       ├── AnnouncementsPlugin.tsx
│       ├── ChecklistPlugin.tsx      # Click → opens no modal (tasks cycle state)
│       ├── TrainingPlugin.tsx       # Click → LearningModal
│       ├── FaqLinksPlugin.tsx
│       ├── Plan90Plugin.tsx
│       ├── ContactsPlugin.tsx       # Click → ContactModal
│       └── PolicyDocsPlugin.tsx
├── config/
│   └── org-config.json          # Source of truth for all plugin config (8 plugins)
├── hooks/
│   └── useTaskState.ts          # localStorage + BFF-backed task state
├── lib/
│   ├── config.ts                # resolveOrgConfig() — reads + validates org-config.json
│   ├── api-types.ts             # Shared TS types: UserProfile, TaskState, Meeting, OrgNode, etc.
│   ├── tasks/
│   │   ├── repository.ts        # TaskRepository — DynamoDB CRUD
│   │   ├── dynamodb-client.ts   # Shared DynamoDB DocumentClient
│   │   └── date-utils.ts        # Date helpers
│   ├── config/repository.ts     # ConfigRepository — reads plugin config from DynamoDB
│   ├── meetings/repository.ts   # MeetingRepository
│   ├── sentiment/repository.ts  # SentimentRepository
│   ├── org-chart/repository.ts  # OrgChartRepository
│   └── slack/repository.ts      # SlackRepository
├── plugins/
│   ├── types.ts
│   └── schemas/
│       ├── checklist.ts
│       ├── training.ts          # Now includes: duration?, platform?, description?
│       ├── faq-links.ts
│       ├── plan-90.ts
│       ├── contacts.ts          # Now includes: email?, slackHandle?
│       ├── policy-docs.ts
│       ├── announcements.ts
│       └── communities.ts       # NEW — Community + CommunitiesConfig
└── test/
    ├── setup.ts
    ├── config.test.ts           # resolveOrgConfig() tests
    ├── schemas.test.ts          # Plugin Zod schema tests (original 7 plugins)
    ├── date-utils.test.ts
    ├── useTaskState.test.ts
    ├── slack-tab.test.tsx        # SlackTab + SlackModal (17 tests)
    ├── org-chart-tab.test.tsx    # OrgChartTab + OrgModal (14 tests)
    ├── communities-tab.test.tsx  # CommunitiesTab + CommunityModal (17 tests)
    ├── contacts-learning-modals.test.tsx  # ContactModal + LearningModal (22 tests)
    ├── v2-schemas.test.ts        # communitySchema, V2 entity contract schemas, updated contacts/training (55 tests)
    └── sentiment.test.ts         # POST /api/sentiment route (8 tests)
scripts/
├── seed-tasks.ts
├── seed-config.ts
├── seed-meetings.ts
├── seed-org-chart.ts
└── seed-slack-messages.ts
docs/
└── adr/
    └── ADR-001-plugin-architecture.md
```

---

## Test-Driven Development (TDD) — MANDATORY

**All new code in this project must be written using TDD.** This is not optional.

### The TDD cycle

1. **Write a failing test first.** Run `npm run test` and confirm the test fails with a "file not found" or assertion error — not a syntax error on your part.
2. **Write the minimum code to make it pass.** Do not add features beyond what the test requires.
3. **Run `npm run test` again.** Confirm the test(s) pass.
4. **Run `npm run typecheck`.** Confirm zero errors before marking work done.

### Rules

- **Never create a component, hook, utility, or API route without a test file first.**
- Test files live in `src/test/` and follow the naming convention `<feature>.test.ts` (for logic) or `<feature>.test.tsx` (for React components).
- Component tests use `@testing-library/react` — render, query, fireEvent, waitFor. See existing tests for patterns.
- API route tests mock repository dependencies with `vi.mock()` or `vi.spyOn()` — never hit real DynamoDB in tests.
- Schema tests call `schema.safeParse()` with valid and invalid inputs and assert `result.success`.
- Hook tests use `renderHook` + `act` from `@testing-library/react`. See `src/test/useTaskState.test.ts`.
- Use `vi.stubGlobal('fetch', ...)` to mock `fetch` in component tests. See `src/test/slack-tab.test.tsx`.

### Test patterns already established — follow these

| Test type | Example file |
|---|---|
| Zod schema | `src/test/schemas.test.ts` |
| resolveOrgConfig | `src/test/config.test.ts` |
| React hook | `src/test/useTaskState.test.ts` |
| React component + fetch mock | `src/test/slack-tab.test.tsx` |
| Modal component | `src/test/contacts-learning-modals.test.tsx` |
| Tab + modal together | `src/test/org-chart-tab.test.tsx` |

---

## Key conventions

### Theming — ALWAYS use theme tokens, never inline hex values
All colours are defined as CSS custom properties via `@theme` in [`src/app/globals.css`](src/app/globals.css):

| Token | Class | Use for |
|---|---|---|
| `--color-fg` | `text-fg` | Primary text |
| `--color-muted` | `text-muted` | Secondary / helper text |
| `--color-faint` | `text-faint` | Timestamps, meta, disabled |
| `--color-page-bg` | `bg-page-bg` | Page background |
| `--color-card-bg` | `bg-card-bg` | Card / panel background |
| `--color-border` | `border-border` | Card borders |
| `--color-subtle` | `bg-subtle` | Row dividers, subtle fills |
| `--color-ibm-blue` | `text-ibm-blue` / `bg-ibm-blue` | IBM brand blue |
| `--color-ibm-blue-bg` | `bg-ibm-blue-bg` | IBM blue tinted background |
| `--color-ibm-blue-light` | `text-ibm-blue-light` | Carbon Blue 30 — light text on dark backgrounds (e.g. BOB PULSE label) |
| `--color-ibm-nav` | `bg-ibm-nav` | Tab nav / dark blue header background |
| `--color-ibm-nav-bd` | `border-ibm-nav-bd` | Tab nav bottom border |
| `--color-tab-active` | `border-tab-active` | Active tab underline (yellow) |
| `--color-hero-bg` | `bg-hero-bg` | Dark hero background |
| `--color-hero-text` | `text-hero-text` | White text on dark hero |
| `--color-hero-muted` | `text-hero-muted` | Muted text on dark hero |
| `--color-hero-surface` | `bg-hero-surface` | Dark card / raised surface inside hero |
| `--color-hero-track` | `bg-hero-track` | Progress bar track inside hero |
| `--color-surface` | `bg-surface` | Light page surface (same value as page-bg, distinct semantic) |
| `--color-green` / `--color-green-bg` | `text-green` / `bg-green-bg` | Success / completed |
| `--color-amber` / `--color-amber-bg` | `text-amber` / `bg-amber-bg` | Warning / in-progress |
| `--color-red` / `--color-red-bg` | `text-red` / `bg-red-bg` | Error / overdue |
| `--color-purple` / `--color-purple-bg` | `text-purple` / `bg-purple-bg` | Purple accent |
| `--color-pink` / `--color-pink-bg` | `text-pink` / `bg-pink-bg` | Pink accent |

**Never use `style={{ color: '#...' }}` for colours defined in the theme.** Only use inline `style` for dynamic values derived at runtime from data (e.g. `node.color` from seed data, progress bar widths).

### Tab layout (V2)
The dashboard uses a 9-tab layout managed in `DashboardLayout.tsx`. Tabs: `overview | calendar | slack | org | contacts | checklist | plan | learning | communities`. The `TabSwitchContext` allows child components to switch tabs programmatically via `useTabSwitch()`.

### Plugin system
Every configurable dashboard section is a **plugin**:
- A Zod schema in `src/plugins/schemas/<id>.ts`
- An entry in `src/config/org-config.json` with `{ pluginId, enabled, order, config }`
- A React component
- Registered in `src/lib/config.ts` `pluginSchemas` map
- Rendered in the relevant tab case in `DashboardLayout.tsx`

### DynamoDB repositories
Each entity has a typed repository class under `src/lib/<entity>/repository.ts`. All follow the pattern in `src/lib/tasks/repository.ts`. They import `documentClient` from `src/lib/tasks/dynamodb-client.ts` — never instantiate a new client.

### API routes
- All `GET` routes return data for the mock user `usr-mock-001`
- `POST /api/sentiment` Zod-validates the body — returns 400 with `{ error, details }` on failure
- `/api/slack-messages` returns `{ messages: SlackMessage[], grouped: { dm, channel, mention } }` — **not** a plain array
- Do not change response shapes without considering Phase 2 compatibility

### Modal pattern
All modals follow the same structure:
- `role="dialog"` backdrop div with `onClick={onClose}`
- Inner panel with `onClick={(e) => e.stopPropagation()}`
- Sticky header with title + `aria-label="Close"` × button
- `aria-label="Close"` on the footer Close button too
- Returns `null` when the selected item is `null`

### Component patterns
- `src/app/dashboard/page.tsx` is a **server component** — reads config directly, no fetch
- All tab panels, plugin components, and `DashboardLayout` are **client components** (`'use client'`)
- No `any` types anywhere

---

## Scripts

```bash
npm run dev                    # Dev server (Turbopack)
npm run build                  # Production build
npm run test                   # Vitest unit tests (189 tests)
npm run test:watch             # Watch mode
npm run typecheck              # tsc --noEmit (must pass clean)
npm run seed-meetings -- --userId usr-mock-001  # see Deployment section
npm run seed-org-chart
npm run seed-slack-messages -- --userId usr-mock-001
npm run seed-tasks -- --userId usr-mock-001
npm run seed-config
```

---

## Auth & RBAC

Authentication is implemented via **NextAuth v5 + Cognito SRP**:
- Users log in at `/login` via a custom email/password form
- SRP runs server-side in the NextAuth Credentials provider `authorize` function
- Session stored as a **JWE-encrypted cookie** (A256CBC-HS512, no Redis/DB needed)
- Role comes from Cognito User Pool Groups (`cognito:groups` in the IdToken)
- `session.user.id` = Cognito `sub` (UUID) — used as the DynamoDB `userId` for all queries
- `src/middleware.ts` enforces access: `onboarders` → `/dashboard` only, `admins` → `/admin` only
- Silent token refresh in the `jwt` callback (5-min window before expiry)
- Users are created via `npm run create-user -- --email --name --role --temp-password`

## Phase 1 constraints (do not work around these)

- **Bob AI bar** — UI shell only; submit shows a static placeholder, no real LLM call
- **No external API calls** — Slack/Outlook integrations use seeded DynamoDB data
- **No monorepo** — single Next.js app at repo root

## Phase 2 (planned, not started)

Real Node.js/Express API, PostgreSQL for task state, Redis, manager view, real LLM wiring for Bob. See `mvp-plan.md`.

---

## Security rules (always apply)

- Never hardcode secrets — use `.env.local` (gitignored); see `.env.example` for variable names
- No PII in logs
- Zod-validate all API route inputs before processing
- No `style` attributes that embed sensitive values
- DynamoDB table names come from env vars — never hardcode them
