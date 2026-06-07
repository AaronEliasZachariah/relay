/**
 * Provider webhooks (Twilio). Inbound messages drive the auto-reply pipeline;
 * status callbacks update delivery receipts. Form-encoded per Twilio.
 */
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import * as t from '../db/schema.js';
import { env } from '../lib/env.js';
import { handleInbound } from '../pipeline/autoReply.js';

export const webhooks = new Hono();

webhooks.post('/twilio/inbound', async (c) => {
  const form = await c.req.parseBody();
  await handleInbound({
    to: String(form.To ?? ''),
    from: String(form.From ?? ''),
    body: String(form.Body ?? ''),
  });
  // Empty TwiML — we reply out-of-band via the API, not in the webhook response.
  return c.text('<Response></Response>', 200, { 'Content-Type': 'text/xml' });
});

webhooks.post('/twilio/status', async (c) => {
  const form = await c.req.parseBody();
  const sid = String(form.MessageSid ?? '');
  const status = String(form.MessageStatus ?? '');
  if (sid) {
    await db
      .update(t.deliveries)
      .set({ status, updatedAt: new Date() })
      .where(eq(t.deliveries.providerId, sid));
  }
  return c.body(null, 204);
});

/**
 * RevenueCat billing webhook. RevenueCat handles the Apple/Google subscription
 * plumbing and posts an event here whenever a customer subscribes, renews or
 * lapses. `app_user_id` is the businessId we set when configuring Purchases.
 */
webhooks.post('/revenuecat', async (c) => {
  const expected = env.REVENUECAT_AUTH_HEADER;
  if (expected) {
    if (c.req.header('Authorization') !== expected) return c.json({ error: 'unauthorized' }, 401);
  } else if (env.NODE_ENV === 'production') {
    // Fail closed: never process unverified billing events in production.
    return c.json({ error: 'webhook_not_configured' }, 503);
  }
  const payload = (await c.req.json().catch(() => ({}))) as { event?: Record<string, string> };
  const ev = payload.event ?? {};
  const businessId = ev.app_user_id ?? ev.original_app_user_id;
  if (!businessId) return c.json({ ok: false }, 200);

  const GRANTS = ['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE'];
  const REVOKES = ['EXPIRATION']; // note: CANCELLATION keeps access until EXPIRATION
  const plan = GRANTS.includes(ev.type ?? '') ? 'pro' : REVOKES.includes(ev.type ?? '') ? 'free' : null;

  if (plan) await db.update(t.businesses).set({ plan }).where(eq(t.businesses.id, businessId));
  return c.json({ ok: true, plan });
});

/* WhatsApp Business Cloud API. Meta verifies the webhook with a GET challenge. */
webhooks.get('/whatsapp', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');
  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) return c.text(challenge ?? '');
  return c.text('forbidden', 403);
});

webhooks.post('/whatsapp', async (c) => {
  const payload = (await c.req.json().catch(() => ({}))) as {
    entry?: { changes?: { value?: { metadata?: { display_phone_number?: string }; messages?: { from?: string; text?: { body?: string } }[] } }[] }[];
  };
  const value = payload.entry?.[0]?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  if (msg) {
    await handleInbound({
      to: value?.metadata?.display_phone_number ?? '',
      from: '+' + (msg.from ?? '').replace(/^\+/, ''),
      body: msg.text?.body ?? '',
      channel: 'whatsapp',
    });
  }
  return c.json({ ok: true });
});
