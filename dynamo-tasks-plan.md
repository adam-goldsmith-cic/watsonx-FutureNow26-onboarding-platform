# Plan: Convert Task State from Mock Data to DynamoDB

## Overview

Replace the Phase 1 stateless mock task API with a live DynamoDB backend. The `onboarding-tasks`
table stores one item per task per user. A lightweight hexagonal architecture is used: a
`TaskRepository` class in `src/lib/tasks/` owns all DynamoDB interactions, and API routes
depend only on that class — the AWS SDK never leaks into route handlers. The BFF routes
(`GET /api/tasks`, `PATCH /api/tasks/[taskId]`) become stateful. The `useTaskState` hook
drops localStorage entirely. A CLI seed script handles first-time task population for a user.

**In scope:**
- Configure AWS CLI and provision the `onboarding-tasks` DynamoDB table with GSI
- Install and configure AWS SDK v3
- Create a shared `DynamoDBDocumentClient` module
- Create a `TaskRepository` class that encapsulates all DynamoDB operations
- Update `GET /api/tasks` to delegate to `TaskRepository`
- Update `PATCH /api/tasks/[taskId]` to delegate to `TaskRepository`
- Add a CLI seed script (`scripts/seed-tasks.ts`) to populate tasks for a user
- Simplify `useTaskState` — remove localStorage, expose `error` state
- Update `.env.example` with AWS variable names

**Out of scope:**
- Users table / RBAC (Phase 2)
- Auth / real userId derivation (still uses mock user for Phase 1)
- Config table migration (`org-config.json` stays on disk)
- Any changes to plugin schemas or admin config portal

---

## Table Schema

**Table name:** `onboarding-tasks`

| Attribute | Type | Role |
|---|---|---|
| `taskId` | String | Partition Key |
| `userId` | String | GSI Partition Key (`userId-index`) |
| `status` | String | `NOT_STARTED \| IN_PROGRESS \| DONE` |
| `dueDate` | String | ISO date `YYYY-MM-DD` |
| `completedAt` | String \| null | ISO timestamp or null |
| `notes` | String \| null | Free text or null |

**GSI:** `userId-index` — partition key `userId`, projects all attributes.

---

## Architecture

```
API Routes (src/app/api/)
       |
       | imports
       v
TaskRepository (src/lib/tasks/repository.ts)   ← only file that imports AWS SDK
       |
       | uses
       v
DynamoDB Client (src/lib/tasks/dynamodb-client.ts)
       |
       | reads
       v
Environment variables (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
```

API routes call `TaskRepository` methods by name — they never see `QueryCommand`,
`UpdateCommand`, or any DynamoDB-specific types. Swapping the backend later (e.g. to
PostgreSQL in Phase 2) means replacing `TaskRepository` only.

---

## Sub-Tasks

---

### Sub-Task 0 — Configure AWS CLI and provision the DynamoDB table

**Intent**
Before any code is written, the `onboarding-tasks` table must exist in AWS with the correct
key schema and GSI. This sub-task also ensures AWS CLI credentials are configured so the
operator can manage the table from the terminal and the app can connect at runtime.

**Expected Outcomes**
- `aws configure` is complete with a valid access key, secret, and default region
- The `onboarding-tasks` table exists in DynamoDB with `taskId` as the partition key
- The `userId-index` GSI exists on the table with `userId` as its partition key, projecting all attributes
- `aws dynamodb describe-table --table-name onboarding-tasks` returns `ACTIVE` status

**Todo List**
1. Run `aws configure` and enter:
   - `AWS Access Key ID` — from your IAM user or role credentials
   - `AWS Secret Access Key` — from your IAM user or role credentials
   - `Default region name` — the region where the table should live (e.g. `eu-west-1`, `us-east-1`)
   - `Default output format` — `json`
