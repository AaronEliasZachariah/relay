import {
  applyMerge,
  firstName,
  nextRunLabel,
  relativeTime,
  scheduleSummary,
  statusMeta,
  targetLabel,
  time12,
} from '@/utils/format';

describe('time12', () => {
  it('formats 12-hour clock', () => {
    expect(time12(0, 0)).toBe('12:00 AM');
    expect(time12(9, 5)).toBe('9:05 AM');
    expect(time12(12, 0)).toBe('12:00 PM');
    expect(time12(13, 30)).toBe('1:30 PM');
    expect(time12(23, 59)).toBe('11:59 PM');
  });
});

describe('scheduleSummary', () => {
  it('summarizes each frequency', () => {
    expect(scheduleSummary({ kind: 'recurring', frequency: 'daily', hour: 9, minute: 0, startsAt: 0 })).toContain('Every day');
    expect(scheduleSummary({ kind: 'recurring', frequency: 'weekly', weekdays: [5], hour: 9, minute: 0, startsAt: 0 })).toContain('Fri');
    expect(scheduleSummary({ kind: 'recurring', frequency: 'monthly', dayOfMonth: 1, hour: 10, minute: 0, startsAt: 0 })).toContain('1st');
    expect(scheduleSummary({ kind: 'once', at: new Date(2026, 5, 8, 9, 0).getTime() })).toContain('Jun');
  });
});

describe('applyMerge', () => {
  it('substitutes merge tags', () => {
    expect(applyMerge('Hi {name} from {business}', { name: 'Halo' } as never, 'Sarah')).toBe('Hi Sarah from Halo');
  });
});

describe('firstName', () => {
  it('returns the first token', () => {
    expect(firstName('Sarah Mitchell')).toBe('Sarah');
    expect(firstName('Cher')).toBe('Cher');
  });
});

describe('statusMeta', () => {
  it('maps statuses to tone + label', () => {
    expect(statusMeta('sent').tone).toBe('success');
    expect(statusMeta('failed').tone).toBe('danger');
    expect(statusMeta('awaiting-approval').label.toLowerCase()).toContain('approval');
  });
});

describe('targetLabel', () => {
  const groups = [{ id: 'g1', name: 'VIP' }] as never;
  const contacts = [{ id: 'c1', name: 'Sarah' }] as never;
  it('labels all/group/contact targets', () => {
    expect(targetLabel({ type: 'all' }, groups, contacts)).toBe('Everyone');
    expect(targetLabel({ type: 'group', groupId: 'g1' }, groups, contacts)).toBe('VIP');
    expect(targetLabel({ type: 'contact', contactId: 'c1' }, groups, contacts)).toBe('Sarah');
  });
});

describe('relativeTime', () => {
  it('formats recent times', () => {
    const now = Date.now();
    expect(relativeTime(now)).toBe('now');
    expect(relativeTime(now - 5 * 60_000)).toBe('5m');
    expect(relativeTime(now - 3 * 3_600_000)).toBe('3h');
  });
});

describe('nextRunLabel', () => {
  it('returns undefined for past/empty and a relative future', () => {
    expect(nextRunLabel(undefined)).toBeUndefined();
    expect(nextRunLabel(Date.now() - 1000)).toBeUndefined();
    expect(nextRunLabel(Date.now() + 2 * 3_600_000)).toContain('h');
  });
});
