import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { db } from '../../src/db/client.js';
import * as t from '../../src/db/schema.js';
import { resetDb, seedFixture } from '../helpers.js';

type Fixture = Awaited<ReturnType<typeof seedFixture>>;

const hdr = (bizId: string) => ({ 'content-type': 'application/json', 'x-business-id': bizId });

describe('HTTP API (E2E)', () => {
  let fx: Fixture;
  beforeEach(async () => {
    await resetDb();
    fx = await seedFixture('free');
  });

  it('GET /health is ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('GET /v1/sync returns the tenant snapshot', async () => {
    const res = await app.request('/v1/sync', { headers: hdr(fx.biz.id) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.business.plan).toBe('free');
    expect(data.contacts).toHaveLength(2);
    expect(data.groups).toHaveLength(1);
    expect(data.groups[0].contactIds).toHaveLength(2);
  });

  it('enforces Pro gating (free blocks over limit; Pro allows)', async () => {
    // Free rule limit is 1 — seed one so the next create is over the cap.
    await db.insert(t.replyRules).values({
      businessId: fx.biz.id, name: 'r1', target: { type: 'all' }, instruction: 'x', tone: 'friendly',
    });
    const body = JSON.stringify({ name: 'r2', target: { type: 'all' }, instruction: 'y', tone: 'friendly' });

    const blocked = await app.request('/v1/rules', { method: 'PUT', headers: hdr(fx.biz.id), body });
    expect(blocked.status).toBe(402);

    await db.update(t.businesses).set({ plan: 'pro' }).where(eq(t.businesses.id, fx.biz.id));
    const allowed = await app.request('/v1/rules', { method: 'PUT', headers: hdr(fx.biz.id), body });
    expect(allowed.status).toBe(200);
  });

  it('upserts a campaign and reflects updates in sync', async () => {
    const payload = {
      name: 'Promo', target: { type: 'group', groupId: fx.group.id }, channel: 'sms', message: 'Hi {name}',
      schedule: { kind: 'recurring', frequency: 'daily', hour: 9, minute: 0, startsAt: Date.now() }, enabled: true,
    };
    const created = await app.request('/v1/campaigns', { method: 'PUT', headers: hdr(fx.biz.id), body: JSON.stringify(payload) });
    expect(created.status).toBe(200);
    const { id } = await created.json();

    const updated = await app.request('/v1/campaigns', {
      method: 'PUT', headers: hdr(fx.biz.id), body: JSON.stringify({ ...payload, id, enabled: false }),
    });
    expect(updated.status).toBe(200);

    const sync = await (await app.request('/v1/sync', { headers: hdr(fx.biz.id) })).json();
    expect(sync.campaigns).toHaveLength(1);
    expect(sync.campaigns[0].enabled).toBe(false);
  });

  it('RevenueCat webhook flips the plan to pro', async () => {
    const res = await app.request('/v1/webhooks/revenuecat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: { type: 'INITIAL_PURCHASE', app_user_id: fx.biz.id } }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).plan).toBe('pro');
    const [b] = await db.select().from(t.businesses).where(eq(t.businesses.id, fx.biz.id));
    expect(b!.plan).toBe('pro');
  });

  it('POST /v1/send queues a message per group member', async () => {
    const res = await app.request('/v1/send', {
      method: 'POST', headers: hdr(fx.biz.id), body: JSON.stringify({ groupId: fx.group.id, body: 'hello' }),
    });
    expect((await res.json()).queued).toBe(2);
    const msgs = await db.select().from(t.messages).where(eq(t.messages.businessId, fx.biz.id));
    expect(msgs).toHaveLength(2);
  });

  it('approves an awaiting-approval draft', async () => {
    const [m] = await db
      .insert(t.messages)
      .values({
        businessId: fx.biz.id, contactId: fx.contacts[0]!.id, direction: 'outbound', kind: 'auto-reply',
        channel: 'sms', body: 'draft', status: 'awaiting-approval',
      })
      .returning();
    const res = await app.request(`/v1/activity/${m!.id}/approve`, { method: 'POST', headers: hdr(fx.biz.id) });
    expect(res.status).toBe(204);
    const [after] = await db.select().from(t.messages).where(eq(t.messages.id, m!.id));
    expect(after!.status).toBe('sent');
  });

  it('isolates tenants (other business cannot see data)', async () => {
    const [other] = await db.insert(t.businesses).values({ name: 'Other', category: 'X', defaultChannel: 'sms' }).returning();
    const sync = await (await app.request('/v1/sync', { headers: hdr(other!.id) })).json();
    expect(sync.contacts).toHaveLength(0);
    expect(sync.groups).toHaveLength(0);
  });
});
