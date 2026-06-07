import { dayBucket, targetEmoji } from '@/utils/format';

describe('dayBucket', () => {
  it('buckets timestamps', () => {
    expect(dayBucket(Date.now())).toBe('Today');
    expect(dayBucket(Date.now() - 25 * 3_600_000)).toBe('Yesterday');
    expect(dayBucket(Date.now() - 10 * 86_400_000)).toBe('Earlier');
  });
});

describe('targetEmoji', () => {
  const groups = [{ id: 'g1', emoji: '💎' }] as never;
  it('returns the group emoji, a globe for all, undefined for contact', () => {
    expect(targetEmoji({ type: 'group', groupId: 'g1' }, groups)).toBe('💎');
    expect(targetEmoji({ type: 'all' }, groups)).toBe('🌐');
    expect(targetEmoji({ type: 'contact', contactId: 'c1' }, groups)).toBeUndefined();
  });
});
