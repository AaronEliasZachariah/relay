/**
 * The Hono app with all routes mounted — no side effects (no listen, no
 * scheduler), so tests can call `app.request(...)` directly. `index.ts` wraps
 * this with the HTTP server + scheduler for real runs.
 */
import { Hono } from 'hono';

import { env, features } from './lib/env.js';
import { dev } from './routes/dev.js';
import { v1 } from './routes/v1.js';
import { webhooks } from './routes/webhooks.js';

export function createApp() {
  const app = new Hono();

  app.get('/health', (c) =>
    c.json({ ok: true, service: 'relay-server', env: env.NODE_ENV, features, ts: Date.now() }),
  );

  app.route('/v1', v1);
  app.route('/v1/webhooks', webhooks);
  app.route('/v1/dev', dev);

  return app;
}

export const app = createApp();
