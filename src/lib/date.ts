import { addDays, format, parseISO, startOfDay, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { IsoDate } from '../types';

export function toIsoDate(d: Date): IsoDate {
  return format(d, 'yyyy-MM-dd') as IsoDate;
}

export function fromIsoDate(s: IsoDate): Date {
  return startOfDay(parseISO(s));
}

export function addIsoDays(s: IsoDate, days: number): IsoDate {
  return toIsoDate(addDays(fromIsoDate(s), days));
}

export function getStartOfWeek(s: IsoDate): IsoDate {
  // weekStartsOn: 1 (Monday)
  return toIsoDate(startOfWeek(fromIsoDate(s), { weekStartsOn: 1 }));
}

export function formatKoreanShort(s: IsoDate): string {
  const d = fromIsoDate(s);
  return format(d, 'M/d (EEE)', { locale: ko });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
