<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# IBM Onboarding Platform — Agent Context

## What this project is

A **Next.js 15 (App Router) onboarding platform** for IBM new starters. It is currently in **Phase 1**: frontend only, no real backend, no auth. The plan lives in [`mvp-plan.md`](mvp-plan.md). Architecture decisions are in [`docs/adr/`](docs/adr/).

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

---

## Project structure

```
src/
├── app/
│   ├── dashboard/page.tsx       # New starter dashboard (server component)
│   ├── admin/page.tsx           # Admin config portal (client component)
│   ├── page.tsx                 # Root redirect → /dashboard
│   ├── layout.tsx               # Root layout (no Geist font, system-ui)
│   ├── globals.css              # Tailwind @theme tokens — edit here for colours
│   └── api/
│       ├── config/route.ts          # GET  — resolved org plugin config
│       ├── user/route.ts            # GET  — mock user profile
│       ├── tasks/route.ts           # GET  — seeded task state
│       ├── tasks/[taskId]/route.ts  # PATCH — update task status
│       └── admin/config/route.ts    # GET/POST — read/write org-config.json
├── components/
│   ├── dashboard/
│   │   ├── HeroHeader.tsx       # Dark hero with progress bar
│   │   └── DashboardLayout.tsx  # Client layout; renders enabled plugins in order
│   └── plugins/
│       ├── AnnouncementsPlugin.tsx
│       ├── ChecklistPlugin.tsx
│       ├── TrainingPlugin.tsx
│       ├── FaqLinksPlugin.tsx
│       ├── Plan90Plugin.tsx
│       ├── ContactsPlugin.tsx
│       └── PolicyDocsPlugin.tsx
├── config/
│   └── org-config.json          # Source of truth for all plugin config
├── hooks/
│   └── useTaskState.ts          # localStorage + BFF-backed task state
├── lib/
│   ├── config.ts                # resolveOrgConfig() — reads + validates org-config.json
│   └── api-types.ts             # Shared TS types: UserProfile, TaskState, TaskStatus, etc.
├── plugins/
│   ├── types.ts                 # PluginDefinition<TConfig> interface
│   └── schemas/                 # One Zod schema file per plugin
│       ├── checklist.ts
│       ├── training.ts
│       ├── faq-links.ts
│       ├── plan-90.ts
│       ├── contacts.ts
│       ├── policy-docs.ts
│       └── announcements.ts
└── test/
    ├── setup.ts
    ├── config.test.ts
    ├── schemas.test.ts
    └── useTaskState.test.ts
docs/
└── adr/
    └── ADR-001-plugin-architecture.md
```

---

## Key conventions

### Theming — ALWAYS use theme tokens, never inline hex values
All colours are defined as CSS custom properties via `@theme` in [`src/app/globals.css`](src/app/globals.css) and are available as Tailwind utility classes:

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
| `--color-hero-bg` | `bg-hero-bg` | Dark hero background |
| `--color-hero-text` | `text-hero-text` | White text on dark hero |
| `--color-hero-muted` | `text-hero-muted` | Muted text on dark hero |
| `--color-green` / `--color-green-bg` | `text-green` / `bg-green-bg` | Success / completed |
| `--color-amber` / `--color-amber-bg` | `text-amber` / `bg-amber-bg` | Warning / in-progress |
| `--color-red` / `--color-red-bg` | `text-red` / `bg-red-bg` | Error / overdue |
| `--color-purple` / `--color-purple-bg` | `text-purple` / `bg-purple-bg` | Purple accent |
| `--color-pink` / `--color-pink-bg` | `text-pink` / `bg-pink-bg` | Pink accent |

**Never use `style={{ color: '#...' }}` for colours defined in the theme.** Only use inline `style` for dynamic values (e.g. a width percentage or a hex derived at runtime from data).

### Plugin system
Every dashboard section is a **plugin**. The contract is:
- A Zod schema in `src/plugins/schemas/<id>.ts`
- An entry in `src/config/org-config.json` with `{ pluginId, enabled, order, config }`
- A React component in `src/components/plugins/<Name>Plugin.tsx`
- A `case` in `DashboardLayout.tsx`

To add a new plugin: create the schema, add it to `src/lib/config.ts` `pluginSchemas` map, add org-config entry, create the component, add the case in DashboardLayout.

### Task state
`TaskStatus` = `'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'` (defined in `src/lib/api-types.ts`).
The `useTaskState` hook in `src/hooks/useTaskState.ts` owns all state — localStorage is the persistent source of truth in Phase 1. Clicking a checklist task cycles: NOT_STARTED → IN_PROGRESS → DONE → NOT_STARTED.

### BFF API routes (Phase 1)
All API routes are mock/static. They are designed to match the shape the real Phase 2 Express API will return — **do not change response shapes** without considering Phase 2 compatibility. The admin `POST /api/admin/config` route writes directly to `src/config/org-config.json` using `fs`.

### Component patterns
- Dashboard page (`src/app/dashboard/page.tsx`) is a **server component** — reads config from disk directly, no fetch.
- All plugin components and `DashboardLayout` are **client components** (`'use client'`).
- Plugin components receive typed config as props — no direct JSON reading inside components.
- No `any` types anywhere.

---

## Scripts

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run test         # Vitest unit tests (14 tests)
npm run test:watch   # Watch mode
npm run typecheck    # tsc --noEmit (must pass clean)
```

---

## Phase 1 constraints (do not work around these)

- **No real auth** — admin page has a visible Phase 1 warning, no OIDC
- **No database** — task state lives in localStorage; config lives in `org-config.json`
- **No external API calls** — all BFF routes return mock data
- **No monorepo** — single Next.js app at repo root

## Phase 2 (planned, not started)

Real Node.js/Express API, PostgreSQL for task state, Redis, IBM w3id OIDC auth, manager view. See `mvp-plan.md` for full roadmap.

---

## Security rules (always apply)

- Never hardcode secrets — use `.env.local` (gitignored); see `.env.example` for variable names
- No PII in logs
- Zod-validate all API route inputs before processing
- No `style` attributes that embed sensitive values
