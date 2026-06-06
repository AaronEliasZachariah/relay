/**
 * Messaging channel adapter. Uses the real Twilio REST API when credentials are
 * present, otherwise a mock that logs and "accepts" — so the whole pipeline runs
 * locally with no external account. (No SDK dependency: plain fetch.)
 */
import { env, features } from '../lib/env.js';

export type SendResult = {
  providerId?: string;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
};

export interface MessagingAdapter {
  send(to: string, body: string): Promise<SendResult>;
}

const mockAdapter: MessagingAdapter = {
  async send(to, body) {
    // eslint-disable-next-line no-console
    console.log(`  [mock-sms] → ${to}: ${body.slice(0, 70)}${body.length > 70 ? '…' : ''}`);
    return { providerId: 'mock_' + crypto.randomUUID().slice(0, 8), status: 'sent' };
  },
};

const twilioAdapter: MessagingAdapter = {
  async send(to, body) {
    const sid = env.TWILIO_ACCOUNT_SID!;
    const auth = Buffer.from(`${sid}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: env.TWILIO_FROM!, Body: body }),
    });
    if (!res.ok) return { status: 'failed', error: `twilio ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { sid?: string };
    return { providerId: data.sid, status: 'queued' };
  },
};

export const sms: MessagingAdapter = features.twilio ? twilioAdapter : mockAdapter;

/** GSM-7 segment count (160 / 153 multipart). */
export function smsSegments(body: string): number {
  const n = body.length;
  return n === 0 ? 0 : n <= 160 ? 1 : Math.ceil(n / 153);
}

const STOP_WORDS = ['stop', 'unsubscribe', 'cancel', 'end', 'quit'];
export function isOptOut(body: string): boolean {
  return STOP_WORDS.includes(body.trim().toLowerCase());
}
