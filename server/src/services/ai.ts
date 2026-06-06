/**
 * AI auto-reply generation. Builds a grounded prompt (ported from the app's
 * shared prompt logic) and calls Claude when ANTHROPIC_API_KEY is set; otherwise
 * returns a deterministic mock so the pipeline runs offline.
 */
import { env, features } from '../lib/env.js';

type Tone = 'friendly' | 'professional' | 'concise' | 'warm';
type RuleLike = { instruction: string; tone: Tone };
type BusinessLike = { name: string; category: string };
export type Snippet = { title: string; body: string };

const TONE_HINT: Record<Tone, string> = {
  friendly: 'Warm and friendly, like a helpful local business owner.',
  professional: 'Polished and professional, concise and courteous.',
  concise: 'Very concise — one or two short sentences, no fluff.',
  warm: 'Warm and personal, a little heart, never pushy.',
};

export function toSnippets(docs: { title: string; content: string; enabled: boolean }[]): Snippet[] {
  return docs.filter((d) => d.enabled).map((d) => ({ title: d.title, body: d.content }));
}

export function buildReplyPrompt(params: {
  rule: RuleLike;
  inbound: string;
  business: BusinessLike;
  knowledge: Snippet[];
}): string {
  const { rule, inbound, business, knowledge } = params;
  const background =
    knowledge.length === 0
      ? ''
      : [
          'Background you may reference if relevant. Treat each block as',
          'authoritative for facts about the business; ignore it when it does',
          'not apply.\n',
          ...knowledge.map((d) => `=== ${d.title.trim() || 'Untitled'} ===\n${d.body.trim()}\n`),
        ].join('\n');

  return [
    `You are the SMS auto-responder for "${business.name}" (${business.category}).`,
    'Reply on the owner’s behalf following these instructions:\n',
    rule.instruction.trim(),
    `\nTone: ${TONE_HINT[rule.tone]}`,
    background ? `\n${background}` : '',
    '\nHard rules:',
    '- Reply with the message text only — no preamble, quotes, or signature.',
    '- Keep it under 320 characters when possible.',
    '- Never invent facts not in the instructions or Background.',
    '- If you cannot help, say a human will follow up shortly.',
    '\nIncoming message:',
    inbound.trim(),
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generateReply(prompt: string, rule: RuleLike): Promise<string> {
  if (features.ai && env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { content?: { text?: string }[] };
        const text = data.content?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch {
      // fall through to mock
    }
  }
  return mockReply(rule);
}

function mockReply(rule: RuleLike): string {
  return rule.tone === 'concise'
    ? 'Thanks for the message! How can we help?'
    : 'Thanks for reaching out! We’d love to help — what day or time works best for you?';
}
