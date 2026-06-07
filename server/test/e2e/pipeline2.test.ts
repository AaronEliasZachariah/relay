import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '../../src/db/client.js';
import * as t from '../../src/db/schema.js';
import { handleInbound } from '../../src/pipeline/autoReply.js';
import { runDueCampaigns } from '../../src/pipeline/autoSend.js';
import { resetDb, seedFixture } from '../helpers.js';

type Fixture = Awaited<ReturnType<typeof seedFixture>>;

describe('pipeline extras (E2E)', () => {
  let fx: Fixture;
  beforeEach(async () => {
    await resetDb();
    fx = await seedFixture('free');
  });

  it('never double-sends the same campaign slot (idempotency key)', async () => {
    const [c] = await db
      .insert(t.campaigns)
      .values({
        businessId: fx.biz.id, name: 'c', target: { type: 'group', groupId: fx.group.id }, channel: 'sms',
        message: 'Hi', schedule: { kind: 'recurring', frequency: 'daily', hour: 9, minute: 0, startsAt: Date.now() - 1000 },
        enabled: true, nextRunAt: new Date(Date.now() - 1000),
      })
      .returning();

    expect(await runDueCampaigns()).toBe(2);

    // Force the SAME slot due again → dedupe key blocks the re-send.
    await db.update(t.campaigns).set({ nextRunAt: c!.nextRunAt }).where(eq(t.campaigns.id, c!.id));
    expect(await runDueCampaigns()).toBe(0);

    const msgs = await db.select().from(t.messages).where(eq(t.messages.kind, 'auto-send'));
    expect(msgs).toHaveLength(2);
  });

  it('skips inbound from an already opted-out contact', async () => {
    await db.insert(t.replyRules).values({
      businessId: fx.biz.id, name: 'all', target: { type: 'all' }, instruction: 'x', tone: 'friendly', enabled: true,
    });
    await db.update(t.contacts).set({ optedOut: true }).where(eq(t.contacts.id, fx.contacts[0]!.id));
    const r = await handleInbound({ to: fx.biz.sendingNumber!, from: fx.contacts[0]!.phoneE164, body: 'hi' });
    expect(r.action).toBe('skipped_opted_out');
  });

  it('a disabled rule does not reply', async () => {
    await db.insert(t.replyRules).values({
      businessId: fx.biz.id, name: 'all', target: { type: 'all' }, instruction: 'x', tone: 'friendly', enabled: false,
    });
    const r = await handleInbound({ to: fx.biz.sendingNumber!, from: fx.contacts[1]!.phoneE164, body: 'hi' });
    expect(r.action).toBe('no_rule');
  });
});
