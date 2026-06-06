import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { env } from '../lib/env.js';

// One-off connection for migrations.
const sql = postgres(env.DATABASE_URL, { max: 1 });

await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
await sql.end();

// eslint-disable-next-line no-console
console.log('✓ migrations applied');
