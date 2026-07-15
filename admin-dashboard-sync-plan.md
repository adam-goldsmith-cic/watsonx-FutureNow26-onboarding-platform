# Admin → Dashboard Sync Plan (DynamoDB Config)

## Overview

Move org plugin config from the static `src/config/org-config.json` file into a new DynamoDB
table (`onboarding-config`), and wire the admin portal and dashboard to read/write from it.
This mirrors the pattern already established by the `onboarding-tasks` table and `TaskRepository`.

The dashboard currently doesn't reflect admin changes because `org-config.json` is read via
`readFileSync` and Next.js 15 statically prerenders the page — the cached HTML is served even
after the file is updated. Moving to DynamoDB solves this in the right way: the dashboard
server component calls `ConfigRepository.getAllPlugins()` directly (no HTTP round trip to an
API route), and `await connection()` from `next/server` opts the page out of static
prerendering so DynamoDB is queried fresh on every request.

**Why not fetch from `/api/config` in the server component?** The Next.js docs are explicit:
server components should fetch data directly from the source, not via route handlers. A
server-side `fetch` to a route handler requires an absolute URL, adds an unnecessary HTTP
round trip, and fails at build time when no server is listening. All existing `/api/...`
calls in this project (`useTaskState`, admin portal) are from client components, where
relative-URL fetches are correct.

**What changes:**
- A new DynamoDB table `onboarding-config` stores one item per plugin.
- A new `ConfigRepository` class (mirroring `TaskRepository`) encapsulates all DynamoDB
  interactions for config.
- The existing `GET/POST /api/admin/config` routes delegate to `ConfigRepository` instead
  of reading/writing `org-config.json`.
- The dashboard page calls `ConfigRepository.getAllPlugins()` directly (server component,
  no HTTP round trip) and uses `await connection()` to opt out of static prerendering.
- `org-config.json` is retained as the **seed source** — a new CLI seed script populates
  DynamoDB from it on first setup, mirroring `scripts/seed-tasks.ts`.

**What does not change:**
- Plugin schemas, `resolveOrgConfig()`, `OrgPluginConfig` type — all unchanged.
- Admin portal UI — no visual changes needed.
- Task state (`onboarding-tasks` table, `TaskRepository`) — untouched.
- `org-config.json` is kept on disk as the seed source and for local reference.

---

## Table Schema

**Table name:** `onboarding-config`

| Attribute  | Type   | Role                                  |
|------------|--------|---------------------------------------|
| `pluginId` | String | Partition Key                         |
| `enabled`  | Bool   | Whether the plugin is shown           |
| `order`    | Number | Display order (ascending)             |
| `config`   | Map    | Plugin-specific config object (JSON)  |

No GSI needed — all reads either scan the full table (dashboard, admin GET) or target a
single item by `pluginId` (admin PATCH/PUT). The table will have at most ~10 items.

---

## Architecture

```
Dashboard page (server component)
        |
        | direct call (no HTTP round trip)
        v
ConfigRepository ──────────────────────────────────────┐
        ^                                               |
        | imports                                       |
        |                                               |
Admin portal (client component)                        |
        |                                               |
        | fetch                                         |
        v                                               |
GET /api/admin/config                                   |
POST /api/admin/config                                  |
        |                                               |
        | imports                                       |
        v                                               |
ConfigRepository (src/lib/config/repository.ts) ←──────┘
        |
        | uses
        v
DynamoDBDocumentClient (src/lib/tasks/dynamodb-client.ts)  ← shared, no new client needed
```

---

## Sub-Task 0 — Provision the `onboarding-config` DynamoDB table

**Status:** [ ] pending

### Intent
Create the `onboarding-config` table in AWS before writing any code. This follows the same
provisioning step as Sub-Task 0 in `dynamo-tasks-plan.md`.

### Expected Outcomes
- `onboarding-config` table exists with `pluginId` (String) as the partition key.
- `aws dynamodb describe-table --table-name onboarding-config` returns `ACTIVE` status.
- No GSI is required.

### Todo List
1. Run the following AWS CLI command to create the table:
   ```bash
   aws dynamodb create-table \
     --table-name onboarding-config \
     --attribute-definitions AttributeName=pluginId,AttributeType=S \
     --key-schema AttributeName=pluginId,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```
2. Wait for `ACTIVE`:
   ```bash
   aws dynamodb wait table-exists --table-name onboarding-config
   ```
3. Verify:
   ```bash
   aws dynamodb describe-table --table-name onboarding-config \
     --query 'Table.{Status:TableStatus,Keys:KeySchema}'
   ```

