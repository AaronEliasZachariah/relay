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

  // Optional until their phase — presence flips a feature from mock to live.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_VERTEX_PROJECT: z.string().optional(),
  GOOGLE_VERTEX_LOCATION: z.string().default('us-central1'),
});

export const env = schema.parse(process.env);

export const features = {
  /** Real SMS sending vs. the mock adapter. */
  twilio: Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM),
  /** Real AI generation vs. the deterministic mock. */
  ai: Boolean(env.ANTHROPIC_API_KEY || env.GOOGLE_VERTEX_PROJECT),
};