2. Run the following command to create the table with the GSI:
   ```bash
   aws dynamodb create-table \
     --table-name onboarding-tasks \
     --attribute-definitions \
       AttributeName=taskId,AttributeType=S \
       AttributeName=userId,AttributeType=S \
     --key-schema \
       AttributeName=taskId,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --global-secondary-indexes '[
       {
         "IndexName": "userId-index",
         "KeySchema": [{"AttributeName":"userId","KeyType":"HASH"}],
         "Projection": {"ProjectionType":"ALL"}
       }
     ]'
   ```
3. Wait for the table to become `ACTIVE`:
   ```bash
   aws dynamodb wait table-exists --table-name onboarding-tasks
   ```
4. Verify the table and GSI are correct:
   ```bash
   aws dynamodb describe-table --table-name onboarding-tasks \
     --query 'Table.{Status:TableStatus,GSIs:GlobalSecondaryIndexes[*].{Name:IndexName,Status:IndexStatus}}'
   ```
5. Note the region used — it must match `AWS_REGION` in `.env.local` when set up in Sub-Task 1

**Relevant Context**
- Table schema section above — `taskId` PK, `userId-index` GSI projecting all attributes
- `PAY_PER_REQUEST` billing avoids needing to estimate read/write capacity for Phase 1

**Status:** `[x] done`

---

### Sub-Task 1 — Install AWS SDK v3 and create the DynamoDB client module

**Intent**
Add the AWS SDK v3 packages and create a single low-level `DynamoDBDocumentClient` module.
This is an infrastructure concern kept separate from the repository so it can be replaced
without touching business logic.

**Expected Outcomes**
- `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` are in `package.json` `dependencies`
- `src/lib/tasks/dynamodb-client.ts` exports a configured `DynamoDBDocumentClient` singleton
- `.env.example` documents the three required AWS variables
- `typecheck` passes clean

**Todo List**
1. Install `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` (latest stable versions)
2. Create `src/lib/tasks/` directory
3. Create `src/lib/tasks/dynamodb-client.ts`:
   - Reads `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` from `process.env`
   - Creates a `DynamoDBClient` with those credentials
   - Wraps it in a `DynamoDBDocumentClient` (auto-marshalls JS ↔ DynamoDB types)
   - Exports the document client as the default export (singleton)
4. Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION` to `.env.example` as
   commented-out lines (matching existing file style)
5. Add the three vars (with placeholder values) to `.env.local`

**Relevant Context**
- `src/lib/config.ts` — follow the same single-export singleton pattern
- `.env.example` — existing format uses `# VAR=value` commented lines

**Status:** `[x] done`

---

### Sub-Task 2 — Create the `TaskRepository` class

**Intent**
Introduce the repository layer that owns all DynamoDB read/write logic. API routes will call
named methods on this class — they never import or use the AWS SDK directly. This is the
core of the hexagonal boundary.

**Expected Outcomes**
- `src/lib/tasks/repository.ts` exports a `TaskRepository` class with three methods:
  - `getTasksForUser(userId: string): Promise<TaskState[]>`
  - `updateTask(taskId: string, patch: TaskPatch): Promise<TaskState | null>` (null = not found)
  - `seedTasksForUser(userId: string, tasks: SeedTask[]): Promise<{ seeded: number; skipped: number }>`
- The AWS SDK (`QueryCommand`, `UpdateCommand`, `PutCommand`) is used only inside this class
- All returned data is typed against `TaskState` from `src/lib/api-types.ts`
- `typecheck` passes clean

**Todo List**
1. Create `src/lib/tasks/repository.ts` and import the document client from
   `./dynamodb-client`
2. Define a `TaskPatch` type locally: `{ status: TaskStatus; completedAt: string | null; notes: string | null }`
3. Define a `SeedTask` type locally: `{ taskId: string; dueDate: string }` (the minimum needed to build a full `TaskState` row)
4. Implement `getTasksForUser`:
   - `QueryCommand` on `userId-index` GSI with `KeyConditionExpression: 'userId = :uid'`
   - Map raw items to `TaskState[]`
   - Return `[]` if no items found
5. Implement `updateTask`:
   - `UpdateCommand` on `taskId` PK updating `status`, `completedAt`, `notes`
   - Use `ConditionExpression: 'attribute_exists(taskId)'` — catch `ConditionalCheckFailedException` and return `null`
   - Return the updated `TaskState` shape on success
