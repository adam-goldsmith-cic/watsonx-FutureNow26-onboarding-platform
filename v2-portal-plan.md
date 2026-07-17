# V2 Portal Plan — IBM Onboarding Portal

## Overview

Implement the features shown in the **IBM Onboarding Portal — V2 HTML prototype** (`starter_docs/IBM Onboarding Portal - V2.html`) on top of the existing Next.js 15 codebase.

The V2 prototype introduces:
- A **tabbed navigation layout** replacing the vertical plugin stack
- An **Overview tab** with KPI tiles, Bob AI notification banner, today's meetings, Slack preview, sentiment check-in, onboarding progress, and quick links
- **Calendar & Outlook tab** — rich mock meeting data with meeting detail modals and Bob prep tips
- **Slack tab** — DMs, Channels, and Mentions sub-tabs with message modals and Bob suggested reply chips
- **Org Chart tab** — clickable visual org hierarchy with person modals and Bob conversation starters
- **Communities tab** — role-personalised community recommendations with join modals
- A **persistent Bob AI bar** below the hero — styled input with suggestion chips (UI shell only, no LLM in Phase 1)
- **KPI tiles in the hero header** (Day N, % Progress, Meetings Today, Slack Unreads)
- **Sentiment / Weekly Check-in widget** (Bob Pulse) with emoji mood selector and optional notes
- **Modals** for meetings, Slack messages, org nodes, contacts, learning courses, and communities
- **Four new DynamoDB tables** (meetings, sentiment, org chart, slack messages) provisioned via SST

### Scope decisions
- **Outlook/Slack integrations**: rich mock/seed data — no real OAuth in Phase 1
- **Bob AI bar**: UI shell only — responses are mocked; real LLM wiring is Phase 2
- **Tab layout**: hybrid — top-level tabs added, existing plugin components are unchanged and render inside their assigned tab
- **DynamoDB tables**: all four new tables provisioned via SST, seeded with mock data

### Relevant files
- [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx) — server component, currently reads config and renders DashboardLayout
- [`src/components/dashboard/DashboardLayout.tsx`](src/components/dashboard/DashboardLayout.tsx) — client component, renders enabled plugins in order
- [`src/components/dashboard/HeroHeader.tsx`](src/components/dashboard/HeroHeader.tsx) — welcome hero with progress bar
- [`src/config/org-config.json`](src/config/org-config.json) — plugin config source of truth
- [`src/lib/api-types.ts`](src/lib/api-types.ts) — shared TypeScript types
- [`src/lib/tasks/repository.ts`](src/lib/tasks/repository.ts) — DynamoDB TaskRepository pattern to follow
- [`src/lib/config/repository.ts`](src/lib/config/repository.ts) — DynamoDB ConfigRepository pattern to follow
- [`sst.config.ts`](sst.config.ts) — SST infrastructure, two existing tables

---

## Sub-Tasks

---

### Sub-Task 1 — New DynamoDB Tables and Repositories

**Status:** [x] complete

**Intent**  
Provision the four new DynamoDB tables required by V2 features (meetings, sentiment check-ins, org chart nodes, Slack messages) via SST. Add a typed repository class and seed script for each. This is done first so all subsequent sub-tasks can reference real data shapes.

**Expected Outcomes**
- `sst.config.ts` declares all four new tables with correct key schemas and GSIs
- Four new repository files under `src/lib/` (one per table) following the pattern in `src/lib/tasks/repository.ts`
- Four new seed scripts under `scripts/` (one per table) with realistic mock data matching the V2 HTML content
- Four new BFF API routes: `GET /api/meetings`, `GET /api/org-chart`, `GET /api/slack-messages`, `POST /api/sentiment`
- `.env.example` updated with new table name variables
- TypeScript types for all new entities added to `src/lib/api-types.ts`

