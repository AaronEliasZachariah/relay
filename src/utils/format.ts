import type { IconName } from '@/components/Icon';
import type { Tone } from '@/components/Badge';
import type {
  ActivityStatus,
  BusinessProfile,
  Contact,
  Group,
  Schedule,
  Target,
} from '@/data/types';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function time12(hour: number, minute: number): string {
  const am = hour < 12;
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${minute.toString().padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

export function scheduleSummary(s: Schedule): string {
  if (s.kind === 'once') {
    const d = new Date(s.at);
    return `${MONTHS[d.getMonth()]} ${d.getDate()} · ${time12(d.getHours(), d.getMinutes())}`;
  }
  const t = time12(s.hour, s.minute);
  switch (s.frequency) {
    case 'daily':
      return `Every day · ${t}`;
    case 'weekly': {
      const days = (s.weekdays ?? []).map((d) => WEEKDAYS[d]).join(', ');
      return `${days || 'Weekly'} · ${t}`;
    }
    case 'monthly':
      return `Monthly on the ${ordinal(s.dayOfMonth ?? 1)} · ${t}`;
    case 'custom':
      return `Every ${s.interval ?? 1} ${s.intervalUnit ?? 'days'} · ${t}`;
  }
}

export function nextRunLabel(ts?: number): string | undefined {
  if (!ts) return undefined;
  const diff = ts - Date.now();
  if (diff < 0) return undefined;
  if (diff < HOUR) return `in ${Math.max(1, Math.round(diff / MIN))}m`;
  if (diff < DAY) return `in ${Math.round(diff / HOUR)}h`;
  return `in ${Math.round(diff / DAY)}d`;
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < MIN) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 2 * DAY) return 'Yesterday';
  const d = new Date(ts);
  if (diff < 7 * DAY) return WEEKDAYS[d.getDay()]!;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function dayBucket(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < DAY && new Date(ts).getDate() === new Date().getDate()) return 'Today';
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) return 'This week';
  return 'Earlier';
}

export function statusMeta(status: ActivityStatus): { label: string; tone: Tone; icon: IconName } {
  switch (status) {
    case 'sent':
      return { label: 'Sent', tone: 'success', icon: 'checkmark' };
    case 'delivered':
      return { label: 'Delivered', tone: 'success', icon: 'checkmark-done' };
    case 'received':
      return { label: 'Received', tone: 'info', icon: 'arrow-down-circle' };
    case 'pending':
      return { label: 'Sending', tone: 'warning', icon: 'time' };
    case 'awaiting-approval':
      return { label: 'Needs approval', tone: 'warning', icon: 'sparkles' };
    case 'failed':
      return { label: 'Failed', tone: 'danger', icon: 'alert-circle' };
    case 'blocked':
      return { label: 'Blocked', tone: 'neutral', icon: 'ban' };
  }
}

export function targetLabel(target: Target, groups: Group[], contacts: Contact[]): string {
  if (target.type === 'all') return 'Everyone';
  if (target.type === 'group') return groups.find((g) => g.id === target.groupId)?.name ?? 'Group';
  return contacts.find((c) => c.id === target.contactId)?.name ?? 'Contact';
}

export function targetEmoji(target: Target, groups: Group[]): string | undefined {
  if (target.type === 'group') return groups.find((g) => g.id === target.groupId)?.emoji;
  if (target.type === 'all') return '🌐';
  return undefined;
}

export function applyMerge(message: string, business: BusinessProfile, name = 'there'): string {
  return message
    .replace(/\{name\}/g, name)
    .replace(/\{business\}/g, business.name)
    .replace(/\{company\}/g, '');
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
