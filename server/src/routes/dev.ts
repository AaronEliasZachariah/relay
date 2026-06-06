/**
 * Dev-only helpers to exercise the pipeline without a real carrier. Disabled in
 * production.
 */
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import * as t from '../db/schema.js';
import { env } from '../lib/env.js';
import { tenant } from '../lib/tenant.js';
import { handleInbound } from '../pipeline/autoReply.js';
import { runDueCampaigns } from '../pipeline/autoSend.js';

export const dev = new Hono();

dev.use('*', async (c, next) => {
  if (env.NODE_ENV === 'production') return c.json({ error: 'disabled_in_production' }, 403);
  await next();
});

/** Simulate an inbound customer text → drives the auto-reply pipeline. */
dev.post('/inbound', tenant, async (c) => {
  const businessId = c.get('businessId');
  const { from, body } = await c.req.json();
  const [biz] = await db.select().from(t.businesses).where(eq(t.businesses.id, businessId));
  const result = await handleInbound({ to: biz?.sendingNumber ?? '', from, body });
  return c.json(result);
});

/** Run the campaign scheduler tick immediately. */
dev.post('/run-due', async (c) => {
  const processed = await runDueCampaigns();
  return c.json({ processed });
});

/** Mark a campaign due right now (to test the scheduler without waiting). */
dev.post('/campaigns/:id/due-now', tenant, async (c) => {
  const businessId = c.get('businessId');
  await db
    .update(t.campaigns)
    .set({ nextRunAt: new Date(Date.now() - 1000) })
    .where(and(eq(t.campaigns.id, c.req.param('id')), eq(t.campaigns.businessId, businessId)));
  return c.json({ ok: true });
});