**Todo List**
1. Add types for `Meeting`, `OrgNode`, `SlackMessage`, `SentimentEntry` to `src/lib/api-types.ts`
2. Add four new tables to `sst.config.ts`:
   - `onboarding-meetings` — hash: `meetingId`, GSI: `userId-index` (query by user)
   - `onboarding-sentiment` — hash: `entryId`, GSI: `userId-index` (query by user)
   - `onboarding-org-chart` — hash: `nodeId` (shared across org, no per-user index needed)
   - `onboarding-slack-messages` — hash: `messageId`, GSI: `userId-index`
3. Update the IAM policy in `sst.config.ts` to grant access to all four new tables
4. Create repository files:
   - `src/lib/meetings/repository.ts` — `getMeetingsForUser(userId)`, `getMeetingById(meetingId)`
   - `src/lib/sentiment/repository.ts` — `createSentimentEntry(entry)`, `getLatestForUser(userId)`
   - `src/lib/org-chart/repository.ts` — `getAllNodes()`, `getNodeById(nodeId)`
   - `src/lib/slack/repository.ts` — `getMessagesForUser(userId)`, filtering by `type` (dm/channel/mention)
5. Create BFF API routes:
   - `GET /api/meetings` — returns `Meeting[]` for mock user
   - `GET /api/org-chart` — returns `OrgNode[]` (full tree)
   - `GET /api/slack-messages` — returns `SlackMessage[]` for mock user, grouped by type
   - `POST /api/sentiment` — validates with Zod, writes to DynamoDB, returns created entry
6. Create seed scripts:
   - `scripts/seed-meetings.ts` — seeds 8 meetings matching V2 HTML (Mon–Thu this week)
   - `scripts/seed-org-chart.ts` — seeds 10 org nodes matching V2 HTML hierarchy
   - `scripts/seed-slack-messages.ts` — seeds 10 messages matching V2 HTML (DMs, channels, mentions)
   - (Sentiment has no seed data — it is written by the UI)
7. Add seed commands to `package.json` scripts
8. Update `.env.example` with the four new table name variables

**Relevant Context**
- Follow the exact pattern from `src/lib/tasks/repository.ts` and `src/lib/tasks/dynamodb-client.ts`
- Use the same DynamoDB document client (import from `src/lib/tasks/dynamodb-client.ts`)
- Zod-validate all API route bodies (see existing `PATCH /api/tasks/[taskId]`)
- `Meeting` type should include: `meetingId`, `userId`, `title`, `startTime`, `duration`, `location`, `attendees`, `date`, `status` (`upcoming|done|happening-now`), `bobPrepNote`
- `OrgNode` type should include: `nodeId`, `name`, `role`, `initials`, `color`, `bio`, `parentId` (nullable), `isCurrentUser`, `level`
- `SlackMessage` type: `messageId`, `userId`, `senderName`, `channel`, `type` (`dm|channel|mention`), `timestamp`, `preview`, `fullText`, `initials`, `color`, `isUnread`
- `SentimentEntry` type: `entryId`, `userId`, `mood` (`overwhelmed|getting-there|good|excellent`), `notes` (nullable), `createdAt`

---

### Sub-Task 2 — Hero Header KPI Tiles and Bob AI Bar

**Status:** [x] complete

**Intent**  
Extend the existing `HeroHeader` component to display the four KPI tiles from the V2 design (Day N, % Progress, Meetings Today, Slack Unreads). Add the persistent "Ask Bob" bar — the input field with suggestion chips — as a new component rendered between the hero and navigation, matching the V2 HTML layout exactly.

**Expected Outcomes**
- `HeroHeader` renders four KPI tile cards in the right section of the hero, matching V2 HTML layout
- A new `BobBar` component renders below the hero, above the navigation
- `BobBar` shows the "Ask Bob" label, text input, submit button, and horizontal scrollable suggestion chips
- All interactions are UI-only (no API calls on submit in Phase 1 — submission is a no-op or shows a placeholder response)
- All new elements use theme tokens only (no hardcoded hex values)

