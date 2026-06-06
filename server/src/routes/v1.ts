/**
 * v1 API — sync + commands. Shapes match the app's client types in
 * `app/src/data/types.ts` so `RelayApi.pull()` maps 1:1. Every route is
 * tenant-scoped by the `tenant` middleware.
 */
import { and, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import * as t from '../db/schema.js';
import { tenant } from '../lib/tenant.js';

export const v1 = new Hono();
v1.use('*', tenant);

const ms = (d: Date | null) => (d ? d.getTime() : undefined);

/* ------------------------------ sync (pull) ------------------------------ */

v1.get('/sync', async (c) => {
  const businessId = c.get('businessId');
  const [groups, contacts, campaigns, rules, knowledge, messages] = await Promise.all([
    db.select().from(t.groups).where(eq(t.groups.businessId, businessId)),
    db.select().from(t.contacts).where(eq(t.contacts.businessId, businessId)),
    db.select().from(t.campaigns).where(eq(t.campaigns.businessId, businessId)),
    db.select().from(t.replyRules).where(eq(t.replyRules.businessId, businessId)),
    db.select().from(t.knowledgeDocs).where(eq(t.knowledgeDocs.businessId, businessId)),
    db.select().from(t.messages).where(eq(t.messages.businessId, businessId)),
  ]);

  const gids = groups.map((g) => g.id);
  const members = gids.length
    ? await db.select().from(t.groupMembers).where(inArray(t.groupMembers.groupId, gids))
    : [];
  const byGroup = new Map<string, string[]>();
  for (const m of members) {
    const arr = byGroup.get(m.groupId) ?? [];
    arr.push(m.contactId);
    byGroup.set(m.groupId, arr);
  }

  return c.json({
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji,
      accent: g.accent,
      description: g.description ?? undefined,
      contactIds: byGroup.get(g.id) ?? [],
      createdAt: g.createdAt.getTime(),
    })),
    contacts: contacts.map((x) => ({
      id: x.id,
      name: x.name,
      phone: x.phoneE164,
      accent: x.accent ?? undefined,
      company: x.company ?? undefined,
      note: x.note ?? undefined,
      optedOut: x.optedOut,
      createdAt: x.createdAt.getTime(),
    })),
    campaigns: campaigns.map((x) => ({
      id: x.id,
      name: x.name,
      target: x.target,
      channel: x.channel,
      message: x.message,
      schedule: x.schedule,
      enabled: x.enabled,
      createdAt: x.createdAt.getTime(),
      nextRunAt: ms(x.nextRunAt),
      lastRunAt: ms(x.lastRunAt),
    })),
    rules: rules.map((x) => ({
      id: x.id,
      name: x.name,
      target: x.target,
      channel: x.channel,
      instruction: x.instruction,
      tone: x.tone,
      businessHoursOnly: x.businessHoursOnly,
      afterHoursMessage: x.afterHoursMessage ?? undefined,
      requireApproval: x.requireApproval,
      enabled: x.enabled,
      createdAt: x.createdAt.getTime(),
    })),
    knowledge: knowledge.map((x) => ({
      id: x.id,
      title: x.title,
      content: x.content,
      enabled: x.enabled,
      updatedAt: x.updatedAt.getTime(),
    })),
    activity: messages
      .map((x) => ({
        id: x.id,
        direction: x.direction,
        kind: x.kind,
        channel: x.channel,
        contactId: x.contactId ?? '',
        body: x.body,
        status: x.status,
        timestamp: x.createdAt.getTime(),
        campaignId: x.campaignId ?? undefined,
        ruleId: x.ruleId ?? undefined,
      }))
      .sort((a, b) => b.timestamp - a.timestamp),
  });
});

/* ------------------------------- commands -------------------------------- */

v1.put('/campaigns', async (c) => {
  const businessId = c.get('businessId');
  const b = await c.req.json();
  const id: string = b.id ?? crypto.randomUUID();
  const row = {
    id,
    businessId,
    name: b.name,
    target: b.target,
    channel: b.channel ?? 'sms',
    message: b.message,
    schedule: b.schedule,
    enabled: b.enabled ?? true,
    nextRunAt: b.nextRunAt ? new Date(b.nextRunAt) : null,
    lastRunAt: b.lastRunAt ? new Date(b.lastRunAt) : null,
  };
  await db
    .insert(t.campaigns)
    .values(row)
    .onConflictDoUpdate({
      target: t.campaigns.id,
      set: {
        name: row.name,
        target: row.target,
        channel: row.channel,
        message: row.message,
        schedule: row.schedule,
        enabled: row.enabled,
        nextRunAt: row.nextRunAt,
      },
    });
  return c.json({ id });
});

v1.put('/rules', async (c) => {
  const businessId = c.get('businessId');
  const b = await c.req.json();
  const id: string = b.id ?? crypto.randomUUID();
  const row = {
    id,
    businessId,
    name: b.name,
    target: b.target,
    channel: b.channel ?? 'sms',
    instruction: b.instruction,
    tone: b.tone ?? 'friendly',
    businessHoursOnly: b.businessHoursOnly ?? false,
    afterHoursMessage: b.afterHoursMessage ?? null,
    requireApproval: b.requireApproval ?? false,
    enabled: b.enabled ?? true,
  };
  await db
    .insert(t.replyRules)
    .values(row)
    .onConflictDoUpdate({
      target: t.replyRules.id,
      set: {
        name: row.name,
        target: row.target,
        instruction: row.instruction,
        tone: row.tone,
        businessHoursOnly: row.businessHoursOnly,
        afterHoursMessage: row.afterHoursMessage,
        requireApproval: row.requireApproval,
        enabled: row.enabled,
      },
    });
  return c.json({ id });
});

v1.put('/knowledge', async (c) => {
  const businessId = c.get('businessId');
  const b = await c.req.json();
  const id: string = b.id ?? crypto.randomUUID();
  const row = { id, businessId, title: b.title, content: b.content, enabled: b.enabled ?? true, updatedAt: new Date() };
  await db
    .insert(t.knowledgeDocs)
    .values(row)
    .onConflictDoUpdate({ target: t.knowledgeDocs.id, set: { title: row.title, content: row.content, enabled: row.enabled, updatedAt: row.updatedAt } });
  return c.json({ id });
});

v1.post('/activity/:id/approve', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  await db
    .update(t.messages)
    .set({ status: 'sent' })
    .where(and(eq(t.messages.id, id), eq(t.messages.businessId, businessId)));
  return c.body(null, 204);
});

/**
 * Manual "message now". Resolves recipients and logs messages. Real delivery
 * lands in Phase 3 (Twilio adapter + queue); until then it records mock sends.
 */
v1.post('/send', async (c) => {
  const businessId = c.get('businessId');
  const { groupId, contactId, body } = await c.req.json();

  let contactIds: string[] = [];
  if (contactId) contactIds = [contactId];
  else if (groupId) {
    const m = await db.select().from(t.groupMembers).where(eq(t.groupMembers.groupId, groupId));
    contactIds = m.map((x) => x.contactId);
  }
  if (contactIds.length === 0) return c.json({ queued: 0 });

  await db.insert(t.messages).values(
    contactIds.map((cid) => ({
      businessId,
      contactId: cid,
      direction: 'outbound' as const,
      kind: 'manual' as const,
      channel: 'sms' as const,
      body,
      status: 'sent', // mock until Phase 3
    })),
  );
  return c.json({ queued: contactIds.length });
});
