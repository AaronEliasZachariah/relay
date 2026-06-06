/**
 * Provider webhooks (Twilio). Inbound messages drive the auto-reply pipeline;
 * status callbacks update delivery receipts. Form-encoded per Twilio.
 */
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import * as t from '../db/schema.js';
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
