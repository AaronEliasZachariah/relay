/**
 * Relay domain model.
 *
 * The product is organized like WhatsApp: contacts live inside Groups, and
 * automations (auto-send + auto-reply) attach to a group or an individual.
 * Sending/receiving happens server-side over a chosen Channel, so the same
 * model drives both iOS and Android — the app is a client to the Relay backend.
 */

export type ID = string;

/** Delivery channel. SMS first; WhatsApp Business is a drop-in second channel. */
export type Channel = 'sms' | 'whatsapp';

/* -------------------------------------------------------------------------- */
/*  People & groups                                                           */
/* -------------------------------------------------------------------------- */

export type Contact = {
  id: ID;
  name: string;
  /** E.164 where known (e.g. +14155551234). */
  phone: string;
  /** Deterministic avatar tint when no photo. */
  accent?: string;
  company?: string;
  note?: string;
  /** Honor opt-outs (STOP). Never message when true. */
  optedOut?: boolean;
  createdAt: number;
};

export type Group = {
  id: ID;
  name: string;
  /** Single emoji used as the group's avatar glyph. */
  emoji: string;
  /** Avatar background tint. */
  accent: string;
  description?: string;
  contactIds: ID[];
  createdAt: number;
};

/* -------------------------------------------------------------------------- */
/*  Scheduling                                                                */
/* -------------------------------------------------------------------------- */

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type IntervalUnit = 'days' | 'weeks' | 'months';

export type Schedule =
  | { kind: 'once'; /** epoch ms */ at: number }
  | {
      kind: 'recurring';
      /** Local time of day. */
      hour: number;
      minute: number;
      frequency: Frequency;
      /** For 'custom': every N units. */
      interval?: number;
      intervalUnit?: IntervalUnit;
      /** For 'weekly': 0=Sun … 6=Sat. */
      weekdays?: number[];
      /** For 'monthly': day of month 1–31. */
      dayOfMonth?: number;
      /** First eligible send (epoch ms). */
      startsAt: number;
    };

/* -------------------------------------------------------------------------- */
/*  Automations                                                               */
/* -------------------------------------------------------------------------- */

/** What an automation applies to. */
export type Target =
  | { type: 'group'; groupId: ID }
  | { type: 'contact'; contactId: ID }
  | { type: 'all' };

/**
 * Outbound automation. e.g. "Text the VIP Clients group a 10%-off code every
 * Friday at 9am." Body supports merge tags: {name}, {company}, {business}.
 */
export type AutoSendCampaign = {
  id: ID;
  name: string;
  target: Target;
  channel: Channel;
  message: string;
  schedule: Schedule;
  enabled: boolean;
  createdAt: number;
  lastRunAt?: number;
  nextRunAt?: number;
};

export type ReplyTone = 'friendly' | 'professional' | 'concise' | 'warm';

/**
 * Inbound automation. When a targeted contact texts in, the AI drafts/sends a
 * reply following `instruction`, grounded in the knowledge base.
 */
export type AutoReplyRule = {
  id: ID;
  name: string;
  target: Target;
  channel: Channel;
  /** Free-form instruction, e.g. "Answer booking questions; offer to call back." */
  instruction: string;
  tone: ReplyTone;
  /** Only auto-reply inside business hours; otherwise send the after-hours note. */
  businessHoursOnly: boolean;
  afterHoursMessage?: string;
  /** Require the owner to approve each draft before it sends. */
  requireApproval: boolean;
  enabled: boolean;
  createdAt: number;
};

/** Background knowledge the AI grounds replies in (FAQ, hours, pricing). */
export type KnowledgeDoc = {
  id: ID;
  title: string;
  content: string;
  enabled: boolean;
  updatedAt: number;
};

/* -------------------------------------------------------------------------- */
/*  Activity log                                                              */
/* -------------------------------------------------------------------------- */

export type ActivityDirection = 'outbound' | 'inbound';
export type ActivityKind = 'auto-send' | 'auto-reply' | 'manual';
export type ActivityStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'received'
  | 'awaiting-approval'
  | 'blocked';

export type MessageActivity = {
  id: ID;
  direction: ActivityDirection;
  kind: ActivityKind;
  channel: Channel;
  contactId: ID;
  groupId?: ID;
  body: string;
  status: ActivityStatus;
  timestamp: number;
  /** Originating automation, if any. */
  campaignId?: ID;
  ruleId?: ID;
};

/* -------------------------------------------------------------------------- */
/*  Business & account                                                        */
/* -------------------------------------------------------------------------- */

export type DayHours = { open: string; close: string; closed?: boolean };
/** Mon..Sun keyed business hours, "09:00"/"17:00" 24h strings. */
export type BusinessHours = Record<
  'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
  DayHours
>;

export type BusinessProfile = {
  name: string;
  category: string;
  /** The Relay-provisioned business number messages send from. */
  number?: string;
  signature?: string;
  hours: BusinessHours;
  defaultChannel: Channel;
};

export type Plan = 'free' | 'pro';
