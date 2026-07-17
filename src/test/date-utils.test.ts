import { describe, it, expect } from 'vitest';
import { addDays } from '@/lib/tasks/date-utils';

describe('addDays', () => {
  it('adds zero days and returns the same date', () => {
    expect(addDays('2026-07-14', 0)).toBe('2026-07-14');
  });

  it('adds a positive day offset', () => {
    expect(addDays('2026-07-14', 7)).toBe('2026-07-21');
  });

  it('crosses a month boundary', () => {
    expect(addDays('2026-07-28', 5)).toBe('2026-08-02');
  });

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('handles leap-year February correctly', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('returns an ISO YYYY-MM-DD string', () => {
    const result = addDays('2026-01-01', 10);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('adds a large offset (90 days)', () => {
    expect(addDays('2026-07-14', 90)).toBe('2026-10-12');
  });
});
