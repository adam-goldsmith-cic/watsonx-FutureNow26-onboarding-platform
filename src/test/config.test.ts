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
});
