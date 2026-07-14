import { describe, it, expect } from 'vitest';
import { checklistConfigSchema } from '@/plugins/schemas/checklist';
import { announcementsConfigSchema } from '@/plugins/schemas/announcements';
import { trainingConfigSchema } from '@/plugins/schemas/training';

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
});

describe('announcementsConfigSchema', () => {
  it('parses a valid announcement without expiresAt', () => {
    const result = announcementsConfigSchema.safeParse({
      title: 'News',
      items: [{ id: 'a1', message: 'Hello!', audience: 'all' }],
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
});

describe('trainingConfigSchema', () => {
  it('rejects progress > 100', () => {
    const result = trainingConfigSchema.safeParse({
      title: 'Training',
      courses: [
        {
          id: 'c1',
          title: 'Security',
          category: 'SEC',
          progress: 150,
          status: 'in-progress',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
