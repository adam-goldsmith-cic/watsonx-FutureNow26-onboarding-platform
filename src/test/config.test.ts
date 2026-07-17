import { describe, it, expect } from 'vitest';
import { resolveOrgConfig } from '@/lib/config';

const validConfig = [
  {
    pluginId: 'checklist',
    enabled: true,
    order: 1,
    config: {
      title: 'Test Checklist',
      tasks: [
        {
          id: 'task-1',
          label: 'Do a thing',
          category: 'IT',
          dueDayOffset: 1,
          mandatory: true,
          roles: ['all'],
        },
      ],
    },
  },
];

describe('resolveOrgConfig', () => {
  it('returns valid config unchanged', () => {
    const result = resolveOrgConfig(validConfig);
    expect(result).toHaveLength(1);
    expect(result[0].pluginId).toBe('checklist');
  });

  it('throws when a task is missing a required field', () => {
    const bad = [
      {
        pluginId: 'checklist',
        enabled: true,
        order: 1,
        config: {
          title: 'Bad',
          tasks: [{ id: 'x' }], // missing label, category, etc.
        },
      },
    ];
    expect(() => resolveOrgConfig(bad)).toThrow(/Invalid config for plugin "checklist"/);
  });

  it('throws when a task category is invalid', () => {
    const bad = [
      {
        pluginId: 'checklist',
        enabled: true,
        order: 1,
        config: {
          title: 'Bad',
          tasks: [
            {
              id: 't1',
              label: 'Do it',
              category: 'INVALID_CAT',
              dueDayOffset: 1,
              mandatory: true,
              roles: ['all'],
            },
          ],
        },
      },
    ];
    expect(() => resolveOrgConfig(bad)).toThrow(/Invalid config for plugin "checklist"/);
  });

  it('passes through unknown plugin IDs without throwing', () => {
    const withUnknown = [
      {
        pluginId: 'future-plugin',
        enabled: false,
        order: 99,
        config: { anything: true },
      },
    ];
    const result = resolveOrgConfig(withUnknown);
    expect(result[0].pluginId).toBe('future-plugin');
  });

  it('throws when input is not an array', () => {
    expect(() => resolveOrgConfig({ not: 'an array' })).toThrow();
  });

  it('throws on invalid training config', () => {
    expect(() =>
      resolveOrgConfig([
        {
          pluginId: 'training',
          enabled: true,
          order: 2,
          config: { title: 'Training', courses: [{ id: 'c1', title: 'Course', category: 'GEN', progress: 200, status: 'in-progress' }] },
        },
      ])
    ).toThrow(/Invalid config for plugin "training"/);
  });

  it('throws on invalid plan-90 config (wrong number of phases)', () => {
    expect(() =>
      resolveOrgConfig([
        {
          pluginId: 'plan-90',
          enabled: true,
          order: 3,
          config: {
            phases: [
              { label: '30 Days', subtitle: 'Learn', colorClass: 'blue', goals: [] },
              { label: '60 Days', subtitle: 'Build', colorClass: 'green', goals: [] },
            ],
          },
        },
      ])
    ).toThrow(/Invalid config for plugin "plan-90"/);
  });

  it('throws on invalid contacts config (initials too long)', () => {
    expect(() =>
      resolveOrgConfig([
        {
          pluginId: 'contacts',
          enabled: true,
          order: 4,
          config: {
            contacts: [{ initials: 'ABC', name: 'Alice', role: 'HR', description: 'Contact' }],
            tools: [],
          },
        },
      ])
    ).toThrow(/Invalid config for plugin "contacts"/);
  });

  it('throws on invalid announcements config (bad audience)', () => {
    expect(() =>
      resolveOrgConfig([
        {
          pluginId: 'announcements',
          enabled: true,
          order: 5,
          config: { title: 'News', items: [{ id: 'a1', message: 'Hi', audience: 'nobody' }] },
        },
      ])
    ).toThrow(/Invalid config for plugin "announcements"/);
  });

  it('resolves valid faq-links config without throwing', () => {
    const result = resolveOrgConfig([
      {
        pluginId: 'faq-links',
        enabled: true,
        order: 6,
        config: {
          links: [{ id: 'l1', label: 'W3', description: 'IBM portal', icon: '🔒', url: 'https://w3.ibm.com' }],
        },
      },
    ]);
    expect(result[0].pluginId).toBe('faq-links');
  });

  it('resolves valid policy-docs config without throwing', () => {
    const result = resolveOrgConfig([
      {
        pluginId: 'policy-docs',
        enabled: true,
        order: 7,
        config: {
          documents: [{ id: 'd1', title: 'Code of Conduct', description: 'Please read' }],
        },
      },
    ]);
    expect(result[0].pluginId).toBe('policy-docs');
  });

  it('preserves the enabled and order fields on a resolved entry', () => {
    const result = resolveOrgConfig(validConfig);
    expect(result[0].enabled).toBe(true);
    expect(result[0].order).toBe(1);
  });

  it('resolves a valid communities config without throwing', () => {
    const result = resolveOrgConfig([
      {
        pluginId: 'communities',
        enabled: true,
        order: 9,
        config: {
          communities: [
            {
              id: 'c1',
              name: 'AI & Automation Guild',
              description: 'For AI enthusiasts.',
              slackChannel: '#ai-automation',
              cadence: 'Monthly',
              memberCount: '120 members',
              isRecommended: true,
              iconEmoji: '🤖',
              bobNote: 'Relevant to your role.',
            },
          ],
        },
      },
    ]);
    expect(result[0].pluginId).toBe('communities');
  });

  it('throws on invalid communities config (missing required field)', () => {
    expect(() =>
      resolveOrgConfig([
        {
          pluginId: 'communities',
          enabled: true,
          order: 9,
          config: {
            communities: [
              {
                id: 'c1',
                name: 'AI Guild',
                // missing description, slackChannel, cadence, memberCount, isRecommended, iconEmoji, bobNote
              },
            ],
          },
        },
      ])
    ).toThrow(/Invalid config for plugin "communities"/);
  });

  it('throws on invalid communities config (non-boolean isRecommended)', () => {
    expect(() =>
      resolveOrgConfig([
        {
          pluginId: 'communities',
          enabled: true,
          order: 9,
          config: {
            communities: [
              {
                id: 'c1',
                name: 'AI Guild',
                description: 'Desc',
                slackChannel: '#ai',
                cadence: 'Monthly',
                memberCount: '10',
                isRecommended: 'yes',
                iconEmoji: '🤖',
                bobNote: 'Note',
              },
            ],
          },
        },
      ])
    ).toThrow(/Invalid config for plugin "communities"/);
  });
});