**Todo List**
1. Read the current `HeroHeader.tsx` in full before editing
2. Add KPI tile data to the hero: compute "Day N at IBM" from `startDate`, pass `progressPercent`, `meetingsToday` count, and `slackUnreads` count as props
3. Update `HeroHeader` props interface to accept `meetingsToday: number` and `slackUnreads: number`
4. Add KPI tile layout to the right section of `HeroHeader` matching the V2 design (2x2 grid or 4-across row)
5. Create `src/components/dashboard/BobBar.tsx` — a `'use client'` component with:
   - Labelled input with placeholder text
   - "Ask Bob →" submit button
   - Scrollable suggestion chip row
   - `suggestions` prop (string array) so each tab can pass its own chips
   - On submit: show a static placeholder response bubble (no API call)
6. Update `src/app/dashboard/page.tsx` to fetch meeting count and pass to HeroHeader
7. Render `BobBar` in `DashboardLayout.tsx` between the hero area and tab navigation (or in `dashboard/page.tsx` layout)
8. Run `npm run typecheck` — confirm clean

**Relevant Context**
- `HeroHeader` already receives `userName`, `role`, `startDate`, `progressPercent` as props
- The KPI tiles in V2 are positioned in the top-right of the hero section with a dark semi-transparent background
- `BobBar` in V2 has `background: var(--b80)` and sits in its own full-width bar below the hero
- Suggestion chips in V2 are small `<button>` elements styled with `border: 1px solid rgba(255,255,255,.15)` — use equivalent theme tokens

---

### Sub-Task 3 — Tabbed Navigation Layout

**Status:** [x] complete

**Intent**  
Replace the current vertical plugin stack with a tabbed navigation system matching the V2 design. Tabs map to both new features (Overview, Calendar, Slack, Org Chart, Communities) and existing plugins (Checklist, 30/60/90, Learning, Contacts). Existing plugin components are not changed — they are simply rendered inside their tab.

**Expected Outcomes**
- A sticky tab navigation bar renders below the `BobBar`, with the same 9 tabs as the V2 design
- Clicking a tab shows its panel and hides all others (client-side state only, no URL routing needed)
- Active tab is highlighted with a yellow underline (matching V2)
- Existing plugins (checklist, plan-90, training, contacts, policy-docs, faq-links, announcements) render inside their respective tabs unchanged
- New tabs (Overview, Calendar, Slack, Org Chart, Communities) render placeholder panels — to be filled in subsequent sub-tasks
- The `DashboardLayout` is refactored to be the tab shell rather than a vertical render loop

**Todo List**
1. Read `DashboardLayout.tsx` in full before editing
2. Define a `Tab` type and a `TABS` constant with the 9 tabs: `overview | calendar | slack | org | contacts | checklist | plan | learning | communities`
3. Add `activeTab` state to `DashboardLayout` (default: `'overview'`)
4. Render a sticky tab bar (matching V2 nav styling) using theme tokens
5. Render the appropriate panel based on `activeTab`:
   - `overview` — placeholder `<div>` for now (Sub-Task 4)
   - `calendar` — placeholder (Sub-Task 5)
   - `slack` — placeholder (Sub-Task 6)
   - `org` — placeholder (Sub-Task 7)
   - `contacts` — render the existing `ContactsPlugin` component (pass its config)
   - `checklist` — render the existing `ChecklistPlugin` component
   - `plan` — render the existing `Plan90Plugin` component
   - `learning` — render the existing `TrainingPlugin` + `PolicyDocsPlugin` components
   - `communities` — placeholder (Sub-Task 9)
6. Keep the `org-config.json` plugin order/enabled system working — if a plugin is disabled, hide its tab
7. Run `npm run typecheck` — confirm clean

