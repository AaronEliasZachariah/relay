/**
 * Inbound pipeline. Logs the message, honors opt-outs, matches the most-specific
 * enabled rule, respects business hours, then drafts a grounded AI reply and
 * either sends it or parks it for approval.
 */
import { and, eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import * as t from '../db/schema.js';
import { isWithinBusinessHours } from '../lib/schedule.js';
import { buildReplyPrompt, generateReply, toSnippets } from '../services/ai.js';
import { isOptOut } from '../services/messaging.js';
import { sendToContact } from '../services/sender.js';

export type InboundResult = {
  ok: boolean;
  action?: string;
  reason?: string;
  draft?: string;
  messageId?: string;
};

export async function handleInbound(input: { to: string; from: string; body: string }): Promise<InboundResult> {
  const { to, from, body } = input;

  // Resolve the business by its sending number (fallback to the only one in dev).
  let biz = to ? (await db.select().from(t.businesses).where(eq(t.businesses.sendingNumber, to)))[0] : undefined;
  if (!biz) biz = (await db.select().from(t.businesses).limit(1))[0];
  if (!biz) return { ok: false, reason: 'no_business' };

  // Find or create the contact by phone.
  let contact = (
    await db
      .select()
      .from(t.contacts)
      .where(and(eq(t.contacts.businessId, biz.id), eq(t.contacts.phoneE164, from)))
  )[0];
  if (!contact) {
    contact = (await db.insert(t.contacts).values({ businessId: biz.id, name: from, phoneE164: from }).returning())[0];
  }
  if (!contact) return { ok: false, reason: 'no_contact' };
  const contactId = contact.id;

  // Log the inbound message.
  await db.insert(t.messages).values({
    businessId: biz.id,
    contactId,
    direction: 'inbound',
    kind: 'manual',
    channel: 'sms',
    body,
    status: 'received',
  });

  // Compliance: STOP/opt-out.
  if (isOptOut(body)) {
    await db.update(t.contacts).set({ optedOut: true }).where(eq(t.contacts.id, contactId));
    return { ok: true, action: 'opted_out' };
  }
  if (contact.optedOut) return { ok: true, action: 'skipped_opted_out' };

  // Match the most specific enabled rule: contact > group > everyone.
  const rules = await db
    .select()
    .from(t.replyRules)
    .where(and(eq(t.replyRules.businessId, biz.id), eq(t.replyRules.enabled, true)));
  const memberships = await db.select().from(t.groupMembers).where(eq(t.groupMembers.contactId, contactId));
  const groupIds = new Set(memberships.map((m) => m.groupId));
  const score = (tg: { type: string; groupId?: string; contactId?: string }) =>
    tg.type === 'contact' && tg.contactId === contactId
      ? 3
      : tg.type === 'group' && tg.groupId && groupIds.has(tg.groupId)
        ? 2
        : tg.type === 'all'
          ? 1
          : 0;
  const rule = rules
    .map((r) => ({ r, s: score(r.target) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)[0]?.r;
  if (!rule) return { ok: true, action: 'no_rule' };

  // Business hours.
  if (rule.businessHoursOnly && !isWithinBusinessHours(biz.hours)) {
    if (rule.afterHoursMessage) {
      await sendToContact(biz.id, contactId, rule.afterHoursMessage, { kind: 'auto-reply', ruleId: rule.id });
      return { ok: true, action: 'after_hours' };
    }
    return { ok: true, action: 'after_hours_silent' };
  }

  // Draft a grounded reply.
  const docs = await db
    .select()
    .from(t.knowledgeDocs)
    .where(and(eq(t.knowledgeDocs.businessId, biz.id), eq(t.knowledgeDocs.enabled, true)));
  const prompt = buildReplyPrompt({
    rule,
    inbound: body,
    business: { name: biz.name, category: biz.category },
    knowledge: toSnippets(docs),
  });
  const draft = await generateReply(prompt, rule);

  if (rule.requireApproval) {
    await db.insert(t.messages).values({
      businessId: biz.id,
      contactId,
      direction: 'outbound',
      kind: 'auto-reply',
      channel: 'sms',
      body: draft,
      status: 'awaiting-approval',
      ruleId: rule.id,
    });
    return { ok: true, action: 'awaiting_approval', draft };
  }

  const sent = await sendToContact(biz.id, contactId, draft, { kind: 'auto-reply', ruleId: rule.id });
  return { ok: true, action: 'replied', draft, messageId: sent.messageId };
}
