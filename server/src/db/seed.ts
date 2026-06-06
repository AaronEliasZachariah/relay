/**
 * Dev seed — one demo business ("Halo Hair Studio") matching the app's mock data
 * so a synced client shows real content. Run after migrating:
 *   npm run db:seed
 */
import { campaigns, businesses, contacts, groupMembers, groups, knowledgeDocs, replyRules } from './schema.js';
import { db } from './client.js';

const now = Date.now();
const DAY = 86_400_000;

const [biz] = await db
  .insert(businesses)
  .values({
    name: 'Halo Hair Studio',
    category: 'Hair Salon',
    sendingNumber: '+14155550142',
    signature: '— Halo Hair Studio',
    defaultChannel: 'sms',
    plan: 'free',
    hours: {
      mon: { open: '09:00', close: '17:00' },
      tue: { open: '09:00', close: '19:00' },
      wed: { open: '09:00', close: '19:00' },
      thu: { open: '09:00', close: '19:00' },
      fri: { open: '09:00', close: '18:00' },
      sat: { open: '10:00', close: '16:00' },
      sun: { open: '00:00', close: '00:00', closed: true },
    },
  })
  .returning();

if (!biz) throw new Error('failed to insert business');

const people: [string, string, string][] = [
  ['Sarah Mitchell', '+14155550111', '#8B5CF6'],
  ['Jessica Park', '+14155550112', '#EC4899'],
  ['Maria Gomez', '+14155550113', '#F5A524'],
  ['Emily Chen', '+14155550114', '#14B8A6'],
  ['Grace Kim', '+14155550119', '#8B5CF6'],
  ['Rachel Adams', '+14155550117', '#16B364'],
];
const insertedContacts = await db
  .insert(contacts)
  .values(people.map(([name, phoneE164, accent]) => ({ businessId: biz.id, name, phoneE164, accent })))
  .returning();
const cid = (name: string) => insertedContacts.find((c) => c.name === name)!.id;

const [vip] = await db
  .insert(groups)
  .values({ businessId: biz.id, name: 'VIP Clients', emoji: '💎', accent: '#8B5CF6', description: 'Top spenders — first access to offers' })
  .returning();
const [regulars] = await db
  .insert(groups)
  .values({ businessId: biz.id, name: 'Regulars', emoji: '✂️', accent: '#5B5BF0', description: 'Books every 4–6 weeks' })
  .returning();

await db.insert(groupMembers).values([
  { groupId: vip!.id, contactId: cid('Sarah Mitchell') },
  { groupId: vip!.id, contactId: cid('Jessica Park') },
  { groupId: vip!.id, contactId: cid('Grace Kim') },
  { groupId: regulars!.id, contactId: cid('Maria Gomez') },
  { groupId: regulars!.id, contactId: cid('Emily Chen') },
]);

await db.insert(campaigns).values({
  businessId: biz.id,
  name: 'VIP Friday Treat',
  target: { type: 'group', groupId: vip!.id },
  channel: 'sms',
  message: 'Hi {name}! 💎 As one of our VIPs, enjoy 15% off any service booked this weekend. {business}',
  schedule: { kind: 'recurring', hour: 9, minute: 0, frequency: 'weekly', weekdays: [5], startsAt: now - 30 * DAY },
  enabled: true,
  nextRunAt: new Date(now + 5 * DAY),
});

await db.insert(replyRules).values({
  businessId: biz.id,
  name: 'Booking assistant',
  target: { type: 'all' },
  channel: 'sms',
  instruction:
    'Answer questions about availability, services and pricing. If they want to book, offer the next open times and ask them to confirm. Keep replies warm and under 2 sentences.',
  tone: 'friendly',
  businessHoursOnly: false,
  requireApproval: false,
  enabled: true,
});

await db.insert(knowledgeDocs).values({
  businessId: biz.id,
  title: 'Services & Pricing',
  content:
    'Women’s cut $65 • Men’s cut $40 • Root touch-up $90 • Full color $140 • Balayage from $180 • Blowout $45. Consultations are free.',
  enabled: true,
});

// eslint-disable-next-line no-console
console.log(`✓ seeded business ${biz.id} (${biz.name})`);
process.exit(0);
