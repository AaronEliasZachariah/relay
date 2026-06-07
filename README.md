# Relay

**Automated texts & AI replies for your business.**

Relay helps small business owners stay on top of customer messaging without
living in their phone. Organize customers into groups — like a group chat —
schedule texts to a whole group, and let AI handle replies 24/7 so you never
miss a booking.

> **Built cross-platform (iOS + Android) on a cloud engine.** Apple blocks apps
> from sending SMS in the background or auto-replying to texts, so Relay sends
> and receives server-side through a business number (Twilio for SMS, WhatsApp
> Business next). The app is a fast, offline-first client — identical on both
> platforms.
>
> **New to these platforms (Twilio, RevenueCat, webhooks…)? Start with the
> plain-English [Guide](docs/GUIDE.md)** — it explains every piece with mind maps.
> Deep dives: the [Data Pipeline Showcase](docs/DATA-PIPELINE.md) and
> [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Features

- **Groups** — sort customers into VIPs, regulars, leads, win-backs… the
  WhatsApp metaphor, applied to outreach.
- **Auto-send** — one-off or recurring campaigns (daily/weekly/monthly) to a
  group, with merge tags (`{name}`, `{business}`) and a live SMS preview.
- **AI auto-reply** — answers booking, hours and pricing questions instantly,
  grounded in your **knowledge base**, in a tone you choose. Approve drafts or
  run hands-free; after-hours auto-responses included.
- **Activity** — a clean log of everything sent, received and replied, with a
  one-tap approval queue.
- **Premium** — Relay Pro unlocks unlimited automations, AI replies and the
  WhatsApp channel.

## Tech stack

- [Expo](https://expo.dev) (React Native 0.85, React 19) + **expo-router**
- **TypeScript** throughout
- **Zustand** (+ AsyncStorage) for offline-first state
- A custom design system (tokens, theming, Inter type, light/dark) — no UI kit
- `expo-linear-gradient`, `expo-blur`, `expo-haptics` for the premium feel

## Getting started

```bash
npm install
npm run ios        # or: npm run android / npm run web
```

Regenerate launcher / splash icons after editing the brand:

```bash
node scripts/gen-icons.js
```

## Testing

**91 tests, no external services required** — the server tests run Postgres
in-process (PGlite), so everything works anywhere, including CI.

```bash
npm test                 # app: logic, store, services, components + every screen
cd server && npm test    # server: unit + E2E (API, gating, billing, both pipelines)
```

CI runs both suites on every push/PR — see [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Project structure

```
app/                 # expo-router routes
  (tabs)/            # Groups · Automations · Activity · Settings
  group/             # group detail + editor
  automation/        # auto-send + auto-reply editors
  knowledge*.tsx     # AI knowledge base
  premium.tsx        # paywall · onboarding.tsx · business.tsx
src/
  components/        # design-system primitives
  theme/             # tokens + ThemeProvider
  data/              # types, Zustand store, demo seed
  services/          # messaging + AI + API contracts (cloud backend)
  utils/             # formatting, haptics
docs/                # ARCHITECTURE.md · ASO.md
```

## Roadmap

- [ ] Backend (auth, Postgres, scheduler) — see [ARCHITECTURE](docs/ARCHITECTURE.md)
- [ ] Twilio SMS send + delivery/inbound webhooks
- [ ] AI auto-reply with approval queue
- [ ] RevenueCat billing + Pro gating
- [ ] WhatsApp Business channel
- [ ] Contact import (device + CSV)

## License

Copyright © 2026. All rights reserved.
