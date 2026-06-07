import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { db } from '../../src/db/client.js';
import * as t from '../../src/db/schema.js';
import { resetDb, seedFixture } from '../helpers.js';

const hdr = (id: string) => ({ 'content-type': 'application/json', 'x-business-id': id });

const campaign = (over: Record<string, unknown> = {}) => ({
  name: 'Camp', target: { type: 'all' }, channel: 'sms', message: 'hi',
  schedule: { kind: 'recurring', frequency: 'daily', hour: 9, minute: 0, startsAt: Date.now() },
  enabled: true, ...over,
});

describe('security', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('blocks cross-tenant writes (IDOR)', async () => {
    const a = await seedFixture('pro');
    const b = await seedFixture('pro');

    const created = await app.request('/v1/campaigns', { method: 'PUT', headers: hdr(a.biz.id), body: JSON.stringify(campaign({ name: 'A camp' })) });
    const { id } = await created.json();

    // B tries to overwrite A's campaign by its id.
    const attack = await app.request('/v1/campaigns', { method: 'PUT', headers: hdr(b.biz.id), body: JSON.stringify(campaign({ id, name: 'HACKED', message: 'pwned' })) });
    expect(attack.status).toBe(404);

    const [camp] = await db.select().from(t.campaigns).where(eq(t.campaigns.id, id));
    expect(camp!.name).toBe('A camp');
    expect(camp!.businessId).toBe(a.biz.id);
  });

  it('rejects missing or oversized input (400)', async () => {
    const fx = await seedFixture('pro');
    const missing = await app.request('/v1/campaigns', { method: 'PUT', headers: hdr(fx.biz.id), body: JSON.stringify({ name: 'x', target: { type: 'all' } }) });
    expect(missing.status).toBe(400);
    const huge = await app.request('/v1/campaigns', { method: 'PUT', headers: hdr(fx.biz.id), body: JSON.stringify(campaign({ message: 'a'.repeat(5000) })) });
    expect(huge.status).toBe(400);
  });

  it('rejects an empty send body (400)', async () => {
    const fx = await seedFixture('pro');
    const res = await app.request('/v1/send', { method: 'POST', headers: hdr(fx.biz.id), body: JSON.stringify({ contactId: fx.contacts[0]!.id, body: '' }) });
    expect(res.status).toBe(400);
  });

  it('disables dev routes unless explicitly enabled', async () => {
    await seedFixture();
    const res = await app.request('/v1/dev/run-due', { method: 'POST' });
    expect(res.status).toBe(403);
  });
});
