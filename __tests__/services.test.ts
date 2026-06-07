import { useStore } from '@/data/store';
import { pullFromBackend } from '@/data/sync';
import { buildReplyPrompt } from '@/services/ai';
import { purchasePro } from '@/services/purchases';

describe('ai.buildReplyPrompt', () => {
  it('includes instruction, business, knowledge and inbound', () => {
    const p = buildReplyPrompt({
      rule: {
        id: 'r', name: 'n', target: { type: 'all' }, channel: 'sms', instruction: 'Answer bookings',
        tone: 'friendly', businessHoursOnly: false, requireApproval: false, enabled: true, createdAt: 0,
      },
      inbound: 'Hours?',
      business: { name: 'Halo', category: 'Salon', defaultChannel: 'sms', hours: {} as never },
      knowledge: [{ title: 'Hours', body: 'Open 9-5' }],
    });
    expect(p).toContain('Halo');
    expect(p).toContain('Answer bookings');
    expect(p).toContain('Open 9-5');
    expect(p).toContain('Hours?');
  });
});

describe('purchases.purchasePro', () => {
  it('sets the plan to pro', async () => {
    useStore.setState({ plan: 'free' });
    await purchasePro('annual');
    expect(useStore.getState().plan).toBe('pro');
  });
});

describe('sync.pullFromBackend', () => {
  it('no-ops without a backend URL', async () => {
    expect(await pullFromBackend(undefined)).toBe(false);
  });

  it('hydrates the store from a mocked backend', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ groups: [], contacts: [], campaigns: [], rules: [], knowledge: [], activity: [] }),
    })) as never;
    expect(await pullFromBackend('http://localhost:8787/v1')).toBe(true);
    expect(useStore.getState().groups).toHaveLength(0);
  });
});
