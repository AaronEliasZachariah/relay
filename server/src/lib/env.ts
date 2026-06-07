import { z } from 'zod';

// Node 22 can read a .env file natively — no dotenv dependency needed.
try {
  process.loadEnvFile?.();
} catch {
  // No .env file present (e.g. in production where vars are injected) — fine.
}

const schema = z.object({
  PORT: z.coerce.number().default(8787),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgres://relay:relay@localhost:5432/relay'),
  JWT_SECRET: z.string().default('dev-only-change-me'),
  /** Dev-only HTTP helpers under /v1/dev are active only when this is 'true'. */
  ALLOW_DEV_ROUTES: z.string().optional(),

  // Optional until their phase — presence flips a feature from mock to live.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_VERTEX_PROJECT: z.string().optional(),
  GOOGLE_VERTEX_LOCATION: z.string().default('us-central1'),

  // WhatsApp Business Cloud API (Phase 7)
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().default('relay-verify'),

  // RevenueCat billing webhook (Phase 6)
  REVENUECAT_AUTH_HEADER: z.string().optional(),
});

export const env = schema.parse(process.env);

export const features = {
  /** Real SMS sending vs. the mock adapter. */
  twilio: Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM),
  /** Real WhatsApp sending vs. the mock adapter. */
  whatsapp: Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID),
  /** Real AI generation vs. the deterministic mock. */
  ai: Boolean(env.ANTHROPIC_API_KEY || env.GOOGLE_VERTEX_PROJECT),
  /** Billing webhook authentication configured. */
  billing: Boolean(env.REVENUECAT_AUTH_HEADER),
};
