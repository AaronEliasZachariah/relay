/** Schedule math: business-hours check + next-run computation. */

type DayHours = { open: string; close: string; closed?: boolean };
type BusinessHours = Record<string, DayHours>;
type Schedule =
  | { kind: 'once'; at: number }
  | {
      kind: 'recurring';
      hour: number;
      minute: number;
      frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
      weekdays?: number[];
      dayOfMonth?: number;
      interval?: number;
      startsAt: number;
    };

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

export function isWithinBusinessHours(hours: BusinessHours | null | undefined, now = new Date()): boolean {
  if (!hours) return true;
  const day = hours[DAY_KEYS[now.getDay()]!];
  if (!day || day.closed) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= minutes(day.open) && cur <= minutes(day.close);
}

/** Next fire time strictly after `from`, or null if none in the next year. */
export function computeNextRun(schedule: Schedule, from = new Date()): Date | null {
  if (schedule.kind === 'once') {
    return schedule.at > from.getTime() ? new Date(schedule.at) : null;
  }
  for (let i = 0; i <= 366; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    d.setHours(schedule.hour, schedule.minute, 0, 0);
    if (d.getTime() <= from.getTime()) continue;
    switch (schedule.frequency) {
      case 'daily':
      case 'custom':
        return d;
      case 'weekly':
        if ((schedule.weekdays ?? []).includes(d.getDay())) return d;
        break;
      case 'monthly':
        if (d.getDate() === (schedule.dayOfMonth ?? 1)) return d;
        break;
    }
  }
  return null;
}
