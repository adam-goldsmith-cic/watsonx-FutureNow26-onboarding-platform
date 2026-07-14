# IBM Onboarding Platform — Session Notes & Design Record

> **Purpose:** Full record of the design session that produced the IBM Onboarding Platform concept — including what was built, what decisions were made, and where we're going next.
> **Date:** June 2025
> **Prepared by:** IBM Bob (AI Assistant)
> **Share with:** Project team, stakeholders, new contributors

---

## Table of Contents

1. [Session Summary](#1-session-summary)
2. [What We Started With](#2-what-we-started-with)
3. [The Dashboard — What Was Built](#3-the-dashboard--what-was-built)
4. [Platform Vision — The Big Idea](#4-platform-vision--the-big-idea)
5. [Architecture Decisions](#5-architecture-decisions)
6. [Plugin System Design](#6-plugin-system-design)
7. [User Roles & Views](#7-user-roles--views)
8. [Task State Model](#8-task-state-model)
9. [Tech Stack Decisions](#9-tech-stack-decisions)
10. [Delivery Roadmap](#10-delivery-roadmap)
11. [Key Artefacts Produced](#11-key-artefacts-produced)
12. [Next Steps](#12-next-steps)

---

## 1. Session Summary

This session started with a request to recreate an existing IBM onboarding dashboard HTML file. Through iteration on the design — adding sections, reviewing screenshots of the original — the concept evolved from a static HTML page into a full product vision: a **modular, org-customisable onboarding platform** with plugin-driven content, per-user task tracking, role-scoped views, and AI assistance via IBM Bob.

**The core insight from the session:**

> *The dashboard we were building was trying to do something no existing tool does well — give new starters a single, living view of everything they need to do, personalised to their org and role, with real progress tracking. That's not a dashboard. That's a platform.*

---

## 2. What We Started With

The starting point was a saved HTML file: `ibm-onboarding-dashboard.html`, originally built in a previous session. The file could not be read directly (outside workspace sandbox), so it was reconstructed from memory and then refined iteratively using screenshots provided during the session.

### Original Dashboard Sections (reconstructed)

The original file contained the following sections, which formed the foundation of all subsequent work:

| Section | Description |
|---|---|
| Dark hero header | IBM Future Now branding, "Week 1 of 12" pill, welcome message |
| Progress bar | 15% complete with Day 1 / Week 1 / 30-Day / 60/90-Day milestones |
| Ask Bob card | Dark card with 4 suggested prompt chips |
| First Week Checklist | 12 tasks, 4 checked, with category tags (IT, HR, SEC, MGR, TEAM) and due dates |
| Stats row | Completed / In Progress / To Do / Overdue in coloured number cards |
| Training cards | 6 cards: SEC, COC, AI, GDPR, IBM+, ROLE — each with progress bar and status pill |

---

## 3. The Dashboard — What Was Built

Through the session, three additional major sections were added (from screenshots of the original):

### 3.1 FAQ & Quick Links

A 2-column grid of 12 quick-link tiles, each with a coloured icon badge, title, description, and chevron arrow.

| Tile | Icon | Description |
|---|---|---|
| Submit My Timesheet | TS | Log hours, project codes and weekly time entries |
| Claim Expenses | EXP | Submit receipts, travel and business expenses |
| Book Annual Leave | AL | Request holiday, check your entitlement and balance |
| Raise an IT Ticket | IT | Report hardware issues, request software or access |
| View My Benefits | BEN | Health, pension, perks and employee assistance |
| View Payslip | PAY | Access your monthly payslips and pay history |
| IBM Learning Portal | LRN | Courses, certifications and your learning history |
| Flexible & Remote Working | WFH | Hybrid policy, office days and remote work guidance |
| Performance & Goals | PER | Set your objectives and track performance reviews |
| Wellbeing & Support | EAP | Mental health resources, EAP and wellbeing support |
| IBM Org Chart | ORG | Find colleagues, teams and reporting lines |
| Data Privacy Policy | PRIV | IBM's GDPR and data handling responsibilities |

### 3.2 Your 30 / 60 / 90 Day Plan

Three-column plan with colour-coded top borders (blue / purple / green):

**First 30 Days — LEARN**
- Understand your team's mission and current projects
- Complete all mandatory IBM training modules
- Meet every member of your immediate team
- Shadow key meetings and processes
- Set up all tools and system access
- Identify your first quick-win contribution

**Days 31–60 — CONTRIBUTE**
- Take ownership of a defined workstream or task
- Build relationships beyond your immediate team
- Contribute to team deliverables independently
- Complete IBM role-specific learning path (50%)
- Attend IBM Future Now all-hands or community event
- Share early learnings with your manager

**Days 61–90 — LEAD**
- Own a project or deliverable end-to-end
- Complete IBM learning path certification
- Propose one improvement to a team process
- Conduct your 90-day review with your manager
- Begin mentoring or supporting the next new starter
- Set your 6-month performance goals

### 3.3 Key Contacts & Tools to Set Up

**Key Contacts** (2×2 avatar cards):
- **LM** — Your Line Manager — Direct support & check-ins
- **OB** — Onboarding Buddy — Day-to-day questions, available any time
- **HR** — HR Business Partner — Policies, pay & benefits
- **IT** — IT Support — Hardware, access & software

**Tools to Set Up** (2×3 grid):
| Tool | Status |
|---|---|
| IBM Email / w3 | Done |
| IBM VPN | In progress |
| IBM Slack | In progress |
| GitHub Enterprise | Not started |
| Jira / Confluence | Not started |
| Zoom / Webex | Done |

### 3.4 Quick Reference — Policies & Documents

A four-column table: Resource / What it covers / View button / Ask Bob prompt.

| Resource | What it covers | Ask Bob prompt |
|---|---|---|
| IBM Code of Conduct | Ethics, values, expected behaviours | *"Summarise the Code of Conduct"* |
| Expenses Policy | What you can claim, limits, how to submit | *"How do I claim expenses?"* |
| Annual Leave Policy | Entitlement, how to book, approval process | *"How do I book annual leave?"* |
| Flexible Working Guide | Remote work, hybrid expectations, office days | *"What is the hybrid working policy?"* |
| Learning & Development | Training budget, IBM certifications, career paths | *"What training is available to me?"* |
| IT Support | Hardware issues, access requests, software installs | *"How do I raise an IT support ticket?"* |
| Benefits & Wellbeing | Health, pension, perks and employee assistance | *"What benefits am I entitled to?"* |
| Data Privacy Policy | How IBM handles data, GDPR responsibilities | *"What are my GDPR responsibilities?"* |

---

## 4. Platform Vision — The Big Idea

The key question asked during the session:

> *"Can you make it like a platform that can be customised per organisation, like a plugin style of thing? Where optimisations or tools can be added, and a view can be given per user, to show what has been done, and what needs doing, like Jira, but specifically for onboarding?"*

### What that means in practice

| Concept | What it means |
|---|---|
| **Plugin-driven** | Every section of the dashboard is an independently toggleable, configurable module |
| **Org-customisable** | Each organisation gets its own config — tasks, links, contacts, documents, branding |
| **Per-user views** | Every new starter has their own task state — checked vs unchecked, progress, blockers |
| **Role-scoped** | Managers see all their reports. HR sees org-wide analytics. IT sees provisioning queues. |
| **AI-assisted** | IBM Bob is surfaced contextually on every task, policy doc, and FAQ — not just a chatbot |
| **Like Jira** | Tasks have states (Not Started → Done → Verified), due dates, owners, evidence, and audit logs |

---

## 5. Architecture Decisions

### 5.1 Five-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│  UI Layer          Next.js 14 (App Router)       │
│  New starter · Manager · Admin · Analytics       │
├─────────────────────────────────────────────────┤
│  API Layer         Node.js + Express             │
│  User state · Task CRUD · Org config · Auth      │
├─────────────────────────────────────────────────┤
│  Plugin Engine     Plugin Registry               │
│  Enable/disable · Config per org · Custom exts   │
├─────────────────────────────────────────────────┤
│  Data Layer        PostgreSQL + Redis            │
│  Task state · Org config · Audit · Cache         │
├─────────────────────────────────────────────────┤
│  AI Layer          IBM watsonx / Bob             │
│  Contextual help · Policy Q&A · Task guidance    │
└─────────────────────────────────────────────────┘
```

### 5.2 Monorepo Structure

```
ibm-onboarding-platform/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Express API server
├── packages/
│   ├── plugins/          # Core plugin definitions
│   ├── ui/               # Shared component library
│   ├── config-schema/    # Org config JSON schema + validator
│   └── db/               # Shared DB client + migrations
├── docs/                 # Architecture docs, ADRs
└── infra/                # Dockerfile, k8s manifests, Helm chart
```

---

## 6. Plugin System Design

Every section of the dashboard is a **plugin** — a self-contained module with its own config schema, UI component, and optional API integration.

### Plugin Contract

Every plugin exports a `PluginDefinition` object:

```typescript
export interface PluginDefinition {
  id: string;                        // unique slug e.g. 'checklist'
  name: string;                      // display name
  category: PluginCategory;          // 'core' | 'hr' | 'it' | 'learning' | 'comms' | 'custom'
  configSchema: ZodSchema;           // Zod schema for org config validation
  defaultConfig: Record<string, unknown>;
  component: React.ComponentType;    // receives resolved config as props
}
```

### Built-in Plugin Registry

| Plugin ID | Name | Category | Org-configurable |
|---|---|---|---|
| `checklist` | Task Checklist | Core | Tasks, due offsets, role rules, mandatory flag |
| `training` | Training Tracker | Learning | Course list, LMS URL, due dates, pass threshold |
| `faq-links` | FAQ & Quick Links | Core | All links, icons, labels, order |
| `plan-90` | 30/60/90 Day Plan | Core | Phase names, goals per phase |
| `contacts` | Key Contacts | HR | Contact roles, directory integration toggle |
| `tools-setup` | Tools to Set Up | IT | Tool list, ticket template, auto-provision toggle |
| `policy-docs` | Policy Documents | HR | Documents, Ask Bob prompts, categories |
| `announcements` | Announcements | Comms | Content, audience (cohort/team/all), expiry |
| `buddy-match` | Buddy Matching | HR | Matching rules, contact display options |
| `slack-integration` | Slack Integration | Comms | Channel list, reminder message templates |
| `jira-integration` | Jira / ServiceNow | IT | Project key, issue types, auto-create rules |
| `custom-widget` | Custom Widget | Custom | Fully custom — org-provided React component |

### Example Org Plugin Config (JSON)

```json
{
  "pluginId": "checklist",
  "enabled": true,
  "order": 1,
  "config": {
    "title": "First Week Checklist",
    "tasks": [
      {
        "id": "setup-laptop",
        "label": "Receive and set up IBM laptop",
        "category": "IT",
        "dueDayOffset": 1,
        "mandatory": true,
        "roles": ["all"],
        "link": { "label": "Setup guide →", "url": "/docs/laptop-setup" }
      }
    ]
  }
}
```

---

## 7. User Roles & Views

Authentication via OpenID Connect (IBM w3id). Role assignment managed by HR Admins.

| Role | Who | Key capabilities |
|---|---|---|
| `new_starter` | Newly hired employees | Personal task board, progress tracker, training status, Ask Bob, FAQ, 30/60/90 plan |
| `manager` | Hiring managers, team leads | All direct reports' boards, task assignment, 30/60/90 personalisation, overdue alerts |
| `hr_admin` | HR business partners | Full org config, plugin management, document upload, cohort management, analytics, audit log |
| `it_support` | IT provisioning teams | Pending tool provisioning queue, mark tools as set up, view auto-generated tickets |
| `super_admin` | Platform team | Multi-org management, plugin marketplace, system health |

---

## 8. Task State Model

Every task assigned to a user has a persistent state record.

### Task Lifecycle

```
NOT_STARTED  →  IN_PROGRESS  →  BLOCKED  →  DONE  →  VERIFIED
                     ↑                          ↓
                     └──────────── REOPENED ────┘
```

### Key Fields

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | The new starter this record belongs to |
| `task_id` | string | Plugin-scoped ID e.g. `checklist:setup-laptop` |
| `status` | enum | Current lifecycle state |
| `due_date` | date | Calculated: `start_date + due_day_offset` |
| `completed_at` | timestamp | When marked Done |
| `verified_by` | UUID | Manager/system that verified (nullable) |
| `evidence_url` | string | Certificate upload or external proof link (nullable) |
| `notes` | text | Free-text from user or manager |

> **Overdue detection:** A background job runs nightly to flag tasks where `due_date < today` and `status != DONE`. Managers and HR admins receive a digest notification.

---

## 9. Tech Stack Decisions

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR, file-based routing, strong TypeScript support |
| API | Node.js 22 + Express 5 | Lightweight, easy to extend with plugin-defined routes |
| Database | PostgreSQL 16 | ACID-compliant, excellent JSON support for plugin config |
| Cache / Queue | Redis 7 | Session store, notification queuing, real-time pub/sub |
| Auth | OpenID Connect (IBM w3id) | SSO — no separate credential store needed |
| AI Assistant | IBM watsonx | Bob integration for contextual onboarding guidance |
| Containers | Docker + UBI9 Minimal | Red Hat registry, minimal attack surface, IBM Cloud ready |
| Orchestration | Kubernetes / OpenShift | IBM Cloud Pak / ROKS deployment target |
| CI/CD | GitHub Actions | Lint, test, build, deploy on every PR |
| Testing | Vitest + Playwright | Unit/integration + E2E browser testing |
| Observability | IBM Instana | APM, distributed tracing, alerting |

---

## 10. Delivery Roadmap

| Phase | Timeline | Focus | Status |
|---|---|---|---|
| **Phase 1** | Now — 1–2 weeks | Next.js app shell, convert HTML prototype to components, local JSON plugin config, localStorage task state, admin plugin toggle UI | 🔵 Start now |
| **Phase 2** | Weeks 3–6 | Node API, PostgreSQL schema, per-user task CRUD, org config store, JWT auth via w3id, manager view, admin config portal | 🟡 Up next |
| **Phase 3** | Weeks 7–11 | Plugin integrations (Slack, Jira, LMS), notifications engine, evidence upload, auto-verification | ⚪ Planned |
| **Phase 4** | Weeks 12–15 | Bob / watsonx AI layer with per-user context, org-wide analytics, cohort reporting, drop-off analysis | ⚪ Planned |
| **Phase 5** | Future | Multi-tenant orgs, community plugin marketplace, white-label theming, mobile app | ⚪ Future |

---

## 11. Key Artefacts Produced

The following HTML artefacts were produced during this session and can be opened in any browser or saved from IBM Bob:

| Artefact | ID | Description |
|---|---|---|
| **IBM Onboarding Dashboard** | `ibm-onboarding-dashboard` | The full interactive dashboard — all sections including hero, checklist, training, FAQ, 30/60/90 plan, contacts, tools, and policies table |
| **Platform Architecture Spec** | `ibm_onboarding_platform_spec` | Visual architecture blueprint — layer diagram, plugin registry, user roles, task state, tech stack, roadmap, and "where to start" |
| **Project README** | `ibm_onboarding_readme` | Full shareable README for the project team — overview, problem statement, architecture, plugin system, contributing guide, security requirements, team contacts |
| **This Document** | `IBM_Onboarding_Platform_Session_Notes.md` | This Markdown file — full session record for team sharing |

---

## 12. Next Steps

Immediate actions to kick off Phase 1:

- [ ] **Scaffold the Next.js monorepo** — `apps/web`, `apps/api`, `packages/plugins`, `packages/ui`
- [ ] **Define the `PluginDefinition` TypeScript interface** — this is the contract everything else follows
- [ ] **Convert the HTML dashboard to React components** — one component per plugin section
- [ ] **Implement local JSON plugin config** — so the dashboard renders from config, not hardcoded content
- [ ] **Add interactive task state** — localStorage-backed initially, then swap to API
- [ ] **Build the Admin Config UI** — toggle plugins on/off, edit text, preview live
- [ ] **Fill in Team & Contacts** section of the README with real names
- [ ] **Create ADR-001** — document the plugin architecture decision formally in `/docs/adr/`
- [ ] **Set up GitHub repo** on IBM GitHub Enterprise with branch protection on `main`
- [ ] **Book kickoff** — align team on Phase 1 scope, assign ownership per workstream

---

*Generated by IBM Bob — AI assistant for IBM Future Now.*
*This document captures design decisions made in a working session and should be reviewed by the tech lead before being treated as final.*
