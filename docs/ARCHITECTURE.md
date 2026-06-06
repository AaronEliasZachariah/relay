# Relay — Architecture

Relay automates business texting: scheduled **auto-sends** to groups of
customers, and AI **auto-replies** to inbound messages. Because Apple forbids
apps from sending SMS in the background or reading incoming texts, the
automation engine cannot live on the device. Relay runs it **in the cloud** —
the mobile app is a thin client. This is also what lets one codebase behave
identically on iOS and Android.

```
┌─────────────┐     HTTPS      ┌──────────────────────────────┐
│  Relay app  │ ◀────────────▶ │           Relay API          │
│ (Expo / RN) │   sync + cmds  │  (Node/Hono or Supabase Edge)│
└─────────────┘                └───────────────┬──────────────┘
                                                │
                 ┌──────────────┬───────────────┼───────────────┬─────────────┐
                 ▼              ▼               ▼               ▼             ▼
            ┌─────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌─────────┐
            │ Postgres│  │  Scheduler │  │  Messaging │  │    AI     │  │ Billing │
            │ (tenant │  │ (cron +    │  │  Twilio /  │  │ Gemini /  │  │ Stripe /│
            │  data)  │  │  queue)    │  │  WhatsApp  │  │  Claude   │  │ RevenueCat│
            └─────────┘  └────────────┘  └────────────┘  └──────────┘  └─────────┘
```

## Components

| Layer | Choice | Why |
|---|---|---|
| Mobile | Expo (React Native), expo-router | One codebase, iOS + Android + web preview |
| API | Node + Hono (or Supabase Edge Functions) | Small, fast, serverless-friendly |
| DB | Postgres (Supabase) | Relational, row-level security per tenant |
| Scheduler | cron + durable queue (e.g. QStash / pg-boss) | Fire campaigns at the right minute, retries |
| SMS | Twilio (A2P 10DLC) | Reliable US/intl SMS, delivery webhooks |
| WhatsApp | WhatsApp Business Cloud API | Second channel, same data model |
| AI | Gemini on Vertex AI or Claude | Draft replies grounded in the knowledge base |
| Auth | Supabase Auth / Clerk | Email + OAuth, per-business tenant |
| Billing | RevenueCat (mobile IAP) + Stripe | Pro subscription, trials |
| Push | Expo Notifications | "Reply needs approval", delivery alerts |

Provider credentials live **only** on the server. The client holds a session
token and talks to the typed API ([`src/services/api.ts`](../src/services/api.ts)).

## Data flow

### Auto-send (outbound campaigns)
1. Scheduler wakes for a due `AutoSendCampaign` (next run computed from its
   `Schedule`).
2. Resolve recipients from the campaign's `target` (group → contacts), skipping
   anyone `optedOut`.
3. For each recipient, render merge tags (`{name}`, `{business}`), enqueue a
   send via the channel's [`MessagingAdapter`](../src/services/messaging.ts).
4. Persist a `MessageActivity` (`pending` → `sent`); provider delivery webhooks
   advance it to `delivered`/`failed`.
5. Compute and store the next run.

### Auto-reply (inbound)
1. Provider posts an inbound webhook → normalized to an `InboundEvent`.
2. If the body is a STOP keyword (`isOptOut`), flag the contact opted-out and
   stop. (Compliance, never auto-reply.)
3. Match the most specific enabled `AutoReplyRule` (contact > group > everyone).
4. If `businessHoursOnly` and currently closed → send the rule's after-hours
   message.
5. Otherwise build the prompt with [`buildReplyPrompt`](../src/services/ai.ts)
   (instruction + tone + enabled knowledge docs), call the model.
6. If the rule `requireApproval` → store the draft as `awaiting-approval` and
   push the owner; else send immediately. Log a `MessageActivity`.

## Compliance (don't skip)
- **Opt-out**: honor STOP/UNSUBSCRIBE automatically; never message opted-out
  contacts.
- **A2P 10DLC**: US application-to-person SMS requires brand + campaign
  registration through Twilio before scale.
- **Consent & quiet hours**: only message customers who opted in; respect
  business hours / local time.
- **WhatsApp**: outbound outside the 24-hour window requires approved templates.

## Client sync
The app is **offline-first**: the Zustand store ([`src/data/store.ts`](../src/data/store.ts))
is the source of truth for the UI and persists locally, so everything is
instant. In production it hydrates from `RelayApi.pull()` and pushes mutations;
the server owns scheduling, sending, and AI generation.

## Suggested build order
1. Auth + tenant + Postgres schema (mirror [`src/data/types.ts`](../src/data/types.ts)).
2. Twilio send + delivery webhooks; wire `sendNow`.
3. Scheduler for recurring campaigns.
4. Inbound webhook → rule match → AI reply (+ approval queue).
5. Billing (RevenueCat) + Pro gating.
6. WhatsApp channel.
