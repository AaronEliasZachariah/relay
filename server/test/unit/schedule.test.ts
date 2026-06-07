import { describe, expect, it } from 'vitest';

import { computeNextRun, isWithinBusinessHours } from '../../src/lib/schedule.js';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const keyFor = (d: Date) => DAY_KEYS[d.getDay()]!;

describe('isWithinBusinessHours', () => {
  it('returns true when no hours configured', () => {
    expect(isWithinBusinessHours(undefined)).toBe(true);
    expect(isWithinBusinessHours(null)).toBe(true);
  });

  it('open during hours', () => {
    const d = new Date(2026, 5, 10, 12, 0, 0);
    expect(isWithinBusinessHours({ [keyFor(d)]: { open: '09:00', close: '17:00' } }, d)).toBe(true);
  });

  it('closed before open and after close', () => {
    const before = new Date(2026, 5, 10, 7, 0, 0);
    const after = new Date(2026, 5, 10, 20, 0, 0);
    expect(isWithinBusinessHours({ [keyFor(before)]: { open: '09:00', close: '17:00' } }, before)).toBe(false);
    expect(isWithinBusinessHours({ [keyFor(after)]: { open: '09:00', close: '17:00' } }, after)).toBe(false);
  });

  it('closed when the day is marked closed or missing', () => {
    const d = new Date(2026, 5, 10, 12, 0, 0);
    expect(isWithinBusinessHours({ [keyFor(d)]: { open: '00:00', close: '00:00', closed: true } }, d)).toBe(false);
    expect(isWithinBusinessHours({}, d)).toBe(false);
  });
});

describe('computeNextRun', () => {
  const from = new Date(2026, 5, 8, 12, 0, 0); // Mon Jun 8 2026, noon

  it('once in the future returns that exact time', () => {
    const at = from.getTime() + 86_400_000;
    expect(computeNextRun({ kind: 'once', at }, from)?.getTime()).toBe(at);
  });

  it('once in the past returns null', () => {
    expect(computeNextRun({ kind: 'once', at: from.getTime() - 1000 }, from)).toBeNull();
  });

  it('daily returns the next occurrence at the set time', () => {
    const next = computeNextRun({ kind: 'recurring', frequency: 'daily', hour: 9, minute: 30, startsAt: 0 }, from);
    expect(next).not.toBeNull();
    expect(next!.getHours()).toBe(9);
    expect(next!.getMinutes()).toBe(30);
    expect(next!.getTime()).toBeGreaterThan(from.getTime());
  });

  it('daily later the same day stays today', () => {
    const next = computeNextRun({ kind: 'recurring', frequency: 'daily', hour: 18, minute: 0, startsAt: 0 }, from);
    expect(next!.getDate()).toBe(from.getDate());
    expect(next!.getHours()).toBe(18);
  });

  it('weekly lands on a chosen weekday', () => {
    const next = computeNextRun({ kind: 'recurring', frequency: 'weekly', weekdays: [5], hour: 9, minute: 0, startsAt: 0 }, from);
    expect(next!.getDay()).toBe(5);
    expect(next!.getTime()).toBeGreaterThan(from.getTime());
  });

  it('monthly lands on the chosen day of month', () => {
    const next = computeNextRun({ kind: 'recurring', frequency: 'monthly', dayOfMonth: 15, hour: 10, minute: 0, startsAt: 0 }, from);
    expect(next!.getDate()).toBe(15);
    expect(next!.getHours()).toBe(10);
  });
});
