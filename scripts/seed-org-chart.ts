#!/usr/bin/env tsx
/**
 * Seed org chart nodes into the onboarding-org-chart DynamoDB table.
 * Seeds 10 nodes matching the V2 HTML prototype hierarchy.
 *
 * Usage:
 *   npm run seed-org-chart
 */

import { OrgChartRepository } from '../src/lib/org-chart/repository';
import type { OrgNode } from '../src/lib/api-types';

// ── Org chart seed data (matches V2 HTML prototype) ──────────────────────────
// Hierarchy levels:
//   0 — IBM UK & Ireland Leadership (VP)
//   1 — Division Director
//   2 — Department Manager
//   3 — Immediate Team (including current user)

const nodes: OrgNode[] = [
  // Level 0 — IBM UK & Ireland Leadership
  {
    nodeId: 'org-001',
    name: 'Caroline Hughes',
    role: 'VP, IBM UK & Ireland',
    initials: 'CH',
    color: '#0043ce',
    bio: 'Caroline leads IBM UK & Ireland, overseeing all consulting, technology, and client engineering divisions. She has been with IBM for 22 years and is passionate about responsible AI and sustainable technology.',
    parentId: null,
    isCurrentUser: false,
    level: 0,
  },

  // Level 1 — Division Director
  {
    nodeId: 'org-002',
    name: 'Marcus Reid',
    role: 'Director, Consulting Services',
    initials: 'MR',
    color: '#6929c4',
    bio: 'Marcus leads the Consulting Services division, working with FTSE 100 clients on digital transformation, cloud strategy, and operational resilience. He joined IBM from Accenture in 2019.',
    parentId: 'org-001',
    isCurrentUser: false,
    level: 1,
  },
  {
    nodeId: 'org-003',
    name: 'Aisha Mwangi',
    role: 'Director, Technology Services',
    initials: 'AM',
    color: '#005d5d',
    bio: "Aisha oversees IBM's Technology Services teams across the UK, specialising in hybrid cloud and AI infrastructure. She is a founding member of IBM's Women in Technology UK chapter.",
    parentId: 'org-001',
    isCurrentUser: false,
    level: 1,
  },

  // Level 2 — Department Manager
  {
    nodeId: 'org-004',
    name: 'Sarah Chen',
    role: 'Senior Manager, Digital Strategy',
    initials: 'SC',
    color: '#0072c3',
    bio: 'Sarah manages the Digital Strategy team within Consulting Services, focusing on data-led transformation programmes. She is your direct manager and has been with IBM for 8 years.',
    parentId: 'org-002',
    isCurrentUser: false,
    level: 2,
  },
  {
    nodeId: 'org-005',
    name: 'David Park',
    role: 'Senior Manager, Cloud Architecture',
    initials: 'DP',
    color: '#9f1853',
    bio: 'David leads the Cloud Architecture practice, helping clients design and migrate to hybrid cloud environments. He holds IBM Cloud Professional Architect certification.',
    parentId: 'org-003',
    isCurrentUser: false,
    level: 2,
  },

  // Level 3 — Immediate Team
  {
    nodeId: 'org-006',
    name: 'James Okafor',
    role: 'Consultant, Digital Strategy',
    initials: 'JO',
    color: '#198038',
    bio: 'James is a Consultant in the Digital Strategy team specialising in enterprise architecture and process redesign. He joined IBM two years ago from a background in the public sector.',
    parentId: 'org-004',
    isCurrentUser: false,
    level: 3,
  },
  {
    nodeId: 'org-007',
    name: 'Priya Patel',
    role: 'Senior Consultant, Digital Strategy',
    initials: 'PP',
    color: '#b28600',
    bio: 'Priya is a Senior Consultant with 5 years at IBM. She leads client workshops and has deep expertise in IBM Garage methodology. She has volunteered to be your onboarding buddy.',
    parentId: 'org-004',
    isCurrentUser: false,
    level: 3,
  },
  {
    nodeId: 'org-008',
    name: 'Tom Walsh',
    role: 'Consultant, Digital Strategy',
    initials: 'TW',
    color: '#da1e28',
    bio: 'Tom joined IBM straight from university 14 months ago. He works on data analytics projects and is an active member of the Early Careers network. Great person to ask about navigating w3.',
    parentId: 'org-004',
    isCurrentUser: false,
    level: 3,
  },
  {
    nodeId: 'org-009',
    name: 'Fatima Al-Rashid',
    role: 'Consultant, Digital Strategy',
    initials: 'FA',
    color: '#7e6ef4',
    bio: 'Fatima specialises in AI ethics and governance frameworks. She joined IBM 18 months ago from a data science role in financial services and is a regular speaker at IBM Think events.',
    parentId: 'org-004',
    isCurrentUser: false,
    level: 3,
  },
  {
    nodeId: 'org-010',
    name: 'You',
    role: 'Consultant, Digital Strategy',
    initials: 'YO',
    color: '#f1c21b',
    bio: "You are a new Consultant joining the Digital Strategy team. You report to Sarah Chen and will be working alongside James, Priya, Tom, and Fatima on client engagements. Welcome to the team!",
    parentId: 'org-004',
    isCurrentUser: true,
    level: 3,
  },
];

// ── Seed ─────────────────────────────────────────────────────────────────────
const repository = new OrgChartRepository();
const args = process.argv.slice(2);
const force = args.includes('--force');

async function seed() {
  let seeded = 0;
  let skipped = 0;

  for (const node of nodes) {
    try {
      await repository.putNode(node, force);
      seeded++;
    } catch (err) {
      const isConditionalError =
        err instanceof Error && err.name === 'ConditionalCheckFailedException';
      if (isConditionalError) {
        skipped++;
      } else {
        throw err;
      }
    }
  }

  console.log(`Seeded: ${seeded}, Skipped: ${skipped}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exit(1);
  });
