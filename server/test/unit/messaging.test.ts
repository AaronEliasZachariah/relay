import { describe, expect, it } from 'vitest';

import { isOptOut, smsSegments } from '../../src/services/messaging.js';

describe('smsSegments', () => {
  it('counts GSM-7 segments (160 / 153)', () => {
    expect(smsSegments('')).toBe(0);
    expect(smsSegments('hello')).toBe(1);
    expect(smsSegments('a'.repeat(160))).toBe(1);
    expect(smsSegments('a'.repeat(161))).toBe(2);
    expect(smsSegments('a'.repeat(306))).toBe(2);
    expect(smsSegments('a'.repeat(307))).toBe(3);
  });
});

describe('isOptOut', () => {
  it('detects STOP keywords (case/space-insensitive)', () => {
    for (const w of ['STOP', 'stop', ' Stop ', 'unsubscribe', 'CANCEL', 'end', 'quit']) {
      expect(isOptOut(w)).toBe(true);
    }
  });

  it('ignores normal messages', () => {
    for (const w of ['hello', 'please stop by', 'stopwatch', '']) {
      expect(isOptOut(w)).toBe(false);
    }
  });
});
