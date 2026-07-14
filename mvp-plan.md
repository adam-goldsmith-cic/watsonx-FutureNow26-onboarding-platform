# IBM Onboarding Platform — MVP Plan (Phase 1)

## Overview

Build the IBM Onboarding Platform MVP as a **single Next.js 15 (App Router) application** with a **BFF layer using Next.js API routes** serving mock data. No separate backend, no database, no monorepo. Plugin definitions, config schemas, and UI components all live inside the Next.js app. Task state is persisted in `localStorage`. An admin panel allows plugins to be toggled on/off and reordered.

The goal is a fully interactive, demonstrable onboarding dashboard that proves the plugin-driven architecture and per-user task tracking — ready for Phase 2 (real API + PostgreSQL) to be layered on with minimal restructuring.

**Scope:** Frontend only. BFF = Next.js API routes with static/mock JSON responses.

**Out of scope (Phase 2+):** Real database, authentication, manager view, monorepo split, external integrations (Slack, Jira, LMS).

**Stack:**
- Next.js 15 (App Router, TypeScript, `src/` directory at repo root)
- Tailwind CSS (styling, matching the IBM design language from the HTML prototype)
- Zod (plugin config schema validation)

---

## Project Structure

```
/ (repo root)
├── src/
│   ├── app/
│   │   ├── dashboard/page.tsx           # New starter dashboard
│   │   ├── admin/page.tsx               # Admin config portal
│   │   └── api/
│   │       ├── config/route.ts          # GET org plugin config
│   │       ├── user/route.ts            # GET mock user profile
│   │       ├── tasks/route.ts           # GET mock task state
│   │       ├── tasks/[taskId]/route.ts  # PATCH task status
│   │       └── admin/config/route.ts    # POST updated org config
│   ├── components/
│   │   ├── dashboard/                   # DashboardLayout, HeroHeader
│   │   └── plugins/                     # One component per plugin
│   ├── config/
│   │   └── org-config.json              # Local plugin config (source of truth)
│   ├── hooks/
│   │   └── useTaskState.ts
│   ├── lib/
│   │   ├── config.ts                    # resolveOrgConfig()
│   │   └── api-types.ts                 # Shared TS types
│   └── plugins/
│       ├── types.ts                     # PluginDefinition interface
│       └── schemas/                     # Zod schemas per plugin
├── docs/adr/
│   └── ADR-001-plugin-architecture.md
├── .env.example
└── .gitignore
```

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffold

**Status:** `[x] done`

**Intent:**
Bootstrap the Next.js 15 app with the correct folder structure, tooling config, and placeholder files. Everything downstream depends on this being set up correctly.

**Expected Outcomes:**
- A working Next.js 15 app at the repo root with TypeScript, Tailwind CSS, App Router, and `src/` directory layout
- `src/plugins/`, `src/config/`, `src/hooks/`, `src/lib/`, `src/components/plugins/` directories exist
- `docs/adr/ADR-001-plugin-architecture.md` placeholder created
- `.gitignore` covers `node_modules`, `.env.local`, `.next`, `dist`
- `.env.example` has commented placeholder variables (`DATABASE_URL`, `REDIS_URL`, `OIDC_CLIENT_ID`, `WATSONX_API_KEY`) — none used yet, present for Phase 2 readiness
- `npm run dev` starts the app with no errors

**Todo List:**
1. Scaffold the Next.js 15 app at the repo root via `create-next-app` with TypeScript, Tailwind CSS, App Router, and `src/` directory
2. Create `src/plugins/`, `src/config/`, `src/hooks/`, `src/lib/`, `src/components/plugins/`, `src/components/dashboard/` directories
3. Create `docs/adr/ADR-001-plugin-architecture.md` with a placeholder stub
4. Add `.env.example` with commented Phase 2 variables
5. Verify `.gitignore` includes `.env.local`
6. Confirm `npm run dev` runs cleanly

**Relevant Context:**
- Security rule: `.env.local` must never be committed — verify `.gitignore`
- No monorepo, no workspaces — flat single-app structure

---

### Sub-Task 2 — Plugin Definition & Local Config

**Status:** `[x] done`

**Intent:**
Define the `PluginDefinition` TypeScript interface and Zod config schemas for all 7 MVP plugins. Populate `org-config.json` with default content matching the HTML prototype. Write the `resolveOrgConfig()` utility that validates and returns typed config. This is the central contract everything else is built on.

**Expected Outcomes:**
- `src/plugins/types.ts` exports `PluginDefinition<TConfig>` interface and `PluginCategory` enum
- `src/plugins/schemas/` contains one Zod schema file per plugin
- `src/config/org-config.json` populated with default content for all 7 plugins, matching the HTML prototype content exactly
- `src/lib/config.ts` exports `resolveOrgConfig()` — reads JSON, validates against each plugin's schema, throws on invalid config
- `npm run typecheck` passes