**Relevant Context**
- V2 nav is `.main-nav` with `.ntab` buttons and a yellow bottom border on active (`border-bottom-color: var(--yellow30)`)
- In the existing code, `DashboardLayout` uses a `plugins.map()` loop with a `switch(plugin.pluginId)` — this loop becomes the tab panel renderer
- All existing plugin components are `'use client'` and accept typed config props — no changes needed to them
- `AnnouncementsPlugin` and `FaqLinksPlugin` could be embedded in the Overview tab rather than having their own tabs (matches V2 which has them in the overview sidebar)

---

### Sub-Task 4 — Overview Tab

**Status:** [x] complete

**Intent**  
Build the Overview tab panel matching the V2 design: Bob AI notification banner, stat tiles row, today's meetings summary card, recent Slack preview card, and the sidebar (sentiment check-in, onboarding progress bars, quick links, Bob suggestion chips).

**Expected Outcomes**
- Overview tab renders with two-column layout (main + sidebar) matching V2
- Bob notification banner shows a contextual summary (static/seeded text in Phase 1)
- Stat tiles show: Tasks Complete, Tasks Remaining, People Met, Days to Milestone 1 (computed from seeded task data)
- Today's meetings card fetches from `/api/meetings` and shows today's meetings with status pills and a "Join" button for in-progress meetings
- Recent Slack messages card fetches from `/api/slack-messages` and shows the 3 most recent with unread indicators
- Sentiment check-in widget (Bob Pulse) submits to `POST /api/sentiment`
- Onboarding progress bars (Setup & Access, Compliance, Team Intros, Learning, Communities) computed from task states
- Quick links section renders the configured `faq-links` plugin items
- "Try Asking Bob" chips in the sidebar wire into the `BobBar`

**Todo List**
1. Create `src/components/dashboard/OverviewTab.tsx` as a `'use client'` component
2. Accept props: `tasks: TaskState[]`, `checklistConfig: ChecklistConfig`, `faqConfig: FaqLinksConfig`, `announcements: AnnouncementsConfig`
3. Implement Bob notification banner (static text, seeded from `announcements` plugin data)
4. Implement stat tiles row — compute values from `tasks` array
5. Implement "Today's Meetings" card:
   - Fetch from `/api/meetings` on mount (or receive as prop from server component)
   - Filter to today's date
   - Show status pills (Done, Now, In Xh, Later) based on `meeting.status` and time
   - "Full Calendar →" button switches to the `calendar` tab — accept an `onTabSwitch` callback prop
6. Implement "Recent Slack Messages" card:
   - Fetch from `/api/slack-messages` on mount
   - Show top 3 with unread dot
   - "All Messages →" switches to the `slack` tab
7. Create `src/components/dashboard/SentimentWidget.tsx`:
   - Emoji selector (4 options: Overwhelmed, Getting there, Good, Excellent)
   - Optional textarea for notes
   - Submit button calls `POST /api/sentiment`
   - Shows confirmation on success
8. Implement onboarding progress bars — map task categories to the 5 progress categories
9. Implement quick links section — render from `faqConfig.links` (reuse data, not `FaqLinksPlugin` component)
10. Wire "Try Asking Bob" chip clicks to populate the `BobBar` input (via a callback or shared state)
11. Run `npm run typecheck` — confirm clean

**Relevant Context**
- V2 layout: `class="row row-ms"` (main column + 300px sidebar)
- Meeting status logic: `done` if `meeting.date < today` or `meeting.status === 'done'`; `happening-now` if current time is within the meeting window; `in-Xh` if same day but upcoming; `later` if future date
- Progress bar categories in V2: Setup & Access, Compliance, Team Intros, Learning, Communities — map these to task `category` values from `ChecklistConfig`
- Quick links in V2 are simple list items — render from `faqConfig`, not the full `FaqLinksPlugin`

---

### Sub-Task 5 — Calendar Tab

**Status:** [x] complete

**Intent**  
Build the Calendar & Outlook tab panel matching the V2 design: a full week view grouped by day, meeting list items with time blocks, status pills, Bob callout with prep chips, and a "This Week at a Glance" sidebar. Include the meeting detail modal with Bob prep tips.

