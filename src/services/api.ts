/**
 * Relay backend client contract.
 *
 * The app is offline-first: it reads/writes the local store for instant UI,
 * and (in production) syncs through this typed API. Swap `MockApi` for
 * `createHttpApi(baseUrl, token)` once the backend is live — the rest of the
 * app is unaffected.
 */

import type {
  AutoReplyRule,
  AutoSendCampaign,
  Contact,
  Group,
  KnowledgeDoc,
  MessageActivity,
} from '@/data/types';

export interface RelayApi {
  // Sync
  pull(): Promise<{
    groups: Group[];
    contacts: Contact[];
    campaigns: AutoSendCampaign[];
    rules: AutoReplyRule[];
    knowledge: KnowledgeDoc[];
    activity: MessageActivity[];
  }>;

  // Mutations (mirror the store; the server schedules sends + runs auto-reply)
  upsertCampaign(c: AutoSendCampaign): Promise<AutoSendCampaign>;
  upsertRule(r: AutoReplyRule): Promise<AutoReplyRule>;
  approveDraft(activityId: string): Promise<void>;

  // One-off send (e.g. "message this group now")
  sendNow(params: { groupId?: string; contactId?: string; body: string }): Promise<void>;
}

/**
 * Thin fetch client. Endpoints are illustrative; see docs/ARCHITECTURE.md.
 */
export function createHttpApi(baseUrl: string, token: string): RelayApi {
  const req = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`Relay API ${res.status}: ${await res.text()}`);
    return res.status === 204 ? undefined : res.json();
  };

  return {
    pull: () => req('/v1/sync'),
    upsertCampaign: (c) => req('/v1/campaigns', { method: 'PUT', body: JSON.stringify(c) }),
    upsertRule: (r) => req('/v1/rules', { method: 'PUT', body: JSON.stringify(r) }),
    approveDraft: (id) => req(`/v1/activity/${id}/approve`, { method: 'POST' }),
    sendNow: (p) => req('/v1/send', { method: 'POST', body: JSON.stringify(p) }),
  };
}
