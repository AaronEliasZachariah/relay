/**
 * Demo dataset — a believable small business (a hair studio) so every screen
 * has real-feeling content on first launch. Replaced by the user's own data as
 * they go; persisted by the store.
 */

import type {
  AutoReplyRule,
  AutoSendCampaign,
  BusinessProfile,
  Contact,
  Group,
  KnowledgeDoc,
  MessageActivity,
} from './types';

const now = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const accents = {
  indigo: '#5B5BF0',
  violet: '#8B5CF6',
  pink: '#EC4899',
  amber: '#F5A524',
  teal: '#14B8A6',
  blue: '#3B82F6',
  green: '#16B364',
  rose: '#F43F5E',
};

export const seedBusiness: BusinessProfile = {
  name: 'Halo Hair Studio',
  category: 'Hair Salon',
  number: '+1 (415) 555-0142',
  signature: '— Halo Hair Studio',
  defaultChannel: 'sms',
  hours: {
    mon: { open: '09:00', close: '17:00' },
    tue: { open: '09:00', close: '19:00' },
    wed: { open: '09:00', close: '19:00' },
    thu: { open: '09:00', close: '19:00' },
    fri: { open: '09:00', close: '18:00' },
    sat: { open: '10:00', close: '16:00' },
    sun: { open: '00:00', close: '00:00', closed: true },
  },
};

export const seedContacts: Contact[] = [
  { id: 'c1', name: 'Sarah Mitchell', phone: '+14155550111', accent: accents.violet, company: 'VIP', createdAt: now - 120 * DAY },
  { id: 'c2', name: 'Jessica Park', phone: '+14155550112', accent: accents.pink, createdAt: now - 90 * DAY },
  { id: 'c3', name: 'Maria Gomez', phone: '+14155550113', accent: accents.amber, createdAt: now - 60 * DAY },
  { id: 'c4', name: 'Emily Chen', phone: '+14155550114', accent: accents.teal, createdAt: now - 45 * DAY },
  { id: 'c5', name: 'Olivia Brooks', phone: '+14155550115', accent: accents.blue, createdAt: now - 30 * DAY },
  { id: 'c6', name: 'Hannah Lee', phone: '+14155550116', accent: accents.indigo, createdAt: now - 20 * DAY },
  { id: 'c7', name: 'Rachel Adams', phone: '+14155550117', accent: accents.green, createdAt: now - 14 * DAY },
  { id: 'c8', name: 'Sophie Turner', phone: '+14155550118', accent: accents.rose, createdAt: now - 9 * DAY },
  { id: 'c9', name: 'Grace Kim', phone: '+14155550119', accent: accents.violet, createdAt: now - 6 * DAY },
  { id: 'c10', name: 'Ava Martinez', phone: '+14155550120', accent: accents.amber, createdAt: now - 3 * DAY },
  { id: 'c11', name: 'Chloe Wright', phone: '+14155550121', accent: accents.teal, createdAt: now - 2 * DAY },
  { id: 'c12', name: 'Mia Robinson', phone: '+14155550122', accent: accents.blue, createdAt: now - 1 * DAY },
];

export const seedGroups: Group[] = [
  {
    id: 'g1',
    name: 'VIP Clients',
    emoji: '💎',
    accent: accents.violet,
    description: 'Top spenders — first access to offers',
    contactIds: ['c1', 'c2', 'c9'],
    createdAt: now - 100 * DAY,
  },
  {
    id: 'g2',
    name: 'Regulars',
    emoji: '✂️',
    accent: accents.indigo,
    description: 'Books every 4–6 weeks',
    contactIds: ['c3', 'c4', 'c5', 'c6'],
    createdAt: now - 80 * DAY,
  },
  {
    id: 'g3',
    name: 'New Leads',
    emoji: '✨',
    accent: accents.amber,
    description: 'Reached out but not booked yet',
    contactIds: ['c10', 'c11', 'c12'],
    createdAt: now - 30 * DAY,
  },
  {
    id: 'g4',
    name: 'Win-back',
    emoji: '🌙',
    accent: accents.teal,
    description: 'Haven’t visited in 90+ days',
    contactIds: ['c7', 'c8'],
    createdAt: now - 20 * DAY,
  },
];

export const seedCampaigns: AutoSendCampaign[] = [
  {
    id: 'cmp1',
    name: 'VIP Friday Treat',
    target: { type: 'group', groupId: 'g1' },
    channel: 'sms',
    message:
      'Hi {name}! 💎 As one of our VIPs, enjoy 15% off any service booked this weekend. Reply BOOK to grab a slot. {business}',
    schedule: { kind: 'recurring', hour: 9, minute: 0, frequency: 'weekly', weekdays: [5], startsAt: now - 30 * DAY },
    enabled: true,
    createdAt: now - 30 * DAY,
    lastRunAt: now - 2 * DAY,
    nextRunAt: now + 5 * DAY,
  },
  {
    id: 'cmp2',
    name: 'Win-back 20% off',
    target: { type: 'group', groupId: 'g4' },
    channel: 'sms',
    message:
      'Hi {name}, we miss you at Halo! Here’s 20% off your next visit — our treat. Book anytime, no rush. {business}',
    schedule: { kind: 'recurring', hour: 10, minute: 0, frequency: 'monthly', dayOfMonth: 1, startsAt: now - 60 * DAY },
    enabled: true,
    createdAt: now - 60 * DAY,
    lastRunAt: now - 6 * DAY,
    nextRunAt: now + 24 * DAY,
  },
  {
    id: 'cmp3',
    name: 'New lead welcome',
    target: { type: 'group', groupId: 'g3' },
    channel: 'sms',
    message:
      'Hi {name}, thanks for reaching out to {business}! Want me to find you a first appointment this week? Just reply with a day that works. ✨',
    schedule: { kind: 'recurring', hour: 11, minute: 0, frequency: 'daily', startsAt: now - 10 * DAY },
    enabled: false,
    createdAt: now - 10 * DAY,
  },
];