**Expected Outcomes**
- Calendar tab renders meetings from `/api/meetings` grouped by day (Mon–Sun this week)
- Each day section has a date header and a meeting list
- Each meeting card shows: time block (coloured), title, location/attendees, status pill, Join button if active
- Clicking a meeting opens a meeting detail modal
- Meeting detail modal shows time, duration, location, attendees, description, and a Bob prep tip
- "This Week at a Glance" sidebar shows per-day progress bars (meetings attended vs total)
- Bob callout at top with prep suggestion chips

**Todo List**
1. Create `src/components/dashboard/CalendarTab.tsx` as a `'use client'` component
2. Fetch meetings from `/api/meetings` on mount (or receive as prop)
3. Group meetings by date — render a `<DaySection>` for each day in the current week (Mon–Sun)
4. Render meeting rows matching V2 layout (coloured time block + body + right pills)
5. Compute and apply correct status pill for each meeting
6. Create `src/components/dashboard/MeetingModal.tsx`:
   - Shows meeting details
   - Shows Bob prep tip (from `meeting.bobPrepNote`)
   - "Join Meeting" button (href to `meeting.location` if URL, otherwise display-only)
   - Close on backdrop click or ✕ button
7. Render "This Week at a Glance" sidebar card — compute attended/total per day from `meeting.status`
8. Render Bob Meeting Prep chip card in sidebar
9. Run `npm run typecheck` — confirm clean

**Relevant Context**
- Meeting time block colour: `bg-ibm-blue` for upcoming/now, `bg-green` for done, red for urgent reminders (matches V2)
- "Happening Now" logic: compare current time against `meeting.startTime` and duration
- The Bob prep chips in V2 (`"Prep notes for today's standup"`, `"What should I know before the client briefing?"`) wire into `BobBar`

---

### Sub-Task 6 — Slack Tab

**Status:** [x] complete

**Intent**  
Build the Slack tab panel matching the V2 design: three sub-tabs (Direct Messages, Channels, Mentions & Reactions), message list items with unread indicators and avatars, a message detail modal with Bob suggested reply chips, and a "Channels to Join" recommendation sidebar.

**Expected Outcomes**
- Slack tab renders with three sub-tabs (DMs, Channels, Mentions)
- Each sub-tab shows the appropriate filtered messages from `/api/slack-messages`
- Clicking a message opens the Slack message modal
- Message modal shows full message text, Bob suggested reply chips, and a draft reply textarea
- "Channels to Join" sidebar shows Bob's recommended channels with Join buttons
- Bob tip callout at top with chip prompts

**Todo List**
1. Create `src/components/dashboard/SlackTab.tsx` as a `'use client'` component
2. Fetch messages from `/api/slack-messages` on mount
3. Implement three sub-tabs using local `activeSubTab` state — filter messages by `message.type`
4. Render message list items matching V2 layout (avatar + sender/channel + preview + unread dot + timestamp)
5. Create `src/components/dashboard/SlackModal.tsx`:
   - Shows sender avatar, name, channel, timestamp
   - Full message text
   - Bob suggested reply chips (2 static options)
   - Draft reply textarea
   - Close on backdrop click or ✕
6. Render "Channels to Join" sidebar card with 3 hardcoded recommended channels and Join buttons
7. Render Bob Slack Help chip card in sidebar
8. Run `npm run typecheck` — confirm clean

**Relevant Context**
- V2 sub-tab layout: `class="itabs"` with `class="itab"` buttons (active: blue underline)
- Unread dot: only show if `message.isUnread === true`
- Unread count badge on channel items: `class="sl-uc"` (blue pill with count)
- "Channels to Join" sidebar in V2 has 3 hardcoded entries — keep as static data (not from DB)

---

### Sub-Task 7 — Org Chart Tab

