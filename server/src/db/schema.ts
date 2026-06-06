/**
 * Drizzle schema — the server's source of truth. Mirrors the client model in
 * `app/src/data/types.ts` so sync is a near-1:1 mapping. JSONB is used for the
 * polymorphic bits (target, schedule, business hours) that the app already
 * treats as structured blobs.
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/* ---- shapes stored as JSONB (kept in sync with the app types) ---- */
type Channel = 'sms' | 'whatsapp';
type Target =
  | { type: 'all' }
  | { type: 'group'; groupId: string }
  | { type: 'contact'; contactId: string };
type Schedule =
  | { kind: 'once'; at: number }
  | {
      kind: 'recurring';
      hour: number;
      minute: number;
      frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
      interval?: number;
      intervalUnit?: 'days' | 'weeks' | 'months';
      weekdays?: number[];
      dayOfMonth?: number;
      startsAt: number;
    };
type DayHours = { open: string; close: string; closed?: boolean };
type BusinessHours = Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', DayHours>;

/* ----------------------------- tables ----------------------------- */

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category').notNull().default(''),
  sendingNumber: text('sending_number'),
  signature: text('signature'),
  defaultChannel: text('default_channel').$type<Channel>().notNull().default('sms'),
  hours: jsonb('hours').$type<BusinessHours>(),
  plan: text('plan').$type<'free' | 'pro'>().notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phoneE164: text('phone_e164').notNull(),
    accent: text('accent'),
    company: text('company'),
    note: text('note'),
    optedOut: boolean('opted_out').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('contacts_business_idx').on(t.businessId)],
);

export const groups = pgTable(
  'groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    emoji: text('emoji').notNull().default('💬'),
    accent: text('accent').notNull().default('#5B5BF0'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('groups_business_idx').on(t.businessId)],
);

export const groupMembers = pgTable(
  'group_members',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.contactId] })],
);

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    target: jsonb('target').$type<Target>().notNull(),
    channel: text('channel').$type<Channel>().notNull().default('sms'),
    message: text('message').notNull(),
    schedule: jsonb('schedule').$type<Schedule>().notNull(),
    enabled: boolean('enabled').notNull().default(true),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('campaigns_business_idx').on(t.businessId),
    index('campaigns_due_idx').on(t.enabled, t.nextRunAt),
  ],
);

export const replyRules = pgTable(
  'reply_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    target: jsonb('target').$type<Target>().notNull(),
    channel: text('channel').$type<Channel>().notNull().default('sms'),
    instruction: text('instruction').notNull(),
    tone: text('tone').$type<'friendly' | 'professional' | 'concise' | 'warm'>().notNull().default('friendly'),
    businessHoursOnly: boolean('business_hours_only').notNull().default(false),
    afterHoursMessage: text('after_hours_message'),
    requireApproval: boolean('require_approval').notNull().default(false),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('reply_rules_business_idx').on(t.businessId)],
);

export const knowledgeDocs = pgTable(
  'knowledge_docs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('knowledge_business_idx').on(t.businessId)],
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    direction: text('direction').$type<'outbound' | 'inbound'>().notNull(),
    kind: text('kind').$type<'auto-send' | 'auto-reply' | 'manual'>().notNull(),
    channel: text('channel').$type<Channel>().notNull().default('sms'),
    body: text('body').notNull(),
    status: text('status').notNull(),
    campaignId: uuid('campaign_id'),
    ruleId: uuid('rule_id'),
    /** Idempotency key so retries never double-send. */
    dedupeKey: text('dedupe_key').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('messages_business_time_idx').on(t.businessId, t.createdAt),
    index('messages_status_idx').on(t.status),
  ],
);

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  providerId: text('provider_id'),
  status: text('status').notNull(),
  error: text('error'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------- relations ---------------------------- */

export const businessRelations = relations(businesses, ({ many }) => ({
  contacts: many(contacts),
  groups: many(groups),
  campaigns: many(campaigns),
  rules: many(replyRules),
  knowledge: many(knowledgeDocs),
  messages: many(messages),
}));

export const groupRelations = relations(groups, ({ many }) => ({
  members: many(groupMembers),
}));

export const groupMemberRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  contact: one(contacts, { fields: [groupMembers.contactId], references: [contacts.id] }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  contact: one(contacts, { fields: [messages.contactId], references: [contacts.id] }),
  delivery: one(deliveries),
}));
