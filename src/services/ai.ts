/**
 * AI auto-reply — prompt construction + result types.
 *
 * Generation runs SERVER-SIDE (model keys never ship in the app). The backend
 * calls this `buildReplyPrompt` with the matched rule, the inbound message, the
 * business profile and the enabled knowledge docs, sends it to the model
 * (Gemini on Vertex AI or Claude), then returns an `AiReplyResult` the client
 * renders in Activity. This module is shared so the contract stays in one place;
 * `mockGenerateReply` lets the app demo the flow without a backend.
 *
 * Ported and adapted from the original Android AiReplyGenerator.
 */

import type { AutoReplyRule, BusinessProfile, KnowledgeDoc, ReplyTone } from '@/data/types';

export type AiReplyResult =
  | { kind: 'reply'; text: string }
  | { kind: 'needs-approval'; text: string }
  | { kind: 'after-hours'; text: string }
  | { kind: 'blocked'; reason: string }
  | { kind: 'skipped'; reason: string };

export type ContextSnippet = { title: string; body: string };

const TONE_HINT: Record<ReplyTone, string> = {
  friendly: 'Warm and friendly, like a helpful local business owner.',
  professional: 'Polished and professional, concise and courteous.',
  concise: 'Very concise — one or two short sentences, no fluff.',
  warm: 'Warm and personal, a little heart, never pushy.',
};

/** Knowledge docs → labelled "Background" snippets the model may ground in. */
export function toSnippets(docs: KnowledgeDoc[]): ContextSnippet[] {
  return docs.filter((d) => d.enabled).map((d) => ({ title: d.title, body: d.content }));
}

/**
 * Builds the full prompt. The per-rule instruction and tone are folded into the
 * user turn (consistent across model versions), with knowledge as an
 * authoritative-but-optional "Background" block and hard rules to keep replies
 * SMS-appropriate and grounded.
 */
export function buildReplyPrompt(params: {
  rule: AutoReplyRule;
  inbound: string;
  business: BusinessProfile;
  knowledge: ContextSnippet[];
}): string {
  const { rule, inbound, business, knowledge } = params;

  const background =
    knowledge.length === 0
      ? ''
      : [
          'Background you may reference if relevant. Treat each block as',
          'authoritative for facts about the business; ignore it when it does',
          'not apply to this message.\n',
          ...knowledge.map((d) => `=== ${d.title.trim() || 'Untitled'} ===\n${d.body.trim()}\n`),
        ].join('\n');

  return [
    `You are the SMS auto-responder for "${business.name}" (${business.category}).`,
    'Reply on the business owner’s behalf following these instructions:\n',
    rule.instruction.trim(),
    `\nTone: ${TONE_HINT[rule.tone]}`,
    background ? `\n${background}` : '',
    '\nHard rules:',
    '- Reply with the message text only — no preamble, quotes, or signature.',
    '- Keep it under 320 characters when possible.',
    '- Never invent facts that are not in the instructions or Background.',
    '- If you cannot help, say a human will follow up shortly.',
    '\nIncoming message:',
    inbound.trim(),
  ]
    .filter(Boolean)
    .join('\n');
}

/** Deterministic stand-in so the demo can show drafts without a backend call. */
export function mockGenerateReply(params: {
  rule: AutoReplyRule;
  inbound: string;
  business: BusinessProfile;
}): AiReplyResult {
  const { rule } = params;
  const text = `Thanks for reaching out to ${params.business.name}! ${
    rule.tone === 'concise' ? 'How can we help?' : 'We’d love to help — what works best for you?'
  }`;
  if (rule.requireApproval) return { kind: 'needs-approval', text };
  return { kind: 'reply', text };
}
