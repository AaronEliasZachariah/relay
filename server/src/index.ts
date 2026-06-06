import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { env, features } from './lib/env.js';
import { v1 } from './routes/v1.js';

const app = new Hono();

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'relay-server',
    env: env.NODE_ENV,
    features, // which integrations are live vs. mocked
    ts: Date.now(),
  }),
);

app.route('/v1', v1); // sync + commands (Phase 2)
// app.route('/v1/webhooks', webhooks) // Phase 3


serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`▸ Relay API listening on http://localhost:${info.port}  (${env.NODE_ENV})`);
});

export default app;
