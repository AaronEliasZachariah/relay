# Relay — Security Review

Audit of the Relay app + backend. Honest posture: **Relay is pre-production
(mock-first).** Nothing here is exploited in the wild, but several items **must**
be addressed before deploying with real customer data. This pass fixed the
contained issues and documents the rest with guidance.

## Summary

| # | Finding | Severity | Status |
|---|---|---|---|
| C1 | No real authentication — tenant derived from a client header | **Critical** | ⚠️ Open (needs auth) |
| H1 | Forgeable provider webhooks (no signature verification) | **High** | ◑ Partial |
| H2 | Cross-tenant write (IDOR) on upserts | **High** | ✅ Fixed |
| M1 | No request input validation / size limits | Medium | ✅ Fixed (basic) |
| M2 | No rate limiting / AI-cost controls | Medium | ⚠️ Open |
| M3 | Dev endpoints exposed by env alone | Medium | ✅ Fixed |
| M4 | AI prompt injection | Medium | ◑ Mitigated |
| M5 | DB row-level security not implemented (docs claim it) | Medium | ⚠️ Open |
| L1 | PII in logs | Low | ✅ Fixed |
| L2 | Container ran as root | Low | ✅ Fixed |
| L3 | Weak default `JWT_SECRET` | Low | ⚠️ Open (latent) |
| L4 | Dependency vulns (build-time) | Low | ◐ Monitor |
| L5 | App data at rest unencrypted (AsyncStorage) | Low | ◐ Accepted |

✅ **Good news:** no secrets are committed (only `.env.example` placeholders;
`.env` is gitignored), all DB access uses parameterized queries (Drizzle → no SQL
injection), provider keys live only on the server, opt-out/STOP is honored, and
Pro limits are enforced server-side.

---

## Must fix before production

### C1 — Authentication is a placeholder (Critical)
`server/src/lib/tenant.ts` resolves the tenant from an `x-business-id` **request
header**, falling back to the first business. **Any caller can read or write any
tenant's data.** This is intentional for local dev but is the #1 blocker.

**Fix:** issue a signed session (JWT via Supabase Auth / Clerk, or your own),
verify it in the `tenant` middleware, and set `businessId` **only** from verified
claims — never from a client-supplied header. The rest of the API is already
tenant-scoped, so this is a drop-in change.

### H1 — Provider webhooks aren't verified (High)
- **Twilio** (`/v1/webhooks/twilio/*`): no `X-Twilio-Signature` check → anyone can
  forge inbound texts (triggering AI replies / opt-outs) or delivery statuses.
- **WhatsApp** (`/v1/webhooks/whatsapp`): no `X-Hub-Signature-256` (Meta app-secret
  HMAC) check.
- **RevenueCat** (`/v1/webhooks/revenuecat`): **fixed to fail closed in
  production** (rejects if the auth header isn't configured/matched), so nobody
  can forge a "you're Pro now" event.

**Fix (Twilio/WhatsApp):** validate the signature header (HMAC-SHA1 over URL+params
for Twilio; HMAC-SHA256 over the raw body for Meta) using the auth token / app
secret before processing. Reject on mismatch.

### M2 — No rate limiting (Medium)
No throttling on the API or on AI generation. A flood of `/v1/send` or
(forged/looping) inbound webhooks could rack up SMS/AI cost and spam customers.
**Fix:** per-tenant + per-IP rate limits (e.g. a Hono middleware) and a per-tenant
daily AI/send budget cap.

### M5 — Defense-in-depth: enable Postgres RLS (Medium)
`docs/ARCHITECTURE.md` mentions row-level security, but the schema doesn't enable
it — isolation is purely the app's `WHERE business_id = ?` clauses. One missing
clause = a cross-tenant leak. **Fix:** enable RLS on every tenant table with a
`business_id = current_setting('app.business_id')` policy, set per request.

---

## Fixed in this pass

- **H2 — Cross-tenant write (IDOR):** `PUT /v1/campaigns|rules|knowledge` used
  `onConflictDoUpdate` keyed only on `id`, so a tenant could overwrite another
  tenant's row by supplying its UUID. Now every upsert checks the existing row's
  owner and returns `404` if it isn't yours. (Covered by `test/e2e/security.test.ts`.)
- **M1 — Input validation:** all write/send endpoints now reject missing/wrong-type
  fields and enforce length caps (name 200, message/instruction 2 000, knowledge
  50 000, send body 2 000) → blocks malformed payloads and oversized-prompt abuse.
  Inbound webhook bodies are capped before reaching the AI.
- **M3 — Dev endpoints:** `/v1/dev/*` are now off by default — they require
  `ALLOW_DEV_ROUTES=true` **and** a non-production `NODE_ENV` (was: on whenever not
  production, which is unsafe if `NODE_ENV` is misconfigured).
- **M4 — Prompt injection (mitigation):** inbound length cap + existing hard rules
  ("reply with message text only; never invent facts"); knowledge is the only
  injected context and no secrets are in the prompt.
- **L1 — PII logging:** the messaging adapter no longer logs phone numbers or
  message bodies (masked to last 4 digits + length).
- **L2 — Container hardening:** the Docker image now runs as the unprivileged
  `node` user.

---

## Lower priority / notes

- **L3 — `JWT_SECRET`** defaults to `dev-only-change-me`. When you implement auth,
  make the server refuse to boot in production if it's unset/default.
- **L4 — Dependencies:** `npm audit` shows build-time only issues — server: 5 in
  `drizzle-kit`→esbuild (migration tooling, not in the runtime image); app: 11
  moderate in Expo build tooling. None are in the request path. Keep updated.
- **L5 — At rest:** the app stores data in AsyncStorage (unencrypted, device-local).
  Use `expo-secure-store` for any auth token; rely on the managed DB's
  encryption-at-rest for server data.
- **Transport/headers:** terminate TLS at the platform; add CORS allowlist + basic
  security headers if a web client is introduced (not needed for the native app).

---

## Pre-production checklist
- [ ] Real auth; `businessId` from verified claims only (C1)
- [ ] Twilio + WhatsApp webhook signature verification (H1)
- [ ] Rate limiting + per-tenant AI/send budget (M2)
- [ ] Postgres RLS on tenant tables (M5)
- [ ] `JWT_SECRET` (and all secrets) set via the platform; boot-fail on default (L3)
- [ ] A2P 10DLC registration; opt-out audit (compliance)
- [ ] `npm audit` clean / accepted; dependency update cadence
