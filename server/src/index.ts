import { serve } from '@hono/node-server';

import { app } from './app.js';
import { env } from './lib/env.js';
import { startScheduler } from './scheduler.js';

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`▸ Relay API listening on http://localhost:${info.port}  (${env.NODE_ENV})`);
});

startScheduler();