### Relevant Context
- AWS credentials and region are already configured from `dynamo-tasks-plan.md` Sub-Task 0.
- `PAY_PER_REQUEST` billing matches the `onboarding-tasks` table convention.

---

## Sub-Task 1 — Create `ConfigRepository`

**Status:** [ ] pending

### Intent
Add a `ConfigRepository` class in `src/lib/config/` (a new subdirectory, mirroring
`src/lib/tasks/`) that owns all DynamoDB interactions for the `onboarding-config` table.
API routes and the seed script will call named methods on this class — no raw DynamoDB SDK
calls will appear outside it.

### Expected Outcomes
- `src/lib/config/repository.ts` exports a `ConfigRepository` class with:
  - `getAllPlugins(): Promise<OrgPluginConfig[]>` — full table scan, returns all plugin entries
  - `putPlugin(entry: OrgPluginConfig): Promise<void>` — upserts a single plugin item
  - `putAllPlugins(entries: OrgPluginConfig[]): Promise<void>` — upserts all items (used by seed and bulk save)
- The existing `src/lib/tasks/dynamodb-client.ts` is reused — no new client module.
- `typecheck` passes clean.

### Todo List
1. Create `src/lib/config/` directory.
2. Create `src/lib/config/repository.ts`:
   - Import `documentClient` from `../tasks/dynamodb-client`
   - Import `ScanCommand`, `PutCommand` from `@aws-sdk/lib-dynamodb`
   - Import `OrgPluginConfig` from `@/lib/api-types`
   - Define `TABLE_NAME = 'onboarding-config'`
   - Implement `getAllPlugins`: `ScanCommand` on the table, map items to `OrgPluginConfig[]`
   - Implement `putPlugin`: `PutCommand` with the full item (overwrites existing)
   - Implement `putAllPlugins`: calls `putPlugin` for each entry via `Promise.all`
3. Export `ConfigRepository` as a named export.

### Relevant Context
- [`src/lib/tasks/repository.ts`](src/lib/tasks/repository.ts) — follow the same class
  structure, error handling, and type mapping patterns.
- [`src/lib/tasks/dynamodb-client.ts`](src/lib/tasks/dynamodb-client.ts) — shared document
  client; import from `../tasks/dynamodb-client`.
- [`src/lib/api-types.ts`](src/lib/api-types.ts) — `OrgPluginConfig` is the type to use for
  all returned items.

---

## Sub-Task 2 — Add a CLI seed script `scripts/seed-config.ts`

**Status:** [ ] pending

### Intent
Provide a one-time CLI script that reads `org-config.json` from disk, validates it with
`resolveOrgConfig()`, and upserts all plugin entries into the `onboarding-config` DynamoDB
table. This is idempotent (safe to run multiple times) and mirrors `scripts/seed-tasks.ts`.

After running this script, `org-config.json` is no longer the runtime source of truth — it
becomes a reference/fallback only.

### Expected Outcomes
- `scripts/seed-config.ts` reads `src/config/org-config.json`, validates it, and upserts all
  7 plugin entries to `onboarding-config`.
- Running the script a second time is safe (items are overwritten with the same values).
- Output: `Seeded N plugins to onboarding-config` on success.
- A `seed-config` npm script is added to `package.json`.
- `typecheck` passes clean.

### Todo List
1. Create `scripts/seed-config.ts`:
   - Read and parse `src/config/org-config.json` (same pattern as `scripts/seed-tasks.ts`)
   - Call `resolveOrgConfig()` to validate
   - Instantiate `ConfigRepository` and call `putAllPlugins(config)`
   - Print `Seeded N plugins to onboarding-config` and exit 0 on success
   - Print error and exit 1 on failure
2. Add `"seed-config": "tsx scripts/seed-config.ts"` to `package.json` scripts.

