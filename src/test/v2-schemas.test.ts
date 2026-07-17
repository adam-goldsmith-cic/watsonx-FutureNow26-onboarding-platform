import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { communitiesConfigSchema, communitySchema } from '@/plugins/schemas/communities';
import { keyContactSchema, contactsConfigSchema } from '@/plugins/schemas/contacts';
import { trainingCourseSchema, trainingConfigSchema } from '@/plugins/schemas/training';

// ── communitySchema / communitiesConfigSchema ─────────────────────────────────

describe('communitySchema', () => {
  const validCommunity = {
    id: 'c1',
    name: 'AI & Automation Guild',
    description: 'A community for AI enthusiasts.',
    slackChannel: '#ai-automation',
    cadence: 'Monthly',
    memberCount: '120 members',
    isRecommended: true,
    iconEmoji: '🤖',
    bobNote: 'Highly relevant to your role.',
  };

  it('parses a valid community', () => {
    const result = communitySchema.safeParse(validCommunity);
    expect(result.success).toBe(true);
  });

  it('parses a community where isRecommended is false', () => {
    const result = communitySchema.safeParse({ ...validCommunity, isRecommended: false });
    expect(result.success).toBe(true);
  });

  it('rejects a community missing the name field', () => {
    const { name: _name, ...noName } = validCommunity;
    const result = communitySchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it('rejects a community missing the slackChannel field', () => {
    const { slackChannel: _sc, ...noChannel } = validCommunity;
    const result = communitySchema.safeParse(noChannel);
    expect(result.success).toBe(false);
  });

  it('rejects a community with a non-boolean isRecommended', () => {
    const result = communitySchema.safeParse({ ...validCommunity, isRecommended: 'yes' });
    expect(result.success).toBe(false);
  });
});

describe('communitiesConfigSchema', () => {
  const validCommunity = {
    id: 'c1',
    name: 'Future Now Network',
    description: 'Digital transformation community.',
    slackChannel: '#future-now',
    cadence: 'Bi-weekly',
    memberCount: '85 members',
    isRecommended: false,
    iconEmoji: '◈',
    bobNote: 'Good for networking.',
  };

  it('parses a valid config with communities array', () => {
    const result = communitiesConfigSchema.safeParse({ communities: [validCommunity] });
    expect(result.success).toBe(true);
  });

  it('applies default title when omitted', () => {
    const result = communitiesConfigSchema.safeParse({ communities: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Recommended for You');
    }
  });

  it('accepts an explicit title', () => {
    const result = communitiesConfigSchema.safeParse({ title: 'My Communities', communities: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Communities');
    }
  });

  it('accepts an empty communities array', () => {
    const result = communitiesConfigSchema.safeParse({ communities: [] });
    expect(result.success).toBe(true);
  });

  it('rejects config without the communities field', () => {
    const result = communitiesConfigSchema.safeParse({ title: 'Communities' });
    expect(result.success).toBe(false);
  });

  it('rejects config with an invalid community entry', () => {
    const result = communitiesConfigSchema.safeParse({
      communities: [{ id: 'bad', name: 'Missing fields' }],
    });
    expect(result.success).toBe(false);
  });
});

// ── keyContactSchema (V2 optional fields) ─────────────────────────────────────

describe('keyContactSchema — V2 optional fields', () => {
  const minimalContact = {
    initials: 'AJ',
    name: 'Alice Johnson',
    role: 'HR Manager',
    description: 'First point of contact for all HR queries.',
  };

  it('parses a contact without optional fields', () => {
    const result = keyContactSchema.safeParse(minimalContact);
    expect(result.success).toBe(true);
  });

  it('parses a contact with email and slackHandle', () => {
    const result = keyContactSchema.safeParse({
      ...minimalContact,
      email: 'alice@ibm.com',
      slackHandle: '@alice.johnson',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('alice@ibm.com');
      expect(result.data.slackHandle).toBe('@alice.johnson');
    }
  });

  it('parses a contact with only email (no slackHandle)', () => {
    const result = keyContactSchema.safeParse({ ...minimalContact, email: 'alice@ibm.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slackHandle).toBeUndefined();
    }
  });

  it('parses a contact with only slackHandle (no email)', () => {
    const result = keyContactSchema.safeParse({ ...minimalContact, slackHandle: '@alice' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
    }
  });

  it('still rejects initials longer than 2 characters', () => {
    const result = keyContactSchema.safeParse({ ...minimalContact, initials: 'ABC' });
    expect(result.success).toBe(false);
  });
});

// ── trainingCourseSchema (V2 optional fields) ─────────────────────────────────

describe('trainingCourseSchema — V2 optional fields', () => {
  const minimalCourse = {
    id: 'c1',
    title: 'Security Fundamentals',
    category: 'SEC',
    progress: 0,
    status: 'not-started' as const,
  };

  it('parses a course without optional V2 fields', () => {
    const result = trainingCourseSchema.safeParse(minimalCourse);
    expect(result.success).toBe(true);
  });

  it('parses a course with duration, platform, and description', () => {
    const result = trainingCourseSchema.safeParse({
      ...minimalCourse,
      duration: '2h 30m',
      platform: 'IBM w3',
      description: 'An introduction to IBM security policies.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe('2h 30m');
      expect(result.data.platform).toBe('IBM w3');
      expect(result.data.description).toBe('An introduction to IBM security policies.');
    }
  });

  it('parses a course with only platform (other V2 fields absent)', () => {
    const result = trainingCourseSchema.safeParse({ ...minimalCourse, platform: 'Coursera' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBeUndefined();
      expect(result.data.description).toBeUndefined();
    }
  });

  it('still rejects progress > 100', () => {
    const result = trainingCourseSchema.safeParse({ ...minimalCourse, progress: 101 });
    expect(result.success).toBe(false);
  });

  it('still rejects an invalid status', () => {
    const result = trainingCourseSchema.safeParse({ ...minimalCourse, status: 'pending' });
    expect(result.success).toBe(false);
  });
});

// ── V2 entity contract schemas (inline Zod) ───────────────────────────────────
// These inline schemas mirror the TypeScript interfaces in src/lib/api-types.ts
// and act as contract tests to catch shape regressions.

const meetingStatusSchema = z.enum(['upcoming', 'done', 'happening-now']);

const meetingSchema = z.object({
  meetingId: z.string(),
  userId: z.string(),
  title: z.string(),
  startTime: z.string(),
  duration: z.number(),
  location: z.string(),
  attendees: z.array(z.string()),
  date: z.string(),
  status: meetingStatusSchema,
  bobPrepNote: z.string(),
});

const orgNodeSchema = z.object({
  nodeId: z.string(),
  name: z.string(),
  role: z.string(),
  initials: z.string(),
  color: z.string(),
  bio: z.string(),
  parentId: z.string().nullable(),
  isCurrentUser: z.boolean(),
  level: z.number().int().min(0),
});

const slackMessageTypeSchema = z.enum(['dm', 'channel', 'mention']);

const slackMessageSchema = z.object({
  messageId: z.string(),
  userId: z.string(),
  senderName: z.string(),
  channel: z.string(),
  type: slackMessageTypeSchema,
  timestamp: z.string(),
  preview: z.string(),
  fullText: z.string(),
  initials: z.string(),
  color: z.string(),
  isUnread: z.boolean(),
});

const sentimentMoodSchema = z.enum(['overwhelmed', 'getting-there', 'good', 'excellent']);

const sentimentEntrySchema = z.object({
  entryId: z.string(),
  userId: z.string(),
  mood: sentimentMoodSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
});

// ── Meeting ───────────────────────────────────────────────────────────────────

describe('Meeting contract schema', () => {
  const validMeeting = {
    meetingId: 'm1',
    userId: 'usr-mock-001',
    title: 'Team Standup',
    startTime: '09:00',
    duration: 30,
    location: 'https://zoom.us/j/123',
    attendees: ['Alice', 'Bob'],
    date: '2026-07-21',
    status: 'upcoming' as const,
    bobPrepNote: 'Review your last three PRs before joining.',
  };

  it('parses a valid meeting', () => {
    expect(meetingSchema.safeParse(validMeeting).success).toBe(true);
  });

  it('accepts all valid status values', () => {
    for (const status of ['upcoming', 'done', 'happening-now'] as const) {
      expect(meetingSchema.safeParse({ ...validMeeting, status }).success).toBe(true);
    }
  });

  it('rejects an invalid status value', () => {
    expect(meetingSchema.safeParse({ ...validMeeting, status: 'cancelled' }).success).toBe(false);
  });

  it('rejects when attendees is not an array', () => {
    expect(meetingSchema.safeParse({ ...validMeeting, attendees: 'Alice, Bob' }).success).toBe(false);
  });

  it('rejects when duration is a string', () => {
    expect(meetingSchema.safeParse({ ...validMeeting, duration: '30' }).success).toBe(false);
  });

  it('rejects when a required field is missing', () => {
    const { bobPrepNote: _b, ...noNote } = validMeeting;
    expect(meetingSchema.safeParse(noNote).success).toBe(false);
  });
});

// ── OrgNode ───────────────────────────────────────────────────────────────────

describe('OrgNode contract schema', () => {
  const validNode = {
    nodeId: 'n1',
    name: 'Jane Smith',
    role: 'CTO',
    initials: 'JS',
    color: '#1d4ed8',
    bio: 'Jane leads the IBM UK technology division.',
    parentId: null,
    isCurrentUser: false,
    level: 0,
  };

  it('parses a valid root node (parentId null)', () => {
    expect(orgNodeSchema.safeParse(validNode).success).toBe(true);
  });

  it('parses a node with a non-null parentId', () => {
    expect(orgNodeSchema.safeParse({ ...validNode, nodeId: 'n2', parentId: 'n1', level: 1 }).success).toBe(true);
  });

  it('parses the current user node', () => {
    expect(orgNodeSchema.safeParse({ ...validNode, isCurrentUser: true }).success).toBe(true);
  });

  it('rejects a negative level', () => {
    expect(orgNodeSchema.safeParse({ ...validNode, level: -1 }).success).toBe(false);
  });

  it('rejects a non-boolean isCurrentUser', () => {
    expect(orgNodeSchema.safeParse({ ...validNode, isCurrentUser: 'yes' }).success).toBe(false);
  });

  it('rejects when parentId is undefined (must be string or null)', () => {
    const { parentId: _p, ...noParent } = validNode;
    expect(orgNodeSchema.safeParse(noParent).success).toBe(false);
  });
});

// ── SlackMessage ──────────────────────────────────────────────────────────────

describe('SlackMessage contract schema', () => {
  const validMessage = {
    messageId: 'msg-1',
    userId: 'usr-mock-001',
    senderName: 'Alice Johnson',
    channel: 'general',
    type: 'dm' as const,
    timestamp: '2026-07-21T09:00:00.000Z',
    preview: 'Welcome to the team!',
    fullText: 'Welcome to the team! Looking forward to working with you.',
    initials: 'AJ',
    color: '#1d4ed8',
    isUnread: true,
  };

  it('parses a valid DM message', () => {
    expect(slackMessageSchema.safeParse(validMessage).success).toBe(true);
  });

  it('accepts all valid type values', () => {
    for (const type of ['dm', 'channel', 'mention'] as const) {
      expect(slackMessageSchema.safeParse({ ...validMessage, type }).success).toBe(true);
    }
  });

  it('rejects an invalid type value', () => {
    expect(slackMessageSchema.safeParse({ ...validMessage, type: 'reaction' }).success).toBe(false);
  });

  it('rejects a non-boolean isUnread', () => {
    expect(slackMessageSchema.safeParse({ ...validMessage, isUnread: 1 }).success).toBe(false);
  });

  it('rejects when a required field is missing', () => {
    const { fullText: _f, ...noFullText } = validMessage;
    expect(slackMessageSchema.safeParse(noFullText).success).toBe(false);
  });
});

// ── SentimentEntry ────────────────────────────────────────────────────────────

describe('SentimentEntry contract schema', () => {
  const validEntry = {
    entryId: 'ent-1',
    userId: 'usr-mock-001',
    mood: 'good' as const,
    notes: null,
    createdAt: '2026-07-21T10:00:00.000Z',
  };

  it('parses a valid entry with null notes', () => {
    expect(sentimentEntrySchema.safeParse(validEntry).success).toBe(true);
  });

  it('parses a valid entry with string notes', () => {
    expect(sentimentEntrySchema.safeParse({ ...validEntry, notes: 'Feeling settled in.' }).success).toBe(true);
  });

  it('accepts all valid mood values', () => {
    for (const mood of ['overwhelmed', 'getting-there', 'good', 'excellent'] as const) {
      expect(sentimentEntrySchema.safeParse({ ...validEntry, mood }).success).toBe(true);
    }
  });

  it('rejects an invalid mood value', () => {
    expect(sentimentEntrySchema.safeParse({ ...validEntry, mood: 'happy' }).success).toBe(false);
  });

  it('rejects undefined notes (must be string or null)', () => {
    const { notes: _n, ...noNotes } = validEntry;
    expect(sentimentEntrySchema.safeParse(noNotes).success).toBe(false);
  });

  it('rejects when a required field is missing', () => {
    const { entryId: _e, ...noId } = validEntry;
    expect(sentimentEntrySchema.safeParse(noId).success).toBe(false);
  });
});
