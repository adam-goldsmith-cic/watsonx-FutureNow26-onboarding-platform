import { describe, it, expect } from 'vitest';
import { checklistConfigSchema } from '@/plugins/schemas/checklist';
import { announcementsConfigSchema } from '@/plugins/schemas/announcements';
import { trainingConfigSchema } from '@/plugins/schemas/training';
import { plan90ConfigSchema } from '@/plugins/schemas/plan-90';
import { faqLinksConfigSchema } from '@/plugins/schemas/faq-links';
import { contactsConfigSchema } from '@/plugins/schemas/contacts';
import { policyDocsConfigSchema } from '@/plugins/schemas/policy-docs';

// ── checklistConfigSchema ─────────────────────────────────────────────────────

describe('checklistConfigSchema', () => {
  it('parses a valid config', () => {
    const result = checklistConfigSchema.safeParse({
      title: 'Week 1',
      tasks: [
        {
          id: 't1',
          label: 'Set up laptop',
          category: 'IT',
          dueDayOffset: 1,
          mandatory: true,
          roles: ['all'],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a task with an optional link object', () => {
    const result = checklistConfigSchema.safeParse({
      title: 'Week 1',
      tasks: [
        {
          id: 't1',
          label: 'Do a thing',
          category: 'HR',
          dueDayOffset: 0,
          mandatory: false,
          roles: ['all'],
          link: { label: 'IBM Portal', url: 'https://ibm.com' },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid category', () => {
    const result = checklistConfigSchema.safeParse({
      title: 'Week 1',
      tasks: [
        {
          id: 't1',
          label: 'Set up laptop',
          category: 'UNKNOWN',
          dueDayOffset: 1,
          mandatory: true,
          roles: ['all'],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative dueDayOffset', () => {
    const result = checklistConfigSchema.safeParse({
      title: 'Week 1',
      tasks: [
        {
          id: 't1',
          label: 'Task',
          category: 'IT',
          dueDayOffset: -1,
          mandatory: true,
          roles: ['all'],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts dueDayOffset of 0', () => {
    const result = checklistConfigSchema.safeParse({
      title: 'Week 1',
      tasks: [
        {
          id: 't1',
          label: 'Task',
          category: 'SEC',
          dueDayOffset: 0,
          mandatory: true,
          roles: ['all'],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid categories', () => {
    for (const category of ['IT', 'HR', 'SEC', 'MGR', 'TEAM']) {
      const result = checklistConfigSchema.safeParse({
        title: 'Test',
        tasks: [{ id: 't1', label: 'Task', category, dueDayOffset: 1, mandatory: true, roles: ['all'] }],
      });
      expect(result.success, `category ${category} should be valid`).toBe(true);
    }
  });
});

// ── announcementsConfigSchema ─────────────────────────────────────────────────

describe('announcementsConfigSchema', () => {
  it('parses a valid announcement without expiresAt', () => {
    const result = announcementsConfigSchema.safeParse({
      title: 'News',
      items: [{ id: 'a1', message: 'Hello!', audience: 'all' }],
    });
    expect(result.success).toBe(true);
  });

  it('parses a valid announcement with expiresAt', () => {
    const result = announcementsConfigSchema.safeParse({
      title: 'News',
      items: [{ id: 'a1', message: 'Hello!', audience: 'cohort', expiresAt: '2026-12-31T23:59:59.000Z' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid audience', () => {
    const result = announcementsConfigSchema.safeParse({
      title: 'News',
      items: [{ id: 'a1', message: 'Hello!', audience: 'everyone' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed expiresAt (not an ISO datetime)', () => {
    const result = announcementsConfigSchema.safeParse({
      title: 'News',
      items: [{ id: 'a1', message: 'Hello!', audience: 'team', expiresAt: 'not-a-date' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid audience values', () => {
    for (const audience of ['all', 'cohort', 'team']) {
      const result = announcementsConfigSchema.safeParse({
        title: 'News',
        items: [{ id: 'a1', message: 'Hi', audience }],
      });
      expect(result.success, `audience "${audience}" should be valid`).toBe(true);
    }
  });
});

// ── trainingConfigSchema ──────────────────────────────────────────────────────

describe('trainingConfigSchema', () => {
  it('parses a valid training config', () => {
    const result = trainingConfigSchema.safeParse({
      title: 'Training',
      courses: [
        { id: 'c1', title: 'Security Basics', category: 'SEC', progress: 50, status: 'in-progress' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts progress of 0', () => {
    const result = trainingConfigSchema.safeParse({
      title: 'Training',
      courses: [{ id: 'c1', title: 'Course', category: 'GEN', progress: 0, status: 'not-started' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts progress of 100', () => {
    const result = trainingConfigSchema.safeParse({
      title: 'Training',
      courses: [{ id: 'c1', title: 'Course', category: 'GEN', progress: 100, status: 'completed' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects progress > 100', () => {
    const result = trainingConfigSchema.safeParse({
      title: 'Training',
      courses: [{ id: 'c1', title: 'Security', category: 'SEC', progress: 150, status: 'in-progress' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects progress < 0', () => {
    const result = trainingConfigSchema.safeParse({
      title: 'Training',
      courses: [{ id: 'c1', title: 'Course', category: 'GEN', progress: -1, status: 'not-started' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = trainingConfigSchema.safeParse({
      title: 'Training',
      courses: [{ id: 'c1', title: 'Course', category: 'GEN', progress: 0, status: 'pending' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts an optional dueDate', () => {
    const result = trainingConfigSchema.safeParse({
      title: 'Training',
      courses: [
        { id: 'c1', title: 'Course', category: 'GEN', progress: 0, status: 'not-started', dueDate: '2026-09-01' },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ── plan90ConfigSchema ────────────────────────────────────────────────────────

describe('plan90ConfigSchema', () => {
  const validPhases = [
    { label: '30 Days', subtitle: 'Learn', colorClass: 'text-blue', goals: ['Read the handbook'] },
    { label: '60 Days', subtitle: 'Contribute', colorClass: 'text-green', goals: ['Ship something'] },
    { label: '90 Days', subtitle: 'Lead', colorClass: 'text-purple', goals: ['Run a meeting'] },
  ];

  it('parses a valid 3-phase plan', () => {
    const result = plan90ConfigSchema.safeParse({ phases: validPhases });
    expect(result.success).toBe(true);
  });

  it('applies the default title when omitted', () => {
    const result = plan90ConfigSchema.safeParse({ phases: validPhases });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Your 30 / 60 / 90 Day Plan');
    }
  });

  it('accepts an explicit title', () => {
    const result = plan90ConfigSchema.safeParse({ title: 'My Plan', phases: validPhases });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Plan');
    }
  });

  it('rejects fewer than 3 phases', () => {
    const result = plan90ConfigSchema.safeParse({ phases: validPhases.slice(0, 2) });
    expect(result.success).toBe(false);
  });

  it('rejects more than 3 phases', () => {
    const result = plan90ConfigSchema.safeParse({
      phases: [...validPhases, { label: '120 Days', subtitle: 'Extra', colorClass: 'text-red', goals: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a phase missing required fields', () => {
    const result = plan90ConfigSchema.safeParse({
      phases: [
        { label: '30 Days', colorClass: 'text-blue', goals: [] }, // missing subtitle
        ...validPhases.slice(1),
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ── faqLinksConfigSchema ──────────────────────────────────────────────────────

describe('faqLinksConfigSchema', () => {
  const validLink = { id: 'l1', label: 'W3 ID', description: 'IBM identity', icon: '🔒', url: 'https://w3.ibm.com' };

  it('parses a valid config', () => {
    const result = faqLinksConfigSchema.safeParse({ links: [validLink] });
    expect(result.success).toBe(true);
  });

  it('applies the default title when omitted', () => {
    const result = faqLinksConfigSchema.safeParse({ links: [validLink] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('FAQ & Quick Links');
    }
  });

  it('accepts an empty links array', () => {
    const result = faqLinksConfigSchema.safeParse({ links: [] });
    expect(result.success).toBe(true);
  });

  it('rejects a link missing the url field', () => {
    const { url: _url, ...noUrl } = validLink;
    const result = faqLinksConfigSchema.safeParse({ links: [noUrl] });
    expect(result.success).toBe(false);
  });

  it('rejects a link missing the label field', () => {
    const { label: _label, ...noLabel } = validLink;
    const result = faqLinksConfigSchema.safeParse({ links: [noLabel] });
    expect(result.success).toBe(false);
  });
});

// ── contactsConfigSchema ──────────────────────────────────────────────────────

describe('contactsConfigSchema', () => {
  const validContact = { initials: 'AJ', name: 'Alice Johnson', role: 'HR Manager', description: 'First point of contact' };
  const validTool = { name: 'Slack', status: 'done' as const };

  it('parses a valid config', () => {
    const result = contactsConfigSchema.safeParse({
      contacts: [validContact],
      tools: [validTool],
    });
    expect(result.success).toBe(true);
  });

  it('applies the default title when omitted', () => {
    const result = contactsConfigSchema.safeParse({ contacts: [], tools: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Key Contacts & Tools');
    }
  });

  it('rejects initials longer than 2 characters', () => {
    const result = contactsConfigSchema.safeParse({
      contacts: [{ ...validContact, initials: 'ABC' }],
      tools: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid tool statuses', () => {
    for (const status of ['done', 'in-progress', 'not-started'] as const) {
      const result = contactsConfigSchema.safeParse({
        contacts: [],
        tools: [{ name: 'Tool', status }],
      });
      expect(result.success, `tool status "${status}" should be valid`).toBe(true);
    }
  });

  it('rejects an invalid tool status', () => {
    const result = contactsConfigSchema.safeParse({
      contacts: [],
      tools: [{ name: 'Tool', status: 'completed' }],
    });
    expect(result.success).toBe(false);
  });
});

// ── policyDocsConfigSchema ────────────────────────────────────────────────────

describe('policyDocsConfigSchema', () => {
  const validDoc = { id: 'd1', title: 'Code of Conduct', description: 'Read before starting' };

  it('parses a valid config without askBobPrompt', () => {
    const result = policyDocsConfigSchema.safeParse({ documents: [validDoc] });
    expect(result.success).toBe(true);
  });

  it('parses a valid doc with an optional askBobPrompt', () => {
    const result = policyDocsConfigSchema.safeParse({
      documents: [{ ...validDoc, askBobPrompt: 'Summarise the code of conduct' }],
    });
    expect(result.success).toBe(true);
  });

  it('applies the default title when omitted', () => {
    const result = policyDocsConfigSchema.safeParse({ documents: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Policies & Documents');
    }
  });

  it('rejects a doc missing the title field', () => {
    const { title: _title, ...noTitle } = validDoc;
    const result = policyDocsConfigSchema.safeParse({ documents: [noTitle] });
    expect(result.success).toBe(false);
  });

  it('rejects a doc missing the description field', () => {
    const { description: _description, ...noDesc } = validDoc;
    const result = policyDocsConfigSchema.safeParse({ documents: [noDesc] });
    expect(result.success).toBe(false);
  });
});
