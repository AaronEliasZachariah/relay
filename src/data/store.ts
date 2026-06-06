/**
 * Single app store (Zustand + AsyncStorage persistence).
 *
 * Holds the whole client model and all mutations. In production the same shape
 * is hydrated from / synced to the Relay backend; here it persists locally so
 * the demo survives reloads. `hydrated` lets the UI hold a frame until the
 * persisted state has loaded (avoids a flash of seed data).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  seedActivity,
  seedBusiness,
  seedCampaigns,
  seedContacts,
  seedGroups,
  seedKnowledge,
  seedRules,
} from './seed';
import type {
  AutoReplyRule,
  AutoSendCampaign,
  BusinessProfile,
  Contact,
  Group,
  KnowledgeDoc,
  MessageActivity,
  Plan,
} from './types';

// UUID v4 so ids created offline are accepted by the backend (uuid PKs).
const uid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

type State = {
  hydrated: boolean;
  onboarded: boolean;
  plan: Plan;
  business: BusinessProfile;
  contacts: Contact[];
  groups: Group[];
  campaigns: AutoSendCampaign[];
  rules: AutoReplyRule[];
  knowledge: KnowledgeDoc[];
  activity: MessageActivity[];
};

type WithOptionalId<T, K extends keyof T> = Omit<T, K | 'id'> & { id?: string };

/** Snapshot shape returned by the backend's GET /v1/sync. */
type ServerSnapshot = Pick<
  State,
  'groups' | 'contacts' | 'campaigns' | 'rules' | 'knowledge' | 'activity'
>;

type Actions = {
  completeOnboarding: (b: Partial<BusinessProfile>) => void;
  resetDemo: () => void;
  setPlan: (p: Plan) => void;
  updateBusiness: (b: Partial<BusinessProfile>) => void;

  addContact: (c: Omit<Contact, 'id' | 'createdAt'>) => Contact;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  upsertGroup: (g: WithOptionalId<Group, 'createdAt'>) => Group;
  deleteGroup: (id: string) => void;
  setGroupContacts: (id: string, contactIds: string[]) => void;

  upsertCampaign: (c: WithOptionalId<AutoSendCampaign, 'createdAt'>) => AutoSendCampaign;
  toggleCampaign: (id: string, enabled?: boolean) => void;
  deleteCampaign: (id: string) => void;

  upsertRule: (r: WithOptionalId<AutoReplyRule, 'createdAt'>) => AutoReplyRule;
  toggleRule: (id: string, enabled?: boolean) => void;
  deleteRule: (id: string) => void;

  upsertKnowledge: (k: WithOptionalId<KnowledgeDoc, 'updatedAt'>) => KnowledgeDoc;
  toggleKnowledge: (id: string, enabled?: boolean) => void;
  deleteKnowledge: (id: string) => void;

  resolveDraft: (activityId: string, approve: boolean) => void;

  /** Replace local collections with a backend snapshot (offline-first sync). */
  hydrateFromServer: (snap: ServerSnapshot) => void;
};

