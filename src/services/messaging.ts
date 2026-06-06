/**
 * Messaging channel abstraction.
 *
 * Sending/receiving is server-side (a Relay backend talks to Twilio for SMS or
 * the WhatsApp Business Cloud API). That's what makes Relay work identically on
 * iOS and Android — Apple blocks on-device SMS automation, so the device is
 * only ever a client. Adapters below describe the server contract; the app
 * itself never holds provider credentials.
 */

import type { Channel } from '@/data/types';

export type SendRequest = {
  to: string; // E.164
  body: string;
  channel: Channel;
  /** Idempotency key so retries don't double-send. */
  clientRef?: string;
};

export type SendResult = {
  providerId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  error?: string;
};

/** Implemented once per provider on the server. */
export interface MessagingAdapter {
  readonly channel: Channel;
  send(req: SendRequest): Promise<SendResult>;
  /** Normalize a provider delivery/inbound webhook into our shape. */
  parseWebhook(payload: unknown): InboundEvent | DeliveryEvent | null;
}

export type InboundEvent = { type: 'inbound'; from: string; body: string; channel: Channel };
export type DeliveryEvent = {
  type: 'delivery';
  providerId: string;
  status: SendResult['status'];
};

/** GSM-7 segment count for cost/preview (160 / 153 for multipart). */
export function smsSegments(body: string): number {
  const len = body.length;
  if (len === 0) return 0;
  return len <= 160 ? 1 : Math.ceil(len / 153);
}

/**
 * Honor STOP/UNSUBSCRIBE inbound keywords (TCPA / carrier compliance). The
 * backend flags the contact opted-out; the app must never message them again.
 */
const STOP_WORDS = ['stop', 'unsubscribe', 'cancel', 'end', 'quit'];
export function isOptOut(body: string): boolean {
  return STOP_WORDS.includes(body.trim().toLowerCase());
}