**Status:** [x] complete

**Intent**  
Build the Org Chart tab panel matching the V2 design: a visual tree hierarchy using flexbox/CSS (no external chart library), clickable nodes with colour avatars, "YOU" tag on current user, and a person detail modal with bio and Bob conversation starters.

**Expected Outcomes**
- Org Chart tab renders the hierarchy from `/api/org-chart` as a visual tree
- Nodes are grouped by hierarchy level (IBM UK leadership → Division → Dept → Team)
- Each node shows avatar initials with brand colour, name, and role
- Current user node is highlighted with a gold border and "YOU" tag
- Clicking any node opens the person modal
- Person modal shows name, role, bio, and three Bob conversation starter chips
- Bob tip callout at top

**Todo List**
1. Create `src/components/dashboard/OrgChartTab.tsx` as a `'use client'` component
2. Fetch org nodes from `/api/org-chart` on mount
3. Build tree rendering logic — group nodes by `level` field, draw connecting lines between levels using CSS borders/pseudo-elements (matching V2 approach: `vline`, `hline`, `bline`)
4. Render each node as an avatar circle + name + role label, with gold border if `node.isCurrentUser`
5. Add section labels between hierarchy levels (e.g. "IBM UK & Ireland Leadership", "Your Immediate Team")
6. Create `src/components/dashboard/OrgModal.tsx`:
   - Shows avatar, name, role
   - Bio text
   - Three Bob chips: "Tell me more about [Name]", "Draft an intro message", "What questions should I ask?"
   - Close on backdrop click or ✕
7. Run `npm run typecheck` — confirm clean

**Relevant Context**
- V2 org tree is purely CSS-based — no D3 or chart libraries. Recreate the same approach using Tailwind utilities
- V2 uses `width:1px` vertical and horizontal line divs between node levels — replicate with Tailwind border utilities
- `node.color` from the seed data maps to the avatar background; use inline `style={{ background: node.color }}` since it is a dynamic value from data (allowed per project rules)

---

### Sub-Task 8 — Contacts and Learning Modals

**Status:** [x] complete

**Intent**  
The existing `ContactsPlugin` and `TrainingPlugin` (now in their own tabs) need modals matching the V2 design — contact detail modal with email, Slack handle, "Go to for" description, and Bob reach-out chips; learning course detail modal with duration, platform, deadline, progress, description, and "Start / Continue" CTA.

**Expected Outcomes**
- Clicking a contact card in the Contacts tab opens the contact detail modal
- Contact modal shows avatar, name, role, tag, "Go to for" text, email, Slack handle, and three Bob chips
- Clicking a learning course in the Training/Learning tab opens the course detail modal
- Course modal shows duration, platform, deadline, progress %, description, and "Start / Continue on IBM w3" button
- All modals use the same modal pattern (backdrop overlay, sticky header, close button)

**Todo List**
1. Read `ContactsPlugin.tsx` and `TrainingPlugin.tsx` in full
2. Create `src/components/dashboard/ContactModal.tsx` — accepts a `contact: KeyContact` prop (plus role type for the tag), renders all V2 modal fields
3. Add `onClick` handler to contact cards in `ContactsPlugin.tsx` — opens `ContactModal` with the selected contact
4. Create `src/components/dashboard/LearningModal.tsx` — accepts a `course: TrainingCourse` prop, renders V2 fields
5. Add `onClick` handler to course items in `TrainingPlugin.tsx` — opens `LearningModal`
6. Implement a shared `useModal<T>` hook or inline state pattern (whichever is simpler) to manage selected item + open/closed state
7. Run `npm run typecheck` — confirm clean

**Relevant Context**
- `KeyContact` type is in `src/plugins/schemas/contacts.ts`
- `TrainingCourse` type is in `src/plugins/schemas/training.ts`
- Contact tag CSS classes from V2: `ct-mgr`, `ct-bud`, `ct-hr`, `ct-it`, `ct-lrn`, `ct-peer`, `ct-dir` — map these to Tailwind theme tokens
- The modal backdrop pattern to follow is in the V2 HTML: `.modal-bg` with `.open` class toggle (implement with React state, not CSS class toggling)