6. Implement `seedTasksForUser`:
   - For each `SeedTask`, attempt `PutCommand` with `ConditionExpression: 'attribute_not_exists(taskId)'`
   - Count successes (seeded) vs `ConditionalCheckFailedException` (skipped)
   - Return `{ seeded, skipped }`
7. Export `TaskRepository` and the local types

**Relevant Context**
- `src/lib/api-types.ts` — `TaskState`, `TaskStatus` — repository must return these types
- `src/lib/tasks/dynamodb-client.ts` — created in Sub-Task 1
- `@aws-sdk/lib-dynamodb` — `QueryCommand`, `UpdateCommand`, `PutCommand` docs

**Status:** `[x] done`

---

### Sub-Task 3 — Update `GET /api/tasks` to use `TaskRepository`

**Intent**
Replace the hard-coded mock seed logic in the GET handler with a single `TaskRepository`
method call. The response shape is unchanged so `useTaskState` is unaffected at this step.

**Expected Outcomes**
- `GET /api/tasks` calls `repository.getTasksForUser(MOCK_USER_ID)` and returns the result
- Returns `[]` when no rows exist (seeding is a separate operation)
- No AWS SDK imports in the route file
- All mock seed logic and checklist config reading is removed from this route
- `typecheck` passes clean

**Todo List**
1. Import `TaskRepository` from `src/lib/tasks/repository.ts`
2. Instantiate the repository at module scope (outside the handler)
3. Replace the entire mock implementation with a call to `repository.getTasksForUser(MOCK_USER_ID)`
4. Return the result as JSON — the `TaskState[]` shape is already correct
5. Remove the now-unused imports (checklist config, date math helpers)

**Relevant Context**
- `src/app/api/tasks/route.ts` — current mock implementation
- `src/lib/api-types.ts` — `TaskState` shape that the response must match

**Status:** `[x] done`

---

### Sub-Task 4 — Update `PATCH /api/tasks/[taskId]` to use `TaskRepository`

**Intent**
Make the PATCH handler persist updates to DynamoDB via `TaskRepository` instead of echoing
the request body back. The request schema and response shape are unchanged.

**Expected Outcomes**
- `PATCH /api/tasks/[taskId]` calls `repository.updateTask(taskId, patch)` after Zod validation
- Returns 404 if `updateTask` returns `null` (task not seeded yet)
- Returns the same `{ taskId, status, completedAt, notes }` shape as Phase 1 on success
- No AWS SDK imports in the route file
- `typecheck` passes clean

**Todo List**
1. Import `TaskRepository` from `src/lib/tasks/repository.ts`
2. Instantiate the repository at module scope
3. After Zod validation, call `repository.updateTask(taskId, { status, completedAt, notes })`
4. If result is `null`, return `NextResponse.json({ error: 'Task not found' }, { status: 404 })`
5. Return the updated task fields in the existing response shape
6. Remove the Phase 1 stateless comment

**Relevant Context**
- `src/app/api/tasks/[taskId]/route.ts` — current stateless implementation
- `src/lib/api-types.ts` — `TaskStatus`

**Status:** `[x] done`

---

### Sub-Task 5 — Add CLI seed script `scripts/seed-tasks.ts`

**Intent**
Provide a standalone Node.js script an operator runs from the terminal to seed all 12 tasks
for a given user into DynamoDB. Keeping this out of the API surface avoids exposing an
unguarded mutation endpoint in Phase 1, and makes the seeding action explicit and auditable.

**Expected Outcomes**
- `scripts/seed-tasks.ts` exists and accepts a `--userId` argument
- Running `npx tsx scripts/seed-tasks.ts --userId usr-mock-001` seeds the 12 tasks and prints
  `Seeded: X, Skipped: Y` to stdout
- Does not overwrite existing rows (idempotent — safe to run multiple times)
- Uses `TaskRepository.seedTasksForUser()` — no direct DynamoDB SDK calls in the script
- `typecheck` passes clean

