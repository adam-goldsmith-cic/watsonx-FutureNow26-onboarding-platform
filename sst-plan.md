# SST Integration Plan

## Overview

Add [SST v3](https://sst.dev) to this Next.js 15 project so that AWS infrastructure (DynamoDB tables, IAM user, IAM policy, and access key) is defined as code, and all required credentials and resource values are injected automatically into the Vercel deployment as environment variables — removing the need to manually manage anything in `.env.local` or the Vercel dashboard.

**Scope:**
- Install and initialise SST v3 (Ion/Pulumi-based)
- Define the two existing DynamoDB tables (`onboarding-tasks`, `onboarding-config`) as SST resources, importing the tables that already exist
- Define the IAM user (`watsonx-challenge`), the scoped IAM policy (equivalent to `watson-dyanmo`), and generate a new managed access key — all via SST, importing the existing user
- Inject all five required env vars into Vercel via SST: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `ONBOARDING_TASKS_TABLE`, `ONBOARDING_CONFIG_TABLE`
- Update the two repositories to read table names from env vars rather than hardcoded strings
- Update `.env.example` and CI notes to reflect the new setup

**Non-goals:**
- Moving the Vercel deployment itself into SST (Vercel remains managed by its own CI)
- Any Phase 2 work (RDS, Redis, OIDC)
- Changing the Docker/ICR build pipeline

---

## Sub-Tasks

---

### Sub-Task 1 — Install and initialise SST v3

**Status:** `[ ] pending`

**Intent:**
Bootstrap SST v3 in the repo root. SST v3 uses the Ion provider (Pulumi-based, no CDK), and its init command scaffolds `sst.config.ts`, updates `package.json`, and creates a `.sst/` directory that should be gitignored.

**Expected Outcomes:**
- `sst.config.ts` exists at repo root with a minimal Next.js app stub
- `sst` dev dependency is present in `package.json`
- `.sst/` and `sst-env.d.ts` are added to `.gitignore`
- `sst.config.ts` is correctly configured for the `aws` provider in `eu-west-1`

**Todo List:**
1. Run `npx sst@latest init` in the repo root — select **Next.js** as the framework and **AWS** as the provider
2. Verify `sst.config.ts` is created and references the `aws` provider
3. Add `.sst/` and `sst-env.d.ts` to `.gitignore`
4. Confirm `package.json` now has `"sst"` in `devDependencies`

**Relevant Context:**
- Repo root: `/Users/adamgoldsmith/Development/onboarding-project`
- Target AWS region: `eu-west-1`
- SST docs live at `node_modules/sst/dist/docs/` after install — consult them before writing any SST code

---

### Sub-Task 2 — Define DynamoDB tables in `sst.config.ts`

**Status:** `[ ] pending`

**Intent:**
Declare the two existing DynamoDB tables as SST `aws.dynamodb.Table` resources. Because the tables already exist in AWS, we use SST's `import` option to adopt them rather than creating new ones. This puts the tables under IaC management without destroying and recreating them.

**Expected Outcomes:**
- `sst.config.ts` contains two `aws.dynamodb.Table` constructs pointing at the real table names
- Both tables are imported (adopted) rather than freshly created
- The `userId-index` GSI on `onboarding-tasks` is described in the table definition

**Todo List:**
1. In `sst.config.ts`, inside the `run()` function, define an `aws.dynamodb.Table` for `onboarding-tasks`:
   - `hashKey: "taskId"`
   - `billingMode: "PAY_PER_REQUEST"` (match the existing table's billing mode — verify in AWS console if unsure)
   - Include the `userId-index` GSI with `hashKey: "userId"` and `projectionType: "ALL"`
   - Use `import: "onboarding-tasks"` to adopt the existing table
2. Define a second `aws.dynamodb.Table` for `onboarding-config`:
   - `hashKey: "pluginId"`
   - `billingMode: "PAY_PER_REQUEST"`
   - Use `import: "onboarding-config"` to adopt the existing table
3. Export both as named constants (`tasksTable`, `configTable`) so they can be linked in later sub-tasks

**Relevant Context:**
- Existing hardcoded table name in [`src/lib/tasks/repository.ts`](src/lib/tasks/repository.ts:11): `'onboarding-tasks'`
- Existing hardcoded table name in [`src/lib/config/repository.ts`](src/lib/config/repository.ts:5): `'onboarding-config'`
- The GSI `userId-index` is used in [`TaskRepository.getTasksForUser()`](src/lib/tasks/repository.ts:31)
- IAM policy `watson-dyanmo` confirms `eu-west-1`, exact table ARNs, and the index ARN

---

### Sub-Task 3 — Define IAM user, policy, and access key in `sst.config.ts`

**Status:** `[ ] pending`

**Intent:**
Bring the IAM user `watsonx-challenge` and its access policy under SST management. SST will import the existing IAM user, define the DynamoDB-scoped policy as code, and create a new managed access key. The old manually-created access key (`AKIATNCG7TNPP3SMDJVW`) should be deactivated and deleted from the AWS console once `sst deploy` has run successfully and the new key is confirmed working.

**Expected Outcomes:**
- `sst.config.ts` declares an `aws.iam.User` that imports the existing `watsonx-challenge` user
- `sst.config.ts` declares an `aws.iam.Policy` with the same permissions as `watson-dyanmo`, scoped to the two table ARNs (using `tasksTable.arn` and `configTable.arn` so they stay in sync)
- `sst.config.ts` declares an `aws.iam.UserPolicyAttachment` linking the policy to the user
- `sst.config.ts` declares an `aws.iam.AccessKey` for the user, whose `id` and `secret` outputs will be used in Sub-Task 4

**Todo List:**
1. In `sst.config.ts`, define `aws.iam.User` with `import: "watsonx-challenge"` to adopt the existing user
2. Define `aws.iam.Policy` with the same actions as `watson-dyanmo`:
   - `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:Query`, `dynamodb:Scan`
   - Resources: `tasksTable.arn`, `tasksTable.arn + "/index/userId-index"`, `configTable.arn`
   - Use Pulumi's `interpolate` or `$interpolate` helper to build the ARN strings dynamically from the table outputs
3. Define `aws.iam.UserPolicyAttachment` to attach the policy to the user
4. Define `aws.iam.AccessKey` for the user — store the outputs (`accessKeyId`, `secretAccessKey`) as named outputs for use in Sub-Task 4
5. Note in a comment in `sst.config.ts`: once `sst deploy` completes successfully, the old access key `AKIATNCG7TNPP3SMDJVW` must be deactivated and deleted from the AWS console

**Relevant Context:**
- Existing IAM policy JSON (from user): allows `GetItem`, `PutItem`, `UpdateItem`, `Query`, `Scan` on `onboarding-tasks`, `onboarding-tasks/index/userId-index`, and `onboarding-config`
- SST uses Pulumi under the hood — resource `import` works the same as Pulumi's `import` option on a resource

---

### Sub-Task 4 — Inject all env vars into Vercel via SST

**Status:** `[ ] pending`

**Intent:**
Use the Vercel Pulumi provider (available in SST v3) to set all five required environment variables on the linked Vercel project. When `sst deploy` runs, SST pushes these values directly into Vercel — no manual dashboard steps needed. The Vercel project is already identified in `.vercel/project.json`.

**Expected Outcomes:**
- `sst.config.ts` sets the following env vars on the Vercel project for all environments (production + preview):
  - `AWS_REGION` = `"eu-west-1"`
  - `AWS_ACCESS_KEY_ID` = access key ID output from the `aws.iam.AccessKey` resource
  - `AWS_SECRET_ACCESS_KEY` = secret output from the `aws.iam.AccessKey` resource
  - `ONBOARDING_TASKS_TABLE` = `tasksTable.name`
  - `ONBOARDING_CONFIG_TABLE` = `configTable.name`
- After `sst deploy`, the Vercel project dashboard shows all five env vars populated
- A `VERCEL_TOKEN` env var (not committed) is documented in `.env.example` as required for SST to authenticate with Vercel

**Todo List:**
1. Add the `@pulumiverse/vercel` provider to `sst.config.ts` (SST v3 supports arbitrary Pulumi providers)
2. Instantiate a `vercel.Project` data source referencing the existing project ID `prj_y9db8ymXCv9iOL8Wrw2ZxO2nxLRW`
3. Define `vercel.ProjectEnvironmentVariable` resources for all five env vars, referencing the SST resource outputs:
   - `AWS_ACCESS_KEY_ID` → `iamAccessKey.id`
   - `AWS_SECRET_ACCESS_KEY` → `iamAccessKey.secret`
   - `ONBOARDING_TASKS_TABLE` → `tasksTable.name`
   - `ONBOARDING_CONFIG_TABLE` → `configTable.name`
   - `AWS_REGION` → `"eu-west-1"` (static string)
4. Set `sensitive: true` on the credential env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
5. Document `VERCEL_TOKEN` in `.env.example` as a required local secret for running `sst deploy`

**Relevant Context:**
- `.vercel/project.json`: `projectId: "prj_y9db8ymXCv9iOL8Wrw2ZxO2nxLRW"`, `orgId: "team_F8D0KadEMPvzMRdBUXRu2es8"`
- [`next.config.ts`](next.config.ts): already handles `VERCEL=1` to disable `standalone` output on Vercel

---

### Sub-Task 5 — Update repositories to read table names from env vars

**Status:** `[ ] pending`

**Intent:**
Remove the hardcoded table name strings from the two repository files and replace them with environment variable reads. This is the application-side change that makes the SST injection actually take effect. The env var names (`ONBOARDING_TASKS_TABLE`, `ONBOARDING_CONFIG_TABLE`) match what SST injects into Vercel, and are also usable locally via `.env.local`.

**Expected Outcomes:**
- [`src/lib/tasks/repository.ts`](src/lib/tasks/repository.ts) reads `TABLE_NAME` from `process.env.ONBOARDING_TASKS_TABLE`
- [`src/lib/config/repository.ts`](src/lib/config/repository.ts) reads `TABLE_NAME` from `process.env.ONBOARDING_CONFIG_TABLE`
- Both repositories throw a clear startup error if the env var is missing (fail fast)
- The seed scripts (`scripts/seed-tasks.ts`, `scripts/seed-config.ts`) still work via `.env.local`

**Todo List:**
1. In [`src/lib/tasks/repository.ts`](src/lib/tasks/repository.ts:11), replace the `const TABLE_NAME = 'onboarding-tasks'` literal with a read from `process.env.ONBOARDING_TASKS_TABLE` — throw if undefined
2. In [`src/lib/config/repository.ts`](src/lib/config/repository.ts:5), replace `const TABLE_NAME = 'onboarding-config'` with `process.env.ONBOARDING_CONFIG_TABLE` — throw if undefined
3. Update `.env.local` to add `ONBOARDING_TASKS_TABLE=onboarding-tasks` and `ONBOARDING_CONFIG_TABLE=onboarding-config` (for local development before SST is deployed)
4. Update `.env.example` to document all five env vars and note that `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` are managed by SST after the first `sst deploy`

**Relevant Context:**
- [`src/lib/tasks/repository.ts`](src/lib/tasks/repository.ts:11): `const TABLE_NAME = 'onboarding-tasks'`
- [`src/lib/config/repository.ts`](src/lib/config/repository.ts:5): `const TABLE_NAME = 'onboarding-config'`
- [`src/lib/tasks/dynamodb-client.ts`](src/lib/tasks/dynamodb-client.ts): already reads `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` from env — no change needed here

---

### Sub-Task 6 — Verify, typecheck, and document

**Status:** `[ ] pending`

**Intent:**
Confirm the integration is coherent end-to-end: types pass, tests pass, SST can produce a deployment plan (`sst diff`) without errors, and the developer README/comments explain how to run `sst deploy` and what credentials are needed.

**Expected Outcomes:**
- `npm run typecheck` passes with no new errors
- `npm run test` passes (14 tests, no regressions)
- `npx sst diff` runs without errors (may require AWS credentials locally)
- `.env.example` and inline comments in `sst.config.ts` are clear enough for another developer to get started
- CI (`ci.yml`) does NOT need `sst deploy` added to it — deployment is a manual/separate step for now

**Todo List:**
1. Run `npm run typecheck` — fix any type errors introduced by the env var changes
2. Run `npm run test` — confirm no regressions
3. Run `npx sst diff` to validate the SST config resolves without errors
4. Add a short `## Infrastructure (SST)` section to the repo README (or inline comments in `sst.config.ts`) explaining:
   - How to deploy: `npx sst deploy --stage production`
   - What credentials are needed locally (AWS + Vercel token)
   - That `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` for the `watsonx-challenge` IAM user must be set in the Vercel dashboard manually (SST handles table name injection only)

**Relevant Context:**
- Existing scripts: `npm run typecheck`, `npm run test`
- CI file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — no changes needed
