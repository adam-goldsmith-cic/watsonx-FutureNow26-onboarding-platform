#!/usr/bin/env tsx
/**
 * Seed meetings for a user into the onboarding-meetings DynamoDB table.
 * Seeds 8 meetings spread Mon–Thu of the current week, matching V2 HTML content.
 *
 * Usage:
 *   npm run seed-meetings -- --userId usr-mock-001
 */

import { MeetingRepository } from '../src/lib/meetings/repository';
import type { Meeting, MeetingStatus } from '../src/lib/api-types';

// ── Parse --userId argument ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const userIdFlag = args.indexOf('--userId');

if (userIdFlag === -1 || !args[userIdFlag + 1]) {
  console.error('Error: --userId <value> is required');
  console.error('Usage: npm run seed-meetings -- --userId <userId>');
  process.exit(1);
}

const userId = args[userIdFlag + 1];

// ── Compute Mon–Thu dates for the current ISO week ───────────────────────────
function getWeekDay(isoWeekday: number): string {
  // isoWeekday: 1=Mon, 2=Tue, 3=Wed, 4=Thu
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun…6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + (isoWeekday - 1));
  return monday.toISOString().split('T')[0];
}

const MON = getWeekDay(1);
const TUE = getWeekDay(2);
const WED = getWeekDay(3);
const THU = getWeekDay(4);

// ── Meeting seed data (matches V2 HTML prototype) ────────────────────────────
const meetings: Meeting[] = [
  {
    meetingId: 'mtg-001',
    userId,
    title: 'Team Standup',
    startTime: '09:00',
    duration: 15,
    location: 'https://teams.microsoft.com/l/meetup-join/standup',
    attendees: ['Sarah Chen', 'James Okafor', 'Priya Patel', 'Tom Walsh'],
    date: MON,
    status: 'done' as MeetingStatus,
    bobPrepNote:
      'Quick daily sync — prepare a brief update on what you worked on yesterday, what you are doing today, and any blockers.',
  },
  {
    meetingId: 'mtg-002',
    userId,
    title: 'IBM IT Setup — New Starter Session',
    startTime: '10:30',
    duration: 60,
    location: 'Room 4B, South Bank Office',
    attendees: ['IT Support Team'],
    date: MON,
    status: 'done' as MeetingStatus,
    bobPrepNote:
      'Bring your employee ID and the setup checklist email you received from IT. They will configure your laptop, w3 access, and security token.',
  },
  {
    meetingId: 'mtg-003',
    userId,
    title: '1:1 with Manager — Sarah Chen',
    startTime: '14:00',
    duration: 45,
    location: 'https://teams.microsoft.com/l/meetup-join/1on1-sarah',
    attendees: ['Sarah Chen'],
    date: MON,
    status: 'done' as MeetingStatus,
    bobPrepNote:
      'First 1:1 — bring your questions about the team, your 30/60/90 day plan, and any blockers from your first day. A good time to align on communication preferences.',
  },
  {
    meetingId: 'mtg-004',
    userId,
    title: 'Team Standup',
    startTime: '09:00',
    duration: 15,
    location: 'https://teams.microsoft.com/l/meetup-join/standup',
    attendees: ['Sarah Chen', 'James Okafor', 'Priya Patel', 'Tom Walsh'],
    date: TUE,
    status: 'done' as MeetingStatus,
    bobPrepNote:
      'Prepare a concise update. If you joined a new Slack channel or completed a compliance module yesterday, mention it.',
  },
  {
    meetingId: 'mtg-005',
    userId,
    title: 'Client Briefing — Project Horizon',
    startTime: '11:00',
    duration: 90,
    location: 'https://teams.microsoft.com/l/meetup-join/horizon',
    attendees: ['Sarah Chen', 'James Okafor', 'Client: TechCorp UK'],
    date: TUE,
    status: 'happening-now' as MeetingStatus,
    bobPrepNote:
      'Project Horizon is a cloud migration engagement for TechCorp UK. Review the project brief shared in the #project-horizon Slack channel. Key contacts: James Okafor (technical lead), Sarah Chen (account manager).',
  },
  {
    meetingId: 'mtg-006',
    userId,
    title: 'IBM Compliance Training — Data Privacy',
    startTime: '09:30',
    duration: 60,
    location: 'w3 Learning (online)',
    attendees: ['Self-paced'],
    date: WED,
    status: 'upcoming' as MeetingStatus,
    bobPrepNote:
      'The data privacy module covers GDPR obligations, IBM data classification, and how to handle client data. Complete the quiz at the end to mark it as done.',
  },
  {
    meetingId: 'mtg-007',
    userId,
    title: 'Team Standup',
    startTime: '09:00',
    duration: 15,
    location: 'https://teams.microsoft.com/l/meetup-join/standup',
    attendees: ['Sarah Chen', 'James Okafor', 'Priya Patel', 'Tom Walsh'],
    date: WED,
    status: 'upcoming' as MeetingStatus,
    bobPrepNote:
      'Prepare a brief update. Mention the compliance training you completed or are planning to complete today.',
  },
  {
    meetingId: 'mtg-008',
    userId,
    title: 'Buddy Coffee Chat — Priya Patel',
    startTime: '13:00',
    duration: 30,
    location: 'Coffee area, Floor 3',
    attendees: ['Priya Patel'],
    date: THU,
    status: 'upcoming' as MeetingStatus,
    bobPrepNote:
      'Priya is a Senior Consultant who joined IBM 18 months ago. Good questions to ask: how she navigated the first 90 days, which internal communities she recommends, and tips for working with clients.',
  },
];

// ── Seed ─────────────────────────────────────────────────────────────────────
const repository = new MeetingRepository();
const force = args.includes('--force');

async function seed() {
  let seeded = 0;
  let skipped = 0;

  for (const meeting of meetings) {
    try {
      await repository.putMeeting(meeting, force);
      seeded++;
    } catch (err) {
      // ConditionalCheckFailedException means the record already exists — skip
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
