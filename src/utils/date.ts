import dayjs, { Dayjs } from 'dayjs';
import { IntakeEntry } from '../store/slices/hydration';

export type DateKey = string;

export function dateKey(d: Dayjs): DateKey {
  return d.format('YYYY-MM-DD');
}

export function keyFor(date: Date | Dayjs = new Date()): DateKey {
  return dayjs(date).format('YYYY-MM-DD');
}

export function todayKey(): DateKey {
  return dayjs().format('YYYY-MM-DD');
}

export function isToday(key: DateKey): boolean {
  return key === todayKey();
}

export function isYesterday(key: DateKey): boolean {
  return key === dayjs().subtract(1, 'day').format('YYYY-MM-DD');
}

export function formatClock(date: number | Date): string {
  return dayjs(date).format('HH:mm');
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

export function minutesToLabel(min: number): string {
  if (min < 60) return `${min} min`;
  if (min % 60 === 0) return `${min / 60}h`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export function weekdayShort(key: DateKey): string {
  return dayjs(key).format('ddd');
}

export function dayOfMonth(key: DateKey): string {
  return dayjs(key).format('D');
}

export function entriesByDay(
  entries: IntakeEntry[],
): Record<DateKey, IntakeEntry[]> {
  const map: Record<DateKey, IntakeEntry[]> = {};
  for (const e of entries) {
    const k = dateKey(dayjs(e.timestamp));
    if (!map[k]) map[k] = [];
    map[k].push(e);
  }
  return map;
}

export function totalForDay(entries: IntakeEntry[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

export function lastNDayKeys(n: number, endOffset = 0): DateKey[] {
  const keys: DateKey[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dayjs().subtract(i + endOffset, 'day').format('YYYY-MM-DD'));
  }
  return keys;
}

export function lastNDays(n: number, endOffset = 0): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(dayjs().subtract(i + endOffset, 'day').toDate());
  }
  return days;
}
