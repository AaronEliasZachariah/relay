import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '../../src/db/client.js';
import * as t from '../../src/db/schema.js';
import { handleInbound } from '../../src/pipeline/autoReply.js';
import { runDueCampaigns } from '../../src/pipeline/autoSend.js';
import { resetDb, seedFixture } from '../helpers.js';

type Fixture = Awaited<ReturnType<typeof seedFixture>>;

const ALL_CLOSED = {
  mon: { open: '00:00', close: '00:00', closed: true },
  tue: { open: '00:00', close: '00:00', closed: true },
  wed: { open: '00:00', close: '00:00', closed: true },
  thu: { open: '00:00', close: '00:00', closed: true },
  fri: { open: '00:00', close: '00:00', closed: true },
  sat: { open: '00:00', close: '00:00', closed: true },
  sun: { open: '00:00', close: '00:00', closed: true },
};

describe('Auto-reply pipeline (E2E)', () => {
  let fx: Fixture;
  beforeEach(async () => {
    await resetDb();
    fx = await seedFixture('free');
  });

  const addRule = (extra: Record<string, unknown> = {}) =>
    db.insert(t.replyRules).values({
      businessId: fx.biz.id, name: 'rule', target: { type: 'all' }, instruction: 'Help the customer',
      tone: 'friendly', enabled: true, ...extra,
    });

  it('STOP opts the contact out and does not reply', async () => {
    await addRule();
    const r = await handleInbound({ to: fx.biz.sendingNumber!, from: fx.contacts[0]!.phoneE164, body: 'STOP' });
    expect(r.action).toBe('opted_out');
    const [c] = await db.select().from(t.contacts).where(eq(t.contacts.id, fx.contacts[0]!.id));
    expect(c!.optedOut).toBe(true);
    const outbound = await db
      .select()
      .from(t.messages)
      .where(and(eq(t.messages.contactId, fx.contacts[0]!.id), eq(t.messages.direction, 'outbound')));
    expect(outbound).toHaveLength(0);
  });

  it('matches a rule and replies, logging both messages', async () => {
    await addRule();
    const r = await handleInbound({ to: fx.biz.sendingNumber!, from: fx.contacts[0]!.phoneE164, body: 'Any openings?' });
    expect(r.action).toBe('replied');
    expect(r.draft).toBeTruthy();
    const msgs = await db.select().from(t.messages).where(eq(t.messages.contactId, fx.contacts[0]!.id));
    expect(msgs.some((m) => m.direction === 'inbound')).toBe(true);
    expect(msgs.some((m) => m.direction === 'outbound' && m.kind === 'auto-reply' && m.status === 'sent')).toBe(true);
  });

  it('parks for approval when the rule requires it', async () => {
    await addRule({ requireApproval: true });
    const r = await handleInbound({ to: fx.biz.sendingNumber!, from: fx.contacts[0]!.phoneE164, body: 'q' });
    expect(r.action).toBe('awaiting_approval');
    const drafts = await db.select().from(t.messages).where(eq(t.messages.status, 'awaiting-approval'));
    expect(drafts).toHaveLength(1);
  });

  it('sends the after-hours message outside business hours', async () => {
    await db.update(t.businesses).set({ hours: ALL_CLOSED }).where(eq(t.businesses.id, fx.biz.id));
    await addRule({ businessHoursOnly: true, afterHoursMessage: 'We are closed right now' });
    const r = await handleInbound({ to: fx.biz.sendingNumber!, from: fx.contacts[0]!.phoneE164, body: 'hi' });
    expect(r.action).toBe('after_hours');
    const [out] = await db
      .select()
      .from(t.messages)
      .where(and(eq(t.messages.contactId, fx.contacts[0]!.id), eq(t.messages.direction, 'outbound')));
    expect(out!.body).toBe('We are closed right now');
  });

  it('replies on the WhatsApp channel when inbound is WhatsApp', async () => {
    await addRule();
    const r = await handleInbound({
      to: fx.biz.sendingNumber!, from: fx.contacts[0]!.phoneE164, body: 'hi', channel: 'whatsapp',
    });
    expect(r.action).toBe('replied');
    const [out] = await db
      .select()
      .from(t.messages)
      .where(and(eq(t.messages.direction, 'outbound'), eq(t.messages.kind, 'auto-reply')));
    expect(out!.channel).toBe('whatsapp');
  });

  it('does nothing when no rule matches', async () => {
    const r = await handleInbound({ to: fx.biz.sendingNumber!, from: fx.contacts[0]!.phoneE164, body: 'hi' });
    expect(r.action).toBe('no_rule');
  });
});

describe('Auto-send scheduler (E2E)', () => {
  let fx: Fixture;
  beforeEach(async () => {
    await resetDb();
    fx = await seedFixture('free');
  });

  const addDueCampaign = () =>
    db.insert(t.campaigns).values({
      businessId: fx.biz.id, name: 'VIP', target: { type: 'group', groupId: fx.group.id }, channel: 'sms',
      message: 'Hi {name}, treat yourself',
      schedule: { kind: 'recurring', frequency: 'weekly', weekdays: [0, 1, 2, 3, 4, 5, 6], hour: 9, minute: 0, startsAt: Date.now() - 1000 },
      enabled: true, nextRunAt: new Date(Date.now() - 1000),
    });

  it('sends to the audience, renders merge tags, and is idempotent', async () => {
    await addDueCampaign();
    const sent1 = await runDueCampaigns();
    expect(sent1).toBe(2);

    const msgs = await db.select().from(t.messages).where(eq(t.messages.kind, 'auto-send'));
    expect(msgs).toHaveLength(2);
    expect(msgs.some((m) => m.body.startsWith('Hi Alice'))).toBe(true);

    // Next run advanced into the future → a second tick sends nothing.
    const sent2 = await runDueCampaigns();
    expect(sent2).toBe(0);
    const [c] = await db.select().from(t.campaigns).where(eq(t.campaigns.businessId, fx.biz.id));
    expect(c!.nextRunAt).toBeTruthy();
    expect(new Date(c!.nextRunAt as unknown as string).getTime()).toBeGreaterThan(Date.now());
  });

  it('skips opted-out contacts', async () => {
    await db.update(t.contacts).set({ optedOut: true }).where(eq(t.contacts.id, fx.contacts[0]!.id));
    await addDueCampaign();
    const sent = await runDueCampaigns();
    expect(sent).toBe(1);
  });
});
