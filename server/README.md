# Relay backend

The cloud messaging engine: sends scheduled campaigns, receives inbound texts,
and generates AI auto-replies. The app is a client to this service.

Runs fully **locally with mock adapters** — no Twilio/AI account needed to see
the whole pipeline work. Add credentials to flip each part to live (feature
flags in `src/lib/env.ts` switch mock↔live automatically).

## Run it

```bash
cd server
npm install
docker compose up -d      # local Postgres on :5432
npm run db:migrate        # create tables
npm run db:seed           # demo business "Halo Hair Studio"
npm run dev               # API + scheduler on http://localhost:8787
```

Health: `GET http://localhost:8787/health` → shows which integrations are live.

## Exercise the pipeline (dev-only endpoints)

> Enable first: set `ALLOW_DEV_ROUTES=true` in `.env` (off by default; never in production).

```bash
# Pull the full snapshot (what the app syncs)
curl localhost:8787/v1/sync

# Simulate a customer texting in → AI auto-reply
curl -X POST localhost:8787/v1/dev/inbound \
  -H 'content-type: application/json' \
  -d '{"from":"+14155550111","body":"Any openings Saturday?"}'

# STOP → contact opted out (never messaged again)
curl -X POST localhost:8787/v1/dev/inbound \
  -H 'content-type: application/json' -d '{"from":"+1999","body":"STOP"}'

# Run a campaign now: mark it due, then tick the scheduler
curl -X POST localhost:8787/v1/dev/campaigns/<id>/due-now
curl -X POST localhost:8787/v1/dev/run-due
```

## Go live

Set these in `server/.env` (copy `.env.example`):

| Variable | Enables |
|---|---|
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | Real SMS (mock → Twilio) |
| `ANTHROPIC_API_KEY` | Real AI replies (mock → Claude) |
| `DATABASE_URL` | Hosted Postgres (Supabase/Neon) |

Point Twilio's inbound + status webhooks at `/v1/webhooks/twilio/inbound` and
`/v1/webhooks/twilio/status`. For production scheduling, swap the dev
`setInterval` scheduler for a durable queue (pg-boss) — see
[../docs/DATA-PIPELINE.md](../docs/DATA-PIPELINE.md).

## Tests

```bash
npm test   # Vitest — unit + E2E against an in-process PGlite database
```

No Docker or running Postgres needed: the suite starts Postgres in-process,
migrates it, then exercises the API (`app.request`), Pro gating, the RevenueCat
webhook, and both pipelines (campaign scheduler + AI auto-reply).

## Layout

```
src/
  index.ts            # Hono app, route mounts, scheduler start
  lib/                # env (zod) + feature flags, tenant middleware, schedule math
  db/                 # Drizzle schema, client, migrate, seed
  routes/             # v1 (sync + commands), webhooks, dev
  services/           # messaging adapter, AI, sender
  pipeline/           # autoSend (campaigns), autoReply (inbound)
  scheduler.ts        # dev campaign tick
```
