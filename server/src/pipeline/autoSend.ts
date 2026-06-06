/**
 * Outbound pipeline. Finds due campaigns, resolves their audience, renders merge
 * tags, sends (idempotently), and advances next_run_at.
 */
import { and, eq, inArray, isNotNull, lte } from 'drizzle-orm';

import { db } from '../db/client.js';
import * as t from '../db/schema.js';
import { computeNextRun } from '../lib/schedule.js';
import { sendToContact } from '../services/sender.js';

const firstName = (n: string) => n.trim().split(/\s+/)[0] ?? n;

function applyMerge(message: string, name: string, businessName: string): string {
  return message
    .replace(/\{name\}/g, firstName(name))
    .replace(/\{business\}/g, businessName)
    .replace(/\{company\}/g, '');
}

async function resolveAudience(businessId: string, target: { type: string; groupId?: string; contactId?: string }) {
  if (target.type === 'all') {
    return db.select().from(t.contacts).where(eq(t.contacts.businessId, businessId));
  }
  if (target.type === 'contact' && target.contactId) {
    return db
      .select()
      .from(t.contacts)
      .where(and(eq(t.contacts.businessId, businessId), eq(t.contacts.id, target.contactId)));
  }
  if (target.type === 'group' && target.groupId) {
    const members = await db.select().from(t.groupMembers).where(eq(t.groupMembers.groupId, target.groupId));
    const ids = members.map((m) => m.contactId);
    if (ids.length === 0) return [];
    return db
      .select()
      .from(t.contacts)
      .where(and(eq(t.contacts.businessId, businessId), inArray(t.contacts.id, ids)));
  }
  return [];
}

/** Process every campaign whose next run is due. Returns messages sent. */
export async function runDueCampaigns(now = new Date()): Promise<number> {
  const due = await db
    .select()
    .from(t.campaigns)
    .where(and(eq(t.campaigns.enabled, true), isNotNull(t.campaigns.nextRunAt), lte(t.campaigns.nextRunAt, now)));

  let sent = 0;
  for (const c of due) {
    const [biz] = await db.select().from(t.businesses).where(eq(t.businesses.id, c.businessId));
    if (!biz) continue;

    const audience = await resolveAudience(c.businessId, c.target);
    const slot = (c.nextRunAt ?? now).getTime();

    for (const contact of audience) {
      const body = applyMerge(c.message, contact.name, biz.name);
      const r = await sendToContact(c.businessId, contact.id, body, {
        kind: 'auto-send',
        campaignId: c.id,
        channel: c.channel,
        dedupeKey: `${c.id}:${contact.id}:${slot}`,
      });
      if (r.ok && !r.deduped) sent++;
    }

    const next = computeNextRun(c.schedule, new Date(slot + 60_000));
    await db.update(t.campaigns).set({ lastRunAt: now, nextRunAt: next }).where(eq(t.campaigns.id, c.id));
  }
  return sent;
}
