import { describe, expect, it } from 'vitest';

import { buildReplyPrompt, generateReply, toSnippets } from '../../src/services/ai.js';

describe('toSnippets', () => {
  it('keeps only enabled docs and maps content→body', () => {
    const out = toSnippets([
      { title: 'A', content: 'aaa', enabled: true },
      { title: 'B', content: 'bbb', enabled: false },
    ]);
    expect(out).toEqual([{ title: 'A', body: 'aaa' }]);
  });
});

describe('buildReplyPrompt', () => {
  it('includes business, instruction, tone, knowledge and the inbound message', () => {
    const prompt = buildReplyPrompt({
      rule: { instruction: 'Answer booking questions', tone: 'friendly' },
      inbound: 'Any openings Saturday?',
      business: { name: 'Halo', category: 'Salon' },
      knowledge: [{ title: 'Hours', body: 'Open 9-5' }],
    });
    expect(prompt).toContain('Halo');
    expect(prompt).toContain('Answer booking questions');
    expect(prompt.toLowerCase()).toContain('friendly');
    expect(prompt).toContain('Hours');
    expect(prompt).toContain('Open 9-5');
    expect(prompt).toContain('Any openings Saturday?');
    expect(prompt).toContain('Hard rules');
  });

  it('omits the Background block when there is no knowledge', () => {
    const p = buildReplyPrompt({
      rule: { instruction: 'x', tone: 'warm' },
      inbound: 'hi',
      business: { name: 'B', category: 'C' },
      knowledge: [],
    });
    expect(p).not.toContain('Background you may reference');
    expect(p).not.toContain('===');
  });
});

describe('generateReply (mock — no API key in test env)', () => {
  it('returns a friendly default', async () => {
    const r = await generateReply('p', { instruction: '', tone: 'friendly' });
    expect(r.toLowerCase()).toContain('help');
  });

  it('returns a non-empty concise variant', async () => {
    const r = await generateReply('p', { instruction: '', tone: 'concise' });
    expect(r.length).toBeGreaterThan(0);
  });
});
