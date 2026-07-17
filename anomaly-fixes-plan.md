# Anomaly Fixes Plan

## Overview

Five anomalies were identified in a codebase audit. None are runtime bugs, but they represent
documentation drift, theme inconsistencies, and schema ambiguity that will cause friction as
the project grows. This plan fixes all five in isolated, reviewable sub-tasks ordered from
simplest to most code-touching.

---

## Sub-Task 1 — Sync `mvp-plan.md` TaskStatus with implementation

**Status:** `[ ] pending`

**Intent:**
`mvp-plan.md:149` specifies `TaskStatus` as `NOT_STARTED | IN_PROGRESS | BLOCKED | DONE | VERIFIED`.
The implemented type (`src/lib/api-types.ts:1`) only has three values, which is correct for Phase 1.
The plan doc needs to reflect the decision that was actually made so future readers aren't confused.

**Expected Outcomes:**
- `mvp-plan.md` line 149 accurately describes the implemented `TaskStatus` enum.
- A note is added explaining that BLOCKED and VERIFIED are deferred to Phase 2.

**Todo List:**
1. In `mvp-plan.md`, update the `TaskStatus` bullet (line 149) from
   `NOT_STARTED | IN_PROGRESS | BLOCKED | DONE | VERIFIED`
   to `NOT_STARTED | IN_PROGRESS | DONE` with a parenthetical noting
   `BLOCKED` and `VERIFIED` are Phase 2 additions.

**Relevant Context:**
- `mvp-plan.md:149`
- `src/lib/api-types.ts:1`
- `src/hooks/useTaskState.ts:63-68` — cycleTaskStatus only cycles three states

---

## Sub-Task 2 — Fix `globals.css` body block to use theme tokens

**Status:** `[ ] pending`

**Intent:**
The `body {}` block in `globals.css` hard-codes `#f7f8fa` and `#1f2328` as raw hex values, duplicating
the `--color-page-bg` and `--color-fg` tokens that are already defined in the `@theme` block directly
above. This means the theme has two sources of truth for these values — if a token is ever updated,
the body block will silently drift.

**Expected Outcomes:**
- `globals.css` `body {}` uses `var(--color-page-bg)` and `var(--color-fg)` instead of raw hex.
- The `@theme` block remains the single source of truth for all colour values.

**Todo List:**
1. In `src/app/globals.css`, change `body { background-color: #f7f8fa; color: #1f2328; ... }`
   to reference the CSS custom properties: `background-color: var(--color-page-bg); color: var(--color-fg);`

**Relevant Context:**
- `src/app/globals.css:41-45`

---

## Sub-Task 3 — Add `#a6c8ff` as a theme token and use it in components

**Status:** `[ ] pending`

**Intent:**
The colour `#a6c8ff` (IBM Carbon Blue 30 — a light blue used on dark backgrounds) is hardcoded
inline in two separate components for the "BOB PULSE" label. It is not defined as a theme token,
violating the project convention. Centralising it as a token means it can be changed in one place
and clearly communicates its purpose to future developers.

**Expected Outcomes:**
- A new `--color-ibm-blue-light` token (`#a6c8ff`) is added to the `@theme` block in `globals.css`.
- Both hardcoded `style={{ color: '#a6c8ff' }}` usages are replaced with the Tailwind utility class.
- No visual change at runtime.

**Todo List:**
1. Add `--color-ibm-blue-light: #a6c8ff;` to the IBM brand section of `src/app/globals.css`.
2. In `src/components/dashboard/OverviewTab.tsx:413`, replace
   `style={{ color: '#a6c8ff' }}` with `className="text-ibm-blue-light"` (drop the style prop entirely).
3. In `src/components/dashboard/CommunitiesTab.tsx:118`, do the same replacement.

**Relevant Context:**
- `src/app/globals.css` — `@theme inline` block
- `src/components/dashboard/OverviewTab.tsx:413`
- `src/components/dashboard/CommunitiesTab.tsx:118`
- No tests required for a pure styling token change (no logic altered)

---

## Sub-Task 4 — Document missing theme tokens in `AGENTS.md`

**Status:** `[ ] pending`

**Intent:**
Four theme tokens defined in `globals.css` are absent from the AGENTS.md token reference table.
Developers who only consult AGENTS.md will not know these tokens exist and may introduce new
hardcoded values for the same colours. This is a documentation gap, not a code bug.

The four missing tokens are:
- `--color-ibm-nav-bd` / `border-ibm-nav-bd` (tab nav border)
- `--color-ibm-blue-light` / `text-ibm-blue-light` (added in Sub-Task 3)
- `--color-hero-surface` / `bg-hero-surface` (dark surface within hero)
- `--color-hero-track` / `bg-hero-track` (progress bar track in hero)
- `--color-surface` / `bg-surface` (light page surface — same value as page-bg, distinct semantic)

**Expected Outcomes:**
- The AGENTS.md theme token table contains an entry for every token defined in `globals.css`.
- Any developer reading AGENTS.md has a complete reference and no reason to reach for raw hex.

**Todo List:**
1. In `AGENTS.md`, locate the theme token table (around line 210).
2. Add a row for each of the five tokens listed above, following the existing table format.

**Relevant Context:**
- `AGENTS.md` — theme token table
- `src/app/globals.css` — `@theme inline` block (all tokens defined here)
- No code changes — documentation only

---

## Sub-Task 5 — Document the intent behind optional schema fields

**Status:** `[ ] pending`

**Intent:**
`duration`, `platform`, and `description` on `trainingCourseSchema` and `email` / `slackHandle`
on `keyContactSchema` are all `.optional()` even though every entry in `org-config.json` supplies
them. This is not a bug — the fields are optional by design so that Phase 2 data sources (which
may not always include them) remain compatible. But the intent is nowhere documented, which creates
ambiguity.

Rather than making the fields required (which would break Phase 2 flexibility) or removing them
(not an option), the fix is to add a short comment to each schema file explaining the decision.

**Expected Outcomes:**
- Each schema file has a one-line comment above the optional fields explaining they are
  intentionally optional for Phase 2 compatibility.
- No schema changes — existing tests continue to pass without modification.

**Todo List:**
1. In `src/plugins/schemas/training.ts`, add a comment above `dueDate`, `duration`, `platform`,
   `description` noting: `// Optional — org-config always supplies these; Phase 2 sources may not`.
2. In `src/plugins/schemas/contacts.ts`, add a comment above `email` and `slackHandle` noting the
   same intent.

**Relevant Context:**
- `src/plugins/schemas/training.ts:11-14`
- `src/plugins/schemas/contacts.ts:10-11`
- `src/test/v2-schemas.test.ts:130-144` — existing tests explicitly cover the "absent" cases, confirming optional is intentional
- No test changes needed

---

## Validation

After all sub-tasks are complete:
- Run `npm run test` — all 189 tests should still pass (no logic changed)
- Run `npm run typecheck` — zero errors
- Run `npm run build` — confirm `border-ibm-nav-bd` and `text-ibm-blue-light` compile correctly
