import { sql } from 'drizzle-orm';

import { db } from '../src/db/client.js';
import * as t from '../src/db/schema.js';

export async function resetDb() {
  await db.execute(
    sql`TRUNCATE businesses, contacts, groups, group_members, campaigns, reply_rules, knowledge_docs, messages, deliveries RESTART IDENTITY CASCADE`,
  );
}

const HOURS = {
  mon: { open: '09:00', close: '17:00' },
  tue: { open: '09:00', close: '17:00' },
  wed: { open: '09:00', close: '17:00' },
  thu: { open: '09:00', close: '17:00' },
  fri: { open: '09:00', close: '17:00' },
  sat: { open: '10:00', close: '16:00' },
  sun: { open: '00:00', close: '00:00', closed: true },
};

/** Insert a known business + 2 contacts in a "VIP" group. */
export async function seedFixture(plan: 'free' | 'pro' = 'free') {
  const [biz] = await db
    .insert(t.businesses)
    .values({
      name: 'Test Biz',
      category: 'Salon',
      sendingNumber: '+15550000000',
      defaultChannel: 'sms',
      plan,
      hours: HOURS,
    })
    .returning();

  const contacts = await db
    .insert(t.contacts)
    .values([
      { businessId: biz!.id, name: 'Alice Test', phoneE164: '+15551110001' },
      { businessId: biz!.id, name: 'Bob Test', phoneE164: '+15551110002' },
    ])
    .returning();

  const [group] = await db
    .insert(t.groups)
    .values({ businessId: biz!.id, name: 'VIP', emoji: '💎', accent: '#8B5CF6' })
    .returning();

  await db.insert(t.groupMembers).values(contacts.map((c) => ({ groupId: group!.id, contactId: c.id })));

  return { biz: biz!, contacts, group: group! };
}
