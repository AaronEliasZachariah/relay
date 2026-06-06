/**
 * Messaging channel adapters. Picks the real provider when credentials exist,
 * else a mock that logs and "accepts" — so the whole pipeline runs locally with
 * no external account. (No SDKs: plain fetch to the Twilio / Meta REST APIs.)
 */
import { env, features } from '../lib/env.js';

type Channel = 'sms' | 'whatsapp';

export type SendResult = {
  providerId?: string;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
};

export interface MessagingAdapter {
  send(to: string, body: string): Promise<SendResult>;
}

function mockAdapter(label: string): MessagingAdapter {
  return {
    async send(to, body) {
      // eslint-disable-next-line no-console
      console.log(`  [mock-${label}] → ${to}: ${body.slice(0, 70)}${body.length > 70 ? '…' : ''}`);
      return { providerId: 'mock_' + crypto.randomUUID().slice(0, 8), status: 'sent' };
    },
  };
}

const twilioAdapter: MessagingAdapter = {
  async send(to, body) {
    const sid = env.TWILIO_ACCOUNT_SID!;
    const auth = Buffer.from(`${sid}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: env.TWILIO_FROM!, Body: body }),
    });
    if (!res.ok) return { status: 'failed', error: `twilio ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { sid?: string };
    return { providerId: data.sid, status: 'queued' };
  },
};

const whatsappAdapter: MessagingAdapter = {
  async send(to, body) {
    const res = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/^\+/, ''),
        type: 'text',
        text: { body },
      }),
    });
    if (!res.ok) return { status: 'failed', error: `whatsapp ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { messages?: { id?: string }[] };
    return { providerId: data.messages?.[0]?.id, status: 'queued' };
  },
};

/** The adapter for a channel — live when configured, otherwise the mock. */
export function getAdapter(channel: Channel): MessagingAdapter {
  if (channel === 'whatsapp') return features.whatsapp ? whatsappAdapter : mockAdapter('whatsapp');
  return features.twilio ? twilioAdapter : mockAdapter('sms');
}

/** GSM-7 segment count (160 / 153 multipart). */
export function smsSegments(body: string): number {
  const n = body.length;
  return n === 0 ? 0 : n <= 160 ? 1 : Math.ceil(n / 153);
}

const STOP_WORDS = ['stop', 'unsubscribe', 'cancel', 'end', 'quit'];
export function isOptOut(body: string): boolean {
  return STOP_WORDS.includes(body.trim().toLowerCase());
}
