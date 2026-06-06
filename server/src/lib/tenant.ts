import type { MiddlewareHandler } from 'hono';

import { db } from '../db/client.js';
import { businesses } from '../db/schema.js';

declare module 'hono' {
  interface ContextVariableMap {
    businessId: string;
  }
}

/**
 * Resolves the tenant for a request and pins every query to it.
 *
 * Dev: trusts an `x-business-id` header, or falls back to the first business so
 * the seeded demo "just works" with curl. Production: verify a JWT signed with
 * `JWT_SECRET` and read `businessId` from its claims (drop-in replacement here).
 */
export const tenant: MiddlewareHandler = async (c, next) => {
  let businessId = c.req.header('x-business-id') ?? undefined;
  if (!businessId) {
    const [first] = await db.select({ id: businesses.id }).from(businesses).limit(1);
    businessId = first?.id;
  }
  if (!businessId) return c.json({ error: 'no_business' }, 401);
  c.set('businessId', businessId);
  await next();
};