**Todo List:**
1. Define `PluginDefinition<TConfig>` in `src/plugins/types.ts` with fields: `id`, `name`, `category`, `enabled`, `order`, `configSchema` (Zod), `defaultConfig`
2. Define `PluginCategory` type: `'core' | 'hr' | 'it' | 'learning' | 'comms' | 'custom'`
3. Write Zod schemas for all 7 plugins in `src/plugins/schemas/`:
   - `checklist.ts` — tasks array (id, label, category, dueDayOffset, mandatory, roles, optional link)
   - `training.ts` — courses array (id, title, category, progress 0–100, status, optional dueDate)
   - `faq-links.ts` — links array (id, label, description, icon, url)
   - `plan-90.ts` — phases array (label, colorClass, goals string array)
   - `contacts.ts` — contacts array (initials, name, role, description) + tools array (name, status enum)
   - `policy-docs.ts` — documents array (title, description, optional askBobPrompt)
   - `announcements.ts` — items array (id, message, audience, optional expiresAt ISO string)
4. Populate `src/config/org-config.json` with content from the HTML prototype (all 7 plugins, `enabled: true`, correct `order` values)
5. Write `resolveOrgConfig()` in `src/lib/config.ts`

**Relevant Context:**
- `PluginDefinition` contract from session notes §6
- Full content for all sections in session notes §§3.1–3.4 (tasks, courses, links, plan phases, contacts, tools, documents)
- Task category tags from HTML prototype: IT, HR, SEC, MGR, TEAM

---

### Sub-Task 3 — BFF API Routes (Mock Data Layer)

**Status:** `[x] done`

**Intent:**
Create Next.js API routes that act as the BFF. These routes serve org config and mock user/task state. The shape of these responses is designed to match what the real Express API will return in Phase 2 — the frontend data-fetching layer will not need to change.

**Expected Outcomes:**
- `GET /api/config` — returns the resolved org plugin config from `org-config.json`
- `GET /api/user` — returns a hardcoded mock user `{ id, name, role: "new_starter", startDate }`
- `GET /api/tasks` — returns a mock task state array seeded from the checklist plugin config
- `PATCH /api/tasks/[taskId]` — accepts `{ status }` body, returns updated task (in-memory; localStorage is the persistent source of truth in Phase 1)
- `POST /api/admin/config` — accepts updated org config JSON, validates with Zod, writes back to `org-config.json`
- All routes return structured JSON; errors return `{ error: "message" }` with correct HTTP status codes
- All route handlers are fully TypeScript-typed using `NextRequest` / `NextResponse`

**Todo List:**
1. Create `src/app/api/config/route.ts` — calls `resolveOrgConfig()`, returns result as JSON
2. Create `src/app/api/user/route.ts` — returns hardcoded mock user object
3. Create `src/app/api/tasks/route.ts` — GET returns mock task state array (one record per checklist task, all `NOT_STARTED` initially)
4. Create `src/app/api/tasks/[taskId]/route.ts` — PATCH validates body with Zod, returns updated task record
5. Create `src/app/api/admin/config/route.ts` — POST validates full config with Zod, writes to `org-config.json` using `fs`
6. Define shared response types in `src/lib/api-types.ts`: `UserProfile`, `TaskState`, `TaskStatus` enum, `OrgConfigResponse`

**Relevant Context:**
- Task state fields from session notes §8: `user_id`, `task_id`, `status`, `due_date`, `completed_at`, `notes`
- `TaskStatus` enum: `NOT_STARTED | IN_PROGRESS | BLOCKED | DONE | VERIFIED`
- Security: no PII in logs; Zod validation on all POST/PATCH inputs before processing

---

### Sub-Task 4 — New Starter Dashboard UI

**Status:** `[x] done`

**Intent:**
Build the main new starter dashboard page composed of the 7 plugin components. Each component receives its resolved config as props. Task state is managed by the `useTaskState` hook backed by localStorage with BFF sync. The visual design matches the IBM "Future Now" style from the HTML prototype.

**Expected Outcomes:**
- `src/app/dashboard/page.tsx` — server component that fetches org config and user from BFF, passes to client layout
- `src/components/dashboard/DashboardLayout.tsx` — client component that renders only enabled plugins in configured order
- `src/hooks/useTaskState.ts` — manages localStorage-backed task state, calls `PATCH /api/tasks/[taskId]` on updates
- Hero header with IBM Future Now branding, "Week N of 12" pill, overall progress bar, and Day 1 / Week 1 / 30-Day / 60/90-Day milestone markers
- 7 plugin components in `src/components/plugins/`, each receiving typed config props:
  - `ChecklistPlugin` — task list with status cycle on click (NOT_STARTED → IN_PROGRESS → DONE), category badges, due dates, stats row (Completed / In Progress / To Do / Overdue)
  - `TrainingPlugin` — course cards with progress bars and status pills
  - `FaqLinksPlugin` — 2-column grid of link tiles with icon badges and chevrons
  - `Plan90Plugin` — 3-column 30/60/90 day plan with colour-coded phase headers
  - `ContactsPlugin` — key contacts avatar cards + tools setup status grid
  - `PolicyDocsPlugin` — policy documents table with Ask Bob prompt chips (display-only in Phase 1)
  - `AnnouncementsPlugin` — banner cards, expired items filtered out client-side
