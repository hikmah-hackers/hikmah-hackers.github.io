import { SITE } from '../site';

const DAY_MS = 86_400_000;
const DUE_SOON_DAYS = 2;

/** Today's date (YYYY-MM-DD) in the class time zone, at build time. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function toUTC(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export function formatDate(iso: string, style: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: style === 'long' ? 'long' : 'short',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
  }).format(toUTC(iso));
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((toUTC(toISO).getTime() - toUTC(fromISO).getTime()) / DAY_MS);
}

export type DueStatus = 'open' | 'due-soon' | 'closed';

export function dueStatus(dueISO: string, today: string = todayISO()): DueStatus {
  const daysLeft = daysBetween(today, dueISO);
  if (daysLeft < 0) return 'closed';
  if (daysLeft <= DUE_SOON_DAYS) return 'due-soon';
  return 'open';
}

export const DUE_LABEL: Record<DueStatus, string> = {
  open: 'Open',
  'due-soon': 'Due soon',
  closed: 'Closed · late OK',
};
