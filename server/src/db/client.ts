import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../lib/env.js';
import * as schema from './schema.js';

let db: PostgresJsDatabase<typeof schema>;

if (env.DATABASE_URL === 'pglite') {
  // In-process Postgres (WebAssembly) for tests — no Docker or DB server needed.
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');
  db = drizzlePglite(new PGlite(), { schema }) as unknown as PostgresJsDatabase<typeof schema>;
} else {
  db = drizzle(postgres(env.DATABASE_URL), { schema });
}

export { db };
export type DB = typeof db;
