import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { db } from '../../src/db/client.js';
import * as t from '../../src/db/schema.js';
import { resetDb, seedFixture } from '../helpers.js';

type Fixture = Awaited<ReturnType<typeof seedFixture>>;
const hdr = (id: string) => ({ 'content-type': 'application/json', 'x-business-id': id });

describe('API extras (E2E)', () => {
  let fx: Fixture;
  beforeEach(async () => {
    await resetDb();
    fx = await seedFixture('free');
  });

  it('upserts a knowledge doc and reflects it in sync', async () => {
    const res = await app.request('/v1/knowledge', {
      method: 'PUT', headers: hdr(fx.biz.id), body: JSON.stringify({ title: 'Hours', content: '9-5', enabled: true }),
    });
    expect(res.status).toBe(200);
    const sync = await (await app.request('/v1/sync', { headers: hdr(fx.biz.id) })).json();
    expect(sync.knowledge).toHaveLength(1);
    expect(sync.knowledge[0].title).toBe('Hours');
  });

  it('sends to a single contact', async () => {
    const res = await app.request('/v1/send', {
      method: 'POST', headers: hdr(fx.biz.id), body: JSON.stringify({ contactId: fx.contacts[0]!.id, body: 'hi' }),
    });
    expect((await res.json()).queued).toBe(1);
  });

  it('campaign gating: free allows 2, blocks the 3rd', async () => {
    const mk = (name: string) =>
      app.request('/v1/campaigns', {
        method: 'PUT', headers: hdr(fx.biz.id),
        body: JSON.stringify({
          name, target: { type: 'all' }, channel: 'sms', message: 'x',
          schedule: { kind: 'recurring', frequency: 'daily', hour: 9, minute: 0, startsAt: Date.now() }, enabled: true,
        }),
      });
    expect((await mk('a')).status).toBe(200);
    expect((await mk('b')).status).toBe(200);
    expect((await mk('c')).status).toBe(402);
  });

  it('RevenueCat EXPIRATION downgrades to free', async () => {
    await db.update(t.businesses).set({ plan: 'pro' }).where(eq(t.businesses.id, fx.biz.id));
    const res = await app.request('/v1/webhooks/revenuecat', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: { type: 'EXPIRATION', app_user_id: fx.biz.id } }),
    });
    expect((await res.json()).plan).toBe('free');
    const [b] = await db.select().from(t.businesses).where(eq(t.businesses.id, fx.biz.id));
    expect(b!.plan).toBe('free');
  });

  it('WhatsApp webhook verification echoes the challenge', async () => {
    const ok = await app.request('/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=relay-verify&hub.challenge=42');
    expect(ok.status).toBe(200);
    expect(await ok.text()).toBe('42');

    const bad = await app.request('/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=42');
    expect(bad.status).toBe(403);
  });
});