**Todo List**
1. Create `scripts/seed-tasks.ts`
2. Parse `--userId <value>` from `process.argv` — exit with a clear error if omitted
3. Import and call `resolveOrgConfig()` to get the checklist task list
4. Build a `SeedTask[]` from the checklist tasks — derive `dueDate` from `dueDayOffset`
   using the same date-offset calculation that currently lives in `src/app/api/tasks/route.ts`
5. Extract the `dueDate` offset helper into `src/lib/tasks/date-utils.ts` so it is shared
   between this script and any future callers
6. Instantiate `TaskRepository` and call `seedTasksForUser(userId, seedTasks)`
7. Print `Seeded: X, Skipped: Y` and exit 0 on success; print error and exit 1 on failure
8. Add a `seed-tasks` entry to `package.json` scripts:
   `"seed-tasks": "tsx scripts/seed-tasks.ts"`
9. Ensure `tsx` is available (add as a dev dependency if not already present)

**Relevant Context**
- `src/lib/config.ts` — `resolveOrgConfig()` and the checklist task list
- `src/app/api/tasks/route.ts` — current `dueDayOffset` → `dueDate` calculation to extract
- `src/lib/tasks/repository.ts` — `SeedTask` type and `seedTasksForUser` method (Sub-Task 2)

**Status:** `[x] done`

---

### Sub-Task 6 — Simplify `useTaskState` hook — remove localStorage

**Intent**
Now that the API is stateful, localStorage is redundant. Simplify the hook to treat
`GET /api/tasks` as the single source of truth and write via `PATCH /api/tasks/[taskId]`.

**Expected Outcomes**
- `useTaskState` loads state exclusively from `GET /api/tasks` on mount
- `updateTaskStatus` sends `PATCH /api/tasks/[taskId]` and updates React state from the response
- All `localStorage.getItem` / `localStorage.setItem` calls are removed
- The localStorage fallback branch is removed
- `cycleTaskStatus` behaviour is unchanged
- `useTaskState.test.ts` is updated: no localStorage mocking, fetch mocked for GET and PATCH
- `npm run test` and `npm run typecheck` both pass clean

**Todo List**
1. Remove all localStorage reads and writes from `src/hooks/useTaskState.ts`
2. Remove the BFF-unavailable localStorage fallback branch
3. Add an `error: string | null` field to the hook's returned state (if not already present)
4. On GET fetch failure, set `error` to a descriptive message and keep existing task state
5. On PATCH fetch failure, set `error` to a descriptive message and revert the optimistic
   state update (or leave state as-is if no optimistic update was made)
6. Update `updateTaskStatus`: after a successful PATCH, merge the response body into the
   React state map (response shape already matches `TaskState`); clear `error` on success
7. Update `src/test/useTaskState.test.ts`:
   - Remove `localStorage` setup and teardown
   - Mock `fetch` for both `GET /api/tasks` (initial load) and `PATCH /api/tasks/:id`
   - Add test cases for GET error and PATCH error paths — assert `error` is set
8. Run `npm run test` and `npm run typecheck` to confirm no regressions

**Relevant Context**
- `src/hooks/useTaskState.ts` — current implementation with localStorage
- `src/test/useTaskState.test.ts` — existing tests to update
- `src/lib/api-types.ts` — `TaskState`, `TaskStatus` types are unchanged

**Status:** `[x] done`

---

## Dependency Order

Sub-Task 0 (table provisioning) must be complete before any code work begins. Sub-Task 1
(SDK + client) follows. Sub-Task 2 (repository) depends on Sub-Task 1. Sub-Tasks 3, 4, and 5
all depend on Sub-Task 2. Sub-Tasks 3 and 5 can be done in parallel after Sub-Task 2.
Sub-Task 4 should follow Sub-Task 3. Sub-Task 6 should be last.

```
0 (provision table)
      |
      v
1 (SDK + client)
      |
      v
2 (TaskRepository)
      |
   +--+--+
   |     |
   v     v
3 (GET) 5 (CLI seed script)
   |
   v
4 (PATCH)
   |
   v
6 (hook simplification + error state)
```
