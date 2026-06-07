import { useStore } from '@/data/store';

beforeEach(() => {
  useStore.getState().resetDemo();
});

describe('store — contacts', () => {
  it('addContact then updateContact', () => {
    const c = useStore.getState().addContact({ name: 'Zed', phone: '+19990000000' });
    expect(useStore.getState().contacts.find((x) => x.id === c.id)?.name).toBe('Zed');
    useStore.getState().updateContact(c.id, { name: 'Zed Zephyr' });
    expect(useStore.getState().contacts.find((x) => x.id === c.id)?.name).toBe('Zed Zephyr');
  });
});

describe('store — rules', () => {
  it('upsert, toggle, delete', () => {
    const r = useStore.getState().upsertRule({
      name: 'R', target: { type: 'all' }, channel: 'sms', instruction: 'x', tone: 'friendly',
      businessHoursOnly: false, requireApproval: false, enabled: true,
    } as never);
    expect(useStore.getState().rules.find((x) => x.id === r.id)).toBeTruthy();
    useStore.getState().toggleRule(r.id, false);
    expect(useStore.getState().rules.find((x) => x.id === r.id)?.enabled).toBe(false);
    useStore.getState().deleteRule(r.id);
    expect(useStore.getState().rules.find((x) => x.id === r.id)).toBeFalsy();
  });
});

describe('store — knowledge', () => {
  it('upsert, toggle, delete', () => {
    const k = useStore.getState().upsertKnowledge({ title: 'K', content: 'c', enabled: true } as never);
    expect(useStore.getState().knowledge.find((x) => x.id === k.id)).toBeTruthy();
    useStore.getState().toggleKnowledge(k.id);
    expect(useStore.getState().knowledge.find((x) => x.id === k.id)?.enabled).toBe(false);
    useStore.getState().deleteKnowledge(k.id);
    expect(useStore.getState().knowledge.find((x) => x.id === k.id)).toBeFalsy();
  });
});

describe('store — misc', () => {
  it('deleteCampaign removes it', () => {
    const c = useStore.getState().campaigns[0]!;
    useStore.getState().deleteCampaign(c.id);
    expect(useStore.getState().campaigns.find((x) => x.id === c.id)).toBeFalsy();
  });

  it('setGroupContacts replaces members', () => {
    const g = useStore.getState().groups[0]!;
    useStore.getState().setGroupContacts(g.id, []);
    expect(useStore.getState().groups.find((x) => x.id === g.id)?.contactIds).toHaveLength(0);
  });

  it('updateBusiness and setPlan', () => {
    useStore.getState().updateBusiness({ category: 'Spa' });
    expect(useStore.getState().business.category).toBe('Spa');
    useStore.getState().setPlan('pro');
    expect(useStore.getState().plan).toBe('pro');
  });
});
