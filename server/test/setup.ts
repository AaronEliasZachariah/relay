import { migrate } from 'drizzle-orm/pglite/migrator';
import { beforeAll } from 'vitest';

import { db } from '../src/db/client.js';

// Apply migrations to the in-process PGlite DB (idempotent — safe per file).
beforeAll(async () => {
  await migrate(db as never, { migrationsFolder: './drizzle' });
});