const initialState: State = {
  hydrated: false,
  onboarded: false,
  plan: 'free',
  business: seedBusiness,
  contacts: seedContacts,
  groups: seedGroups,
  campaigns: seedCampaigns,
  rules: seedRules,
  knowledge: seedKnowledge,
  activity: seedActivity,
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeOnboarding: (b) =>
        set((s) => ({ onboarded: true, business: { ...s.business, ...b } })),

      resetDemo: () => set({ ...initialState, hydrated: true, onboarded: true }),

      setPlan: (plan) => set({ plan }),

      updateBusiness: (b) => set((s) => ({ business: { ...s.business, ...b } })),

      addContact: (c) => {
        const contact: Contact = { ...c, id: uid(), createdAt: Date.now() };
        set((s) => ({ contacts: [contact, ...s.contacts] }));
        return contact;
      },
      updateContact: (id, patch) =>
        set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteContact: (id) =>
        set((s) => ({
          contacts: s.contacts.filter((c) => c.id !== id),
          groups: s.groups.map((g) => ({
            ...g,
            contactIds: g.contactIds.filter((cid) => cid !== id),
          })),
        })),

      upsertGroup: (g) => {
        const existing = g.id ? get().groups.find((x) => x.id === g.id) : undefined;
        const group: Group = existing
          ? { ...existing, ...g, id: existing.id }
          : { ...(g as Omit<Group, 'id' | 'createdAt'>), id: uid(), createdAt: Date.now() };
        set((s) => ({
          groups: existing ? s.groups.map((x) => (x.id === group.id ? group : x)) : [group, ...s.groups],
        }));
        return group;
      },
      deleteGroup: (id) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          campaigns: s.campaigns.filter(
            (c) => !(c.target.type === 'group' && c.target.groupId === id),
          ),
          rules: s.rules.filter((r) => !(r.target.type === 'group' && r.target.groupId === id)),
        })),
      setGroupContacts: (id, contactIds) =>
        set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, contactIds } : g)) })),

      upsertCampaign: (c) => {
        const existing = c.id ? get().campaigns.find((x) => x.id === c.id) : undefined;
        const campaign: AutoSendCampaign = existing
          ? { ...existing, ...c, id: existing.id }
          : { ...(c as Omit<AutoSendCampaign, 'id' | 'createdAt'>), id: uid(), createdAt: Date.now() };
        set((s) => ({
          campaigns: existing
            ? s.campaigns.map((x) => (x.id === campaign.id ? campaign : x))
            : [campaign, ...s.campaigns],
        }));
        return campaign;
      },
      toggleCampaign: (id, enabled) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === id ? { ...c, enabled: enabled ?? !c.enabled } : c,
          ),
        })),
      deleteCampaign: (id) => set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) })),

      upsertRule: (r) => {
        const existing = r.id ? get().rules.find((x) => x.id === r.id) : undefined;
        const rule: AutoReplyRule = existing
          ? { ...existing, ...r, id: existing.id }
          : { ...(r as Omit<AutoReplyRule, 'id' | 'createdAt'>), id: uid(), createdAt: Date.now() };
        set((s) => ({
          rules: existing ? s.rules.map((x) => (x.id === rule.id ? rule : x)) : [rule, ...s.rules],
        }));
        return rule;
      },
      toggleRule: (id, enabled) =>
        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: enabled ?? !r.enabled } : r)),
        })),
      deleteRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),

      upsertKnowledge: (k) => {
        const existing = k.id ? get().knowledge.find((x) => x.id === k.id) : undefined;
        const doc: KnowledgeDoc = existing
          ? { ...existing, ...k, id: existing.id, updatedAt: Date.now() }
          : { ...(k as Omit<KnowledgeDoc, 'id' | 'updatedAt'>), id: uid(), updatedAt: Date.now() };
        set((s) => ({
          knowledge: existing
            ? s.knowledge.map((x) => (x.id === doc.id ? doc : x))
            : [doc, ...s.knowledge],
        }));
        return doc;
      },
      toggleKnowledge: (id, enabled) =>
        set((s) => ({
          knowledge: s.knowledge.map((k) =>
            k.id === id ? { ...k, enabled: enabled ?? !k.enabled } : k,
          ),
        })),
      deleteKnowledge: (id) => set((s) => ({ knowledge: s.knowledge.filter((k) => k.id !== id) })),

      resolveDraft: (activityId, approve) =>
        set((s) => ({
          activity: approve
            ? s.activity.map((a) =>
                a.id === activityId ? { ...a, status: 'sent', timestamp: Date.now() } : a,
              )
            : s.activity.filter((a) => a.id !== activityId),
        })),

      hydrateFromServer: (snap) => set({ ...snap, hydrated: true, onboarded: true }),
    }),
    {
      name: 'relay-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/* ----------------------------- selectors ----------------------------------- */

export const useGroup = (id?: string) =>
  useStore((s) => s.groups.find((g) => g.id === id));

export const useContact = (id?: string) =>
  useStore((s) => s.contacts.find((c) => c.id === id));

export const useCampaign = (id?: string) =>
  useStore((s) => s.campaigns.find((c) => c.id === id));

export const useRule = (id?: string) => useStore((s) => s.rules.find((r) => r.id === id));

export const useKnowledgeDoc = (id?: string) =>
  useStore((s) => s.knowledge.find((k) => k.id === id));

/** Pure helper: resolve a group's contacts in order. */
export const contactsInGroup = (contacts: Contact[], group?: Group): Contact[] =>
  group
    ? (group.contactIds
        .map((id) => contacts.find((c) => c.id === id))
        .filter(Boolean) as Contact[])
    : [];