export const seedRules: AutoReplyRule[] = [
  {
    id: 'r1',
    name: 'Booking assistant',
    target: { type: 'all' },
    channel: 'sms',
    instruction:
      'Answer questions about availability, services and pricing. If they want to book, offer the next open times and ask them to confirm. Keep replies warm and under 2 sentences.',
    tone: 'friendly',
    businessHoursOnly: false,
    requireApproval: false,
    enabled: true,
    createdAt: now - 40 * DAY,
  },
  {
    id: 'r2',
    name: 'VIP concierge',
    target: { type: 'group', groupId: 'g1' },
    channel: 'sms',
    instruction:
      'These are our best clients. Be especially attentive, offer to hold a premium slot, and mention their VIP perk. Draft the reply but let me approve it before it sends.',
    tone: 'professional',
    businessHoursOnly: false,
    requireApproval: true,
    enabled: true,
    createdAt: now - 25 * DAY,
  },
  {
    id: 'r3',
    name: 'After-hours note',
    target: { type: 'all' },
    channel: 'sms',
    instruction: 'Let them know we’re closed and will reply in the morning.',
    tone: 'warm',
    businessHoursOnly: true,
    afterHoursMessage:
      'Thanks for messaging Halo Hair Studio! We’re closed right now but will reply first thing. To book now: halohair.studio/book 💜',
    requireApproval: false,
    enabled: true,
    createdAt: now - 25 * DAY,
  },
];

export const seedKnowledge: KnowledgeDoc[] = [
  {
    id: 'k1',
    title: 'Hours & Location',
    content:
      'Mon 9–5, Tue–Thu 9–7, Fri 9–6, Sat 10–4, closed Sunday. 24 Maple St, San Francisco. Free parking behind the building. Nearest BART: 16th St Mission.',
    enabled: true,
    updatedAt: now - 12 * DAY,
  },
  {
    id: 'k2',
    title: 'Services & Pricing',
    content:
      'Women’s cut $65 • Men’s cut $40 • Root touch-up $90 • Full color $140 • Balayage from $180 • Blowout $45 • Treatments from $35. Consultations are always free.',
    enabled: true,
    updatedAt: now - 12 * DAY,
  },
  {
    id: 'k3',
    title: 'Booking & cancellation policy',
    content:
      'Booked via halohair.studio/book or by text. Please give 24h notice to cancel or reschedule; same-day cancellations are charged 50% of the service. New clients leave a card on file to reserve.',
    enabled: true,
    updatedAt: now - 12 * DAY,
  },
];

export const seedActivity: MessageActivity[] = [
  {
    id: 'a1',
    direction: 'inbound',
    kind: 'manual',
    channel: 'sms',
    contactId: 'c1',
    body: 'Hi! Do you have any openings for a balayage this Saturday? 💕',
    status: 'received',
    timestamp: now - 18 * MIN,
  },
  {
    id: 'a2',
    direction: 'outbound',
    kind: 'auto-reply',
    channel: 'sms',
    contactId: 'c2',
    body: 'Hi Jessica! Balayage starts at $180 and takes about 2.5 hrs. I have Sat 2:00pm or 4:30pm with Mia — want me to hold one? 💜',
    status: 'awaiting-approval',
    timestamp: now - 26 * MIN,
    ruleId: 'r2',
  },
  {
    id: 'a3',
    direction: 'outbound',
    kind: 'auto-reply',
    channel: 'sms',
    contactId: 'c4',
    body: 'Hi Emily! We’re open till 7 tonight and have a 5:15 blowout free if you’d like it. ✨',
    status: 'sent',
    timestamp: now - 2 * HOUR,
    ruleId: 'r1',
  },
  {
    id: 'a4',
    direction: 'outbound',
    kind: 'auto-send',
    channel: 'sms',
    contactId: 'c1',
    groupId: 'g1',
    body: 'Hi Sarah! 💎 As one of our VIPs, enjoy 15% off any service booked this weekend. Reply BOOK to grab a slot. — Halo Hair Studio',
    status: 'delivered',
    timestamp: now - 2 * DAY,
    campaignId: 'cmp1',
  },
  {
    id: 'a5',
    direction: 'inbound',
    kind: 'manual',
    channel: 'sms',
    contactId: 'c10',
    body: 'BOOK',
    status: 'received',
    timestamp: now - 2 * DAY + 9 * MIN,
  },
  {
    id: 'a6',
    direction: 'outbound',
    kind: 'auto-send',
    channel: 'sms',
    contactId: 'c7',
    groupId: 'g4',
    body: 'Hi Rachel, we miss you at Halo! Here’s 20% off your next visit — our treat. Book anytime, no rush. — Halo Hair Studio',
    status: 'delivered',
    timestamp: now - 6 * DAY,
    campaignId: 'cmp2',
  },
  {
    id: 'a7',
    direction: 'outbound',
    kind: 'auto-send',
    channel: 'sms',
    contactId: 'c8',
    groupId: 'g4',
    body: 'Hi Sophie, we miss you at Halo! Here’s 20% off your next visit — our treat. Book anytime, no rush. — Halo Hair Studio',
    status: 'failed',
    timestamp: now - 6 * DAY,
    campaignId: 'cmp2',
  },
];
