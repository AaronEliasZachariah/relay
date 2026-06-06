/**
 * The one place a message goes out. Logs the message, calls the channel adapter,
 * records the delivery, and honors opt-outs + idempotency. Used by manual sends,
 * the campaign scheduler, and the auto-reply pipeline.
 */
import { and, eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import * as t from '../db/schema.js';
import { sms } from './messaging.js';

type Kind = 'auto-send' | 'auto-reply' | 'manual';

export type SendOutcome = {
  ok: boolean;
  reason?: string;
  deduped?: boolean;
  messageId?: string;
  status?: string;
};

export async function sendToContact(
  businessId: string,
  contactId: string,
  body: string,
  opts: { kind: Kind; campaignId?: string; ruleId?: string; channel?: 'sms' | 'whatsapp'; dedupeKey?: string },
): Promise<SendOutcome> {
  const [contact] = await db
    .select()
    .from(t.contacts)
    .where(and(eq(t.contacts.id, contactId), eq(t.contacts.businessId, businessId)));
  if (!contact) return { ok: false, reason: 'no_contact' };
  if (contact.optedOut) return { ok: false, reason: 'opted_out' };

  // Idempotency — never double-send the same campaign slot to the same contact.
  if (opts.dedupeKey) {
    const [existing] = await db
      .select({ id: t.messages.id })
      .from(t.messages)
      .where(eq(t.messages.dedupeKey, opts.dedupeKey));
    if (existing) return { ok: true, deduped: true, messageId: existing.id };
  }

  const [msg] = await db
    .insert(t.messages)
    .values({
      businessId,
      contactId,
      direction: 'outbound',
      kind: opts.kind,
      channel: opts.channel ?? 'sms',
      body,
      status: 'pending',
      campaignId: opts.campaignId ?? null,
      ruleId: opts.ruleId ?? null,
      dedupeKey: opts.dedupeKey ?? null,
    })
    .returning();

  const res = await sms.send(contact.phoneE164, body);
  const status = res.status === 'failed' ? 'failed' : 'sent';

  await db.update(t.messages).set({ status }).where(eq(t.messages.id, msg!.id));
  await db.insert(t.deliveries).values({
    messageId: msg!.id,
    providerId: res.providerId ?? null,
    status: res.status,
    error: res.error ?? null,
  });

  return { ok: status !== 'failed', messageId: msg!.id, status };
}
