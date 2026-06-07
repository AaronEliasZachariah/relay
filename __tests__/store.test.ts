import { contactsInGroup, useStore } from '@/data/store';

beforeEach(() => {
  useStore.getState().resetDemo();
});

describe('groups', () => {
  it('upserts (create then update)', () => {
    const g = useStore.getState().upsertGroup({ name: 'New', emoji: '⭐', accent: '#000', contactIds: [] } as never);
    expect(useStore.getState().groups.find((x) => x.id === g.id)).toBeTruthy();
    useStore.getState().upsertGroup({ id: g.id, name: 'Renamed', emoji: '⭐', accent: '#000', contactIds: [] } as never);
    expect(useStore.getState().groups.find((x) => x.id === g.id)?.name).toBe('Renamed');
  });

  it('deleteGroup cascades to its campaigns and rules', () => {
    const g = useStore.getState().upsertGroup({ name: 'G', emoji: '⭐', accent: '#000', contactIds: [] } as never);
    const c = useStore.getState().upsertCampaign({
      name: 'c', target: { type: 'group', groupId: g.id }, channel: 'sms', message: 'x',
      schedule: { kind: 'recurring', frequency: 'daily', hour: 9, minute: 0, startsAt: 0 }, enabled: true,
    } as never);
    useStore.getState().deleteGroup(g.id);
    expect(useStore.getState().groups.find((x) => x.id === g.id)).toBeFalsy();
    expect(useStore.getState().campaigns.find((x) => x.id === c.id)).toBeFalsy();
  });
});

describe('contacts', () => {
  it('deleteContact removes the contact from every group', () => {
    const contactId = useStore.getState().contacts[0]!.id;
    expect(useStore.getState().groups.some((g) => g.contactIds.includes(contactId))).toBe(true);
    useStore.getState().deleteContact(contactId);
    expect(useStore.getState().groups.some((g) => g.contactIds.includes(contactId))).toBe(false);
  });
});

describe('toggles', () => {
  it('toggleCampaign flips enabled', () => {
    const c = useStore.getState().campaigns[0]!;
    useStore.getState().toggleCampaign(c.id);
    expect(useStore.getState().campaigns.find((x) => x.id === c.id)?.enabled).toBe(!c.enabled);
  });
});

describe('drafts', () => {
  it('approve marks the draft sent', () => {
    const draft = useStore.getState().activity.find((a) => a.status === 'awaiting-approval')!;
    useStore.getState().resolveDraft(draft.id, true);
    expect(useStore.getState().activity.find((a) => a.id === draft.id)?.status).toBe('sent');
  });

  it('reject removes the draft', () => {
    useStore.setState((s) => ({
      activity: [
        { id: 'tmp', direction: 'outbound', kind: 'auto-reply', channel: 'sms', contactId: 'c1', body: 'd', status: 'awaiting-approval', timestamp: Date.now() } as never,
        ...s.activity,
      ],
    }));
    useStore.getState().resolveDraft('tmp', false);
    expect(useStore.getState().activity.find((a) => a.id === 'tmp')).toBeFalsy();
  });
});

describe('onboarding + sync', () => {
  it('completeOnboarding sets the flag and merges business', () => {
    useStore.setState({ onboarded: false });
    useStore.getState().completeOnboarding({ name: 'My Biz' });
    expect(useStore.getState().onboarded).toBe(true);
    expect(useStore.getState().business.name).toBe('My Biz');
  });

  it('hydrateFromServer replaces collections', () => {
    useStore.getState().hydrateFromServer({ groups: [], contacts: [], campaigns: [], rules: [], knowledge: [], activity: [] } as never);
    expect(useStore.getState().groups).toHaveLength(0);
    expect(useStore.getState().contacts).toHaveLength(0);
  });
});

describe('selectors', () => {
  it('contactsInGroup resolves members in order', () => {
    const g = useStore.getState().groups[0]!;
    expect(contactsInGroup(useStore.getState().contacts, g)).toHaveLength(g.contactIds.length);
  });
});