### Relevant Context
- [`scripts/seed-tasks.ts`](scripts/seed-tasks.ts) — follow the same argv parsing, error
  handling, and exit code patterns (minus the `--userId` flag, which isn't needed here).
- [`src/lib/config.ts`](src/lib/config.ts) — `resolveOrgConfig()` for validation.
- `src/lib/config/repository.ts` — created in Sub-Task 1.

---

## Sub-Task 3 — Update `GET/POST /api/admin/config` to use `ConfigRepository`

**Status:** [ ] pending

### Intent
Replace all `readFileSync`/`writeFileSync` calls against `org-config.json` in the admin API
route with `ConfigRepository` method calls. The response shapes are unchanged — no frontend
code needs to change at this step.

### Expected Outcomes
- `GET /api/admin/config` returns all plugins from DynamoDB.
- `POST /api/admin/config` upserts all plugins to DynamoDB via `putAllPlugins`.
- No `fs` imports remain in the route file.
- `typecheck` passes clean.

### Todo List
1. Update `src/app/api/admin/config/route.ts`:
   - Remove `readFileSync`, `writeFileSync`, and `fs` imports
   - Instantiate `ConfigRepository` at module scope
   - `GET`: replace file read with `repository.getAllPlugins()` + `resolveOrgConfig()`
   - `POST`: after Zod validation + `resolveOrgConfig()`, replace `writeFileSync` with
     `repository.putAllPlugins(parsed.data)`
   - Keep all existing Zod validation and error handling — only the storage layer changes

### Relevant Context
- [`src/app/api/admin/config/route.ts`](src/app/api/admin/config/route.ts) — the existing
  route to update; Zod validation and `resolveOrgConfig()` call stay unchanged.
- [`src/app/api/tasks/route.ts`](src/app/api/tasks/route.ts) — follow the same pattern of
  instantiating the repository at module scope and delegating all data access to it.
- `src/lib/config/repository.ts` — created in Sub-Task 1.

---

## Sub-Task 4 — Update the dashboard page to call `ConfigRepository` directly

**Status:** [ ] pending

### Intent
Replace the dashboard's `readFileSync` call with a direct call to
`ConfigRepository.getAllPlugins()`. Server components should fetch data from the source
directly — not via route handlers (which would require an absolute URL and an extra HTTP
round trip). Add `await connection()` from `next/server` to opt the page out of static
prerendering so DynamoDB is always queried at request time.

### Expected Outcomes
- `src/app/dashboard/page.tsx` calls `ConfigRepository.getAllPlugins()` directly.
- `await connection()` is called before the repository call to prevent static prerendering.
- Toggling/reordering plugins in admin → navigating to dashboard → changes are reflected.
- No `fs` or `path` imports remain in the dashboard page.
- `typecheck` passes clean.

### Todo List
1. In `src/app/dashboard/page.tsx`:
   - Remove `readFileSync`, `join`, and the `getConfig()` helper function.
   - Add `import { connection } from 'next/server'`.
   - Add `import { ConfigRepository } from '@/lib/config/repository'`.
   - At the top of `DashboardPage`, add `await connection()`.
   - Replace the `getConfig()` call with `new ConfigRepository().getAllPlugins()`, then
     run the result through `resolveOrgConfig()` as before.
2. Pass the result to `DashboardLayout` as before — no changes to `DashboardLayout` itself.

### Relevant Context
- [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx) — the server component to update.
- [`node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md`](node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md) line 879 —
  "Fetch data in Server Components directly from its source, not via Route Handlers."
- [`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/connection.md`](node_modules/next/dist/docs/01-app/03-api-reference/04-functions/connection.md) —
  `connection()` opts the page out of prerendering for direct data sources like DynamoDB.
- [`src/lib/config.ts`](src/lib/config.ts) — `resolveOrgConfig()` still used to validate
  and type the raw DynamoDB result.

---

## Sub-Task 5 — Update tests and verify end-to-end

**Status:** [ ] pending

### Intent
Confirm that existing tests still pass (none of them test the file-based config routes
directly), typecheck is clean, and the full admin → dashboard round-trip works in a running
dev server with DynamoDB connected.

### Expected Outcomes
- `npm run typecheck` passes clean.
- `npm run test` — all existing tests pass (they test schemas and `resolveOrgConfig()` against
  in-memory data, so they are unaffected by the storage change).
- Manual round-trip: disable a plugin in admin → visit dashboard → widget is hidden.
- Manual round-trip: reorder plugins in admin → visit dashboard → new order is reflected.

### Todo List
1. Run `npm run seed-config` to populate `onboarding-config` from `org-config.json`.
2. Run `npm run dev` and open `/dashboard` — confirm plugins load correctly from DynamoDB.
3. Open `/admin`, disable one plugin, click "View Dashboard →" — confirm widget is gone.
4. Re-enable the plugin, return to dashboard — confirm widget reappears.
5. Reorder two plugins in admin, return to dashboard — confirm new order is reflected.
6. Run `npm run typecheck` — must pass clean.
7. Run `npm run test` — all tests must pass.

---

## Dependency Order

```
0 (provision table)
       |
       v
1 (ConfigRepository)
       |
    +--+--+
    |     |
    v     v
2 (seed  3 (update API routes)
 script)       |
               v
           4 (update dashboard page)
               |
               v
           5 (verify)
```
