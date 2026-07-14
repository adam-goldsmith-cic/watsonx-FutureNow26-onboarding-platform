# ADR-001 — Plugin Architecture

**Date:** 2025-06  
**Status:** Accepted  
**Deciders:** IBM Future Now Platform Team

---

## Context

The IBM Onboarding Platform needs to serve many different organisations, teams, and roles. Each organisation has different tasks, documents, contacts, and tools. A hardcoded dashboard would require code changes for every customisation — this does not scale.

## Decision

Every section of the dashboard is a **plugin** — a self-contained module with:
- A unique `id` (slug)
- A Zod config schema that defines what an org can configure
- A `defaultConfig` that works out of the box
- A React component that receives the resolved config as props

A single `org-config.json` file stores which plugins are enabled, their order, and their per-org config values. The `resolveOrgConfig()` utility validates this file against each plugin's Zod schema at runtime.

## Consequences

**Positive:**
- Orgs can be fully configured without code changes
- Plugins are independently testable and replaceable
- Phase 2 simply replaces the JSON file with a database-backed config API — the plugin contract does not change
- New plugins can be added without touching existing ones

**Negative:**
- Config shape changes to a plugin require a migration of `org-config.json`
- The Zod schema is the source of truth — schema and component must be kept in sync

## Alternatives Considered

- **Hardcoded sections with feature flags** — rejected; doesn't scale to multiple orgs
- **CMS-driven content** — rejected for Phase 1; adds infrastructure complexity too early