---

### Sub-Task 9 — Communities Tab

**Status:** [x] complete

**Intent**  
Build the Communities tab panel matching the V2 design: a list of Bob-personalised community recommendations with icons, descriptions, metadata (meeting cadence, Slack channel, member count), and a community detail modal. Includes the Bob check-in widget in the sidebar.

**Expected Outcomes**
- Communities tab renders 5 community cards matching V2 HTML content (AI & Automation, Future Now Network, Early Careers, Women in Technology, Sustainability)
- Each community card shows icon, name, "Recommended" tag (where applicable), description, and 3 metadata chips
- Clicking a community opens the community detail modal
- Community modal shows name, description, Bob recommendation note, and "Join Community" button
- Sidebar shows the sentiment check-in widget (reuses `SentimentWidget` from Sub-Task 4) and Bob Community Help chips

**Todo List**
1. Create `src/components/dashboard/CommunitiesTab.tsx` as a `'use client'` component
2. Define a `Community` type in `src/lib/api-types.ts`: `{ id, name, description, slackChannel, cadence, memberCount, isRecommended, iconEmoji }`
3. Add community data to `org-config.json` as a new plugin entry with a Zod schema (following the existing plugin pattern), OR use static seed data in the component — choose whichever is simpler; prefer the plugin pattern for consistency
4. If adding as a plugin: create `src/plugins/schemas/communities.ts`, add to `pluginSchemas` map in `src/lib/config.ts`, add entry to `org-config.json`
5. Render community list items matching V2 (icon box + body + metadata chips)
6. Create `src/components/dashboard/CommunityModal.tsx`:
   - Name, metadata sub-header
   - "About this community" description
   - Bob recommendation note (static)
   - "Join Community" button (display-only in Phase 1)
   - Close on backdrop click or ✕
7. Reuse `SentimentWidget` from Sub-Task 4 in the sidebar
8. Run `npm run typecheck` — confirm clean

**Relevant Context**
- V2 communities tab content is static in the prototype — communities are not per-user in the prototype. Using the plugin system (org-config.json) is cleaner and consistent with the existing architecture
- The `isRecommended` flag drives the "Recommended" tag (`.comm-rec-tag` in V2)
- Community icon is a unicode character (`◈` in V2) or an emoji — store as a string in the schema

---

### Sub-Task 10 — Test Coverage and Validation

**Status:** [x] complete

**Intent**  
Add Vitest unit tests for all new Zod schemas, repository functions (mocked), API routes, and key UI logic (sentiment widget state, tab switching). Run typecheck and all tests to confirm a clean baseline.

**Expected Outcomes**
- All four new Zod schemas (`Meeting`, `OrgNode`, `SlackMessage`, `SentimentEntry` input validation) have passing tests
- `communities` Zod schema (if added) has passing tests
- Sentiment API route validates input and returns correct error for bad input
- `useTaskState` hook tests still pass
- `npm run typecheck` reports zero errors
- `npm run test` reports all tests passing with no new failures

**Todo List**
1. Add schema tests for new entity types to `src/test/schemas.test.ts` (or a new `src/test/v2-schemas.test.ts`)
2. Add a `src/test/sentiment.test.ts` testing the `POST /api/sentiment` route — valid payload, invalid payload (wrong mood value), missing field
3. Confirm `npm run test` passes
4. Confirm `npm run typecheck` passes
5. Fix any type errors surfaced during the above

**Relevant Context**
- Existing tests are in `src/test/` — follow the same import/setup patterns
- `src/test/setup.ts` configures the Vitest environment
- The existing `src/test/schemas.test.ts` shows how plugin schemas are tested — follow that pattern for new schemas
