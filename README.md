# IBM Onboarding Platform

A modular, org-customisable onboarding platform. Plugin-driven task tracking with per-user progress views, an admin configuration layer, and AI-assisted guidance — purpose-built for day-one to 90-day new starter journeys.

**Current phase:** Phase 1 — Frontend MVP (Next.js, local JSON config, localStorage task state)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/dashboard`.

---

## URLs

| URL | Description |
|---|---|
| `/dashboard` | New starter onboarding dashboard |
| `/admin` | Admin config portal (toggle plugins, reorder, edit announcements) |
| `/api/config` | GET — resolved org plugin config |
| `/api/user` | GET — mock user profile |
| `/api/tasks` | GET — seeded task state |
| `/api/tasks/:id` | PATCH — update task status |
| `/api/admin/config` | GET/POST — read and write org config |

---

## Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Watch mode
npm run typecheck    # TypeScript strict check
```

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/page.tsx       # New starter dashboard (server component)
│   ├── admin/page.tsx           # Admin config portal (client component)
│   └── api/                     # BFF API routes (mock data layer)
├── components/
│   ├── dashboard/               # HeroHeader, DashboardLayout
│   └── plugins/                 # One component per plugin
├── config/
│   └── org-config.json          # Org plugin config (source of truth)
├── hooks/
│   └── useTaskState.ts          # localStorage + BFF-backed task state
├── lib/
│   ├── config.ts                # resolveOrgConfig()
│   └── api-types.ts             # Shared TypeScript types
├── plugins/
│   ├── types.ts                 # PluginDefinition interface
│   └── schemas/                 # Zod schema per plugin
└── test/                        # Unit tests
docs/
└── adr/
    └── ADR-001-plugin-architecture.md
```

---

## Plugin System

Every dashboard section is a **plugin** — a self-contained module with a Zod config schema, default config, and React component. All content is driven by `src/config/org-config.json`.

| Plugin ID | Name | Category |
|---|---|---|
| `announcements` | Announcements | Comms |
| `checklist` | Task Checklist | Core |
| `training` | Training Tracker | Learning |
| `faq-links` | FAQ & Quick Links | Core |
| `plan-90` | 30/60/90 Day Plan | Core |
| `contacts` | Key Contacts & Tools | HR |
| `policy-docs` | Policy Documents | HR |

---

## Architecture

```
Phase 1 (current)                Phase 2 (planned)
─────────────────────────────    ─────────────────────────────
Next.js 15 (App Router)          + Node.js / Express API
  ├── /dashboard (SSR)           + PostgreSQL (task state)
  ├── /admin (client)            + Redis (session cache)
  └── /api/* (BFF mock)          + IBM w3id (OIDC auth)
localStorage (task state)        + Real per-user DB state
org-config.json (config)         + DB-backed org config
```

---

## Security

- No secrets committed — see `.env.example` for Phase 2 variables
- `.env.local` is gitignored
- All API route inputs validated with Zod before processing
- Admin portal has **no access control in Phase 1** — documented clearly in the UI
- See `docs/adr/ADR-001-plugin-architecture.md` for architecture decisions

---

*IBM Onboarding Platform · Phase 1 · Made with IBM Bob*
