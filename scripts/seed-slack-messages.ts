#!/usr/bin/env tsx
/**
 * Seed Slack messages for a user into the onboarding-slack-messages DynamoDB table.
 * Seeds 10 messages (DMs, channels, mentions) matching V2 HTML prototype content.
 *
 * Usage:
 *   npm run seed-slack-messages -- --userId usr-mock-001
 */

import { SlackRepository } from '../src/lib/slack/repository';
import type { SlackMessage } from '../src/lib/api-types';

// ── Parse --userId argument ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const userIdFlag = args.indexOf('--userId');

if (userIdFlag === -1 || !args[userIdFlag + 1]) {
  console.error('Error: --userId <value> is required');
  console.error('Usage: npm run seed-slack-messages -- --userId <userId>');
  process.exit(1);
}

const userId = args[userIdFlag + 1];

// ── Helper: produce ISO timestamps relative to now ───────────────────────────
function hoursAgo(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

function daysAgo(d: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
}

// ── Slack message seed data (matches V2 HTML prototype) ──────────────────────
const messages: SlackMessage[] = [
  // Direct Messages
  {
    messageId: 'slack-dm-001',
    userId,
    senderName: 'Priya Patel',
    channel: 'Direct Message',
    type: 'dm',
    timestamp: hoursAgo(1),
    preview: 'Hey! How are you settling in? Let me know if you need anything 😊',
    fullText:
      'Hey! How are you settling in? Let me know if you need anything 😊 I put together a quick list of useful Slack channels and w3 resources for new starters — happy to walk you through them when you have a moment.',
    initials: 'PP',
    color: '#b28600',
    isUnread: true,
  },
  {
    messageId: 'slack-dm-002',
    userId,
    senderName: 'Sarah Chen',
    channel: 'Direct Message',
    type: 'dm',
    timestamp: hoursAgo(3),
    preview: 'Welcome to the team! Your first 1:1 is locked in for 2pm Monday.',
    fullText:
      'Welcome to the team! Your first 1:1 is locked in for 2pm Monday. I have added a shared doc with our team norms and some background reading on the projects we are currently running. See you then!',
    initials: 'SC',
    color: '#0072c3',
    isUnread: true,
  },
  {
    messageId: 'slack-dm-003',
    userId,
    senderName: 'Tom Walsh',
    channel: 'Direct Message',
    type: 'dm',
    timestamp: daysAgo(1),
    preview: 'Grab me for coffee any time this week — always good to chat w3 tips!',
    fullText:
      'Grab me for coffee any time this week — always good to chat w3 tips! I remember what it was like in the first few weeks. There are a load of hidden gems on the intranet that nobody tells you about.',
    initials: 'TW',
    color: '#da1e28',
    isUnread: false,
  },

  // Channel Messages
  {
    messageId: 'slack-ch-001',
    userId,
    senderName: 'James Okafor',
    channel: '#digital-strategy-team',
    type: 'channel',
    timestamp: hoursAgo(2),
    preview: 'Just shared the Project Horizon brief in the thread — please review before Tuesday.',
    fullText:
      'Just shared the Project Horizon brief in the thread — please review before Tuesday\'s client call. Key context: TechCorp UK are migrating their legacy ERP to IBM Cloud over 18 months. Our workstream is the data governance layer. @new starters — this is a great one to shadow.',
    initials: 'JO',
    color: '#198038',
    isUnread: true,
  },
  {
    messageId: 'slack-ch-002',
    userId,
    senderName: 'HR Team',
    channel: '#ibm-uk-new-starters',
    type: 'channel',
    timestamp: hoursAgo(5),
    preview: 'Reminder: complete your mandatory compliance modules by end of week.',
    fullText:
      'Reminder: all new starters joining in the last 30 days must complete the following mandatory compliance modules on w3 Learning by end of this week: (1) IBM Business Conduct Guidelines, (2) Data Privacy & GDPR, (3) Cybersecurity Awareness. Link: w3.ibm.com/learning/compliance',
    initials: 'HR',
    color: '#9f1853',
    isUnread: true,
  },
  {
    messageId: 'slack-ch-003',
    userId,
    senderName: 'Fatima Al-Rashid',
    channel: '#ai-and-automation',
    type: 'channel',
    timestamp: daysAgo(1),
    preview: 'Sharing a great paper on responsible AI governance frameworks — relevant to our Q3 work.',
    fullText:
      'Sharing a great paper on responsible AI governance frameworks — relevant to our Q3 work with the public sector client. Also, the next AI & Automation community event is on the 24th. Highly recommend attending if you are interested in the AI ethics space.',
    initials: 'FA',
    color: '#7e6ef4',
    isUnread: false,
  },
  {
    messageId: 'slack-ch-004',
    userId,
    senderName: 'IBM Early Careers',
    channel: '#early-careers-uk',
    type: 'channel',
    timestamp: daysAgo(2),
    preview: 'Monthly social is this Friday — all new starters welcome, drinks from 5:30pm!',
    fullText:
      'Monthly social is this Friday — all new starters welcome, drinks from 5:30pm at The Refinery, Southwark. Great chance to meet people across the different divisions. RSVP in the thread below so we can sort venue numbers.',
    initials: 'EC',
    color: '#0043ce',
    isUnread: false,
  },

  // Mentions
  {
    messageId: 'slack-mn-001',
    userId,
    senderName: 'Sarah Chen',
    channel: '#digital-strategy-team',
    type: 'mention',
    timestamp: hoursAgo(4),
    preview: 'Welcome to the team! Everyone please make them feel at home 🎉',
    fullText:
      "Welcome to the team! Everyone please make them feel at home 🎉 They are joining us as a Consultant on the Digital Strategy team and will be supporting Project Horizon from week two. Please reach out and introduce yourselves!",
    initials: 'SC',
    color: '#0072c3',
    isUnread: true,
  },
  {
    messageId: 'slack-mn-002',
    userId,
    senderName: 'Priya Patel',
    channel: '#ibm-uk-new-starters',
    type: 'mention',
    timestamp: daysAgo(1),
    preview: "Don't forget to check out the onboarding portal — it has everything you need for week 1.",
    fullText:
      "Don't forget to check out the onboarding portal — it has everything you need for week 1! I found it really helpful when I started. The 30/60/90 day plan section is especially useful for structuring your goals.",
    initials: 'PP',
    color: '#b28600',
    isUnread: true,
  },
  {
    messageId: 'slack-mn-003',
    userId,
    senderName: 'James Okafor',
    channel: '#digital-strategy-team',
    type: 'mention',
    timestamp: daysAgo(2),
    preview: 'Can you review the slide deck before our Tuesday call? Link in thread.',
    fullText:
      'Can you review the slide deck before our Tuesday call? I have shared it in the thread. Focus on slides 8–14 which cover the data migration approach — that is the section the client will push back on. Your fresh eyes would be really useful.',
    initials: 'JO',
    color: '#198038',
    isUnread: false,
  },
];

// ── Seed ─────────────────────────────────────────────────────────────────────
const repository = new SlackRepository();
const force = args.includes('--force');

async function seed() {
  let seeded = 0;
  let skipped = 0;

  for (const message of messages) {
    try {
      await repository.putMessage(message, force);
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