- All components fully typed; no `any`

**Todo List:**
1. Create `useTaskState` hook — initialises from `GET /api/tasks`, merges with localStorage cache, exposes `taskStates` map and `updateTaskStatus(taskId, status)` that calls PATCH and persists to localStorage
2. Build `DashboardLayout` — iterates enabled, ordered plugins; renders matching component per `plugin.id`
3. Build hero header component with progress calculation and milestone markers
4. Build `ChecklistPlugin` with task rows, status toggle, category badge, overdue detection, and stats row
5. Build `TrainingPlugin` with course cards and progress bars
6. Build `FaqLinksPlugin` with 2-column tile grid
7. Build `Plan90Plugin` with 3-column phase layout (blue / purple / green top borders)
8. Build `ContactsPlugin` with avatar cards and tools grid
9. Build `PolicyDocsPlugin` with documents table and Ask Bob chips
10. Build `AnnouncementsPlugin` with expiry filtering
11. Wire `dashboard/page.tsx` as a server component fetching config and user, rendering `DashboardLayout`

**Relevant Context:**
- IBM design tokens from HTML prototype: dark hero `#1c1c1e`, IBM blue `#1f70c1`, card border `#e5e7eb`, secondary text `#57606a`
- Full visual spec for every section in session notes §§3.1–3.4
- Overdue = `due_date < today && status !== DONE` (due_date = startDate + dueDayOffset days)
- Stats row labels: Completed / In Progress / To Do / Overdue

---

### Sub-Task 5 — Admin Config Portal

**Status:** `[x] done`

**Intent:**
Build the admin panel at `/admin` where an admin can toggle plugins on/off and reorder them, with changes written back to `org-config.json` via the BFF and immediately reflected on the dashboard. This is the core demonstration of the plugin-driven architecture.

**Expected Outcomes:**
- `src/app/admin/page.tsx` — admin config portal page
- Plugin list showing each plugin's name, category pill, current enabled state, and order position
- Enable/disable toggles — disabling a plugin removes it from the dashboard render
- Up/down order controls to reorder plugins
- Inline text editor for announcement content (simplest field to demo live config editing)
- "View Dashboard" link to `/dashboard`
- Changes persist across page refresh (written to `org-config.json` via `POST /api/admin/config`)
- A clear UI note that the `?role=admin` access guard is a Phase 1 placeholder only

**Todo List:**
1. Build admin page layout with plugin cards (name, category pill, toggle, order controls)
2. Implement enable/disable toggle — POSTs updated config to `POST /api/admin/config`, re-fetches config
3. Implement up/down order controls — reorders array, POSTs updated config
4. Add inline text editor for announcement message content
5. Add "View Dashboard →" link
6. Add a visible callout: "Access control is a placeholder in Phase 1 — real RBAC is Phase 2"

**Relevant Context:**
- Admin role capabilities from session notes §7
- Config structure: array of `{ pluginId, enabled, order, config }` objects
- Phase 2 will replace the query-param guard with real OIDC-based RBAC

---

### Sub-Task 6 — Polish, Testing & Documentation

**Status:** `[x] done`

**Intent:**
Ensure the app is clean, tested, and ready to demo. Unit tests cover the core logic. A Playwright smoke test covers the critical user journey. All CI checks pass.

**Expected Outcomes:**
- Vitest unit tests for: `resolveOrgConfig()`, `useTaskState` hook logic, Zod schema validation (valid + invalid inputs)
- Playwright E2E smoke test: load dashboard → all 7 plugin sections visible → toggle a checklist task → stats row updates
- `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck` all pass with zero errors or warnings
- `docs/adr/ADR-001-plugin-architecture.md` filled in, recording the plugin registry pattern decision
- `README.md` updated with accurate local dev setup instructions

**Todo List:**
1. Configure Vitest in `apps/web` with `@testing-library/react` for hook tests
2. Write unit tests for `resolveOrgConfig()` — valid config, missing required field, invalid field type
3. Write unit tests for `useTaskState` — initial load, status update, localStorage persistence
4. Write Zod schema unit tests — valid input passes, invalid input throws with correct error path
5. Configure Playwright with a `dashboard.spec.ts` smoke test
6. Write Playwright test: navigate `/dashboard`, assert 7 sections render, click a task, assert stat count changes
7. Run full `lint` + `typecheck` pass; fix any issues found
8. Fill in `ADR-001-plugin-architecture.md`
9. Write `README.md` with `npm install`, `npm run dev`, `npm run test`, `npm run test:e2e` instructions

**Relevant Context:**
- Test tooling from session notes §9: Vitest (unit/integration), Playwright (E2E)
- PR checklist from README §10 — all items must pass before the plan is complete
