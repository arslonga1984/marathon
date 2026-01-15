import type { IsoDate, PlanDay, PlanWeek, Settings, WorkoutType } from '../types';
import { addIsoDays, clamp, round1, toIsoDate } from './date';

function paceRange(minPerKm: number, deltaSec: number): string {
  const baseSec = Math.round(minPerKm * 60);
  const lo = baseSec - deltaSec;
  const hi = baseSec + deltaSec;
  return `${secToPace(lo)}–${secToPace(hi)}/km`;
}

export function secToPace(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}

export function secondsToHms(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function parseTimeToSeconds(hh: string, mm: string, ss: string): number | null {
  const h = Number(hh || 0);
  const m = Number(mm || 0);
  const s = Number(ss || 0);
  if (![h, m, s].every((n) => Number.isFinite(n) && n >= 0)) return null;
  return Math.round(h * 3600 + m * 60 + s);
}

export function defaultSettings(today = new Date()): Settings {
  return {
    planStartDate: toIsoDate(today),
    baseWeeklyKm: 10,
    peakWeeklyCapKm: 55,
  };
}

function typeDot(t: WorkoutType): string {
  if (t === 'easy') return 'easy';
  if (t === 'tempo') return 'tempo';
  if (t === 'long') return 'long';
  return 'rest';
}

export function workoutLabel(t: WorkoutType): { label: string; dot: string } {
  const dot = typeDot(t);
  if (t === 'rest') return { label: '휴식', dot };
  if (t === 'easy') return { label: '이지', dot };
  if (t === 'tempo') return { label: '템포', dot };
  return { label: '롱런', dot };
}

function paceHintFor(type: WorkoutType, s: Settings): string {
  if (type === 'rest') return '완전 휴식 또는 가벼운 스트레칭';
  if (type === 'easy') {
    if (s.easyPaceMinPerKm) return `이지 ${paceRange(s.easyPaceMinPerKm, 30)}`;
    return 'RPE 3–4 (편하게 대화 가능)';
  }
  if (type === 'tempo') {
    if (s.tempoPaceMinPerKm) return `템포 ${paceRange(s.tempoPaceMinPerKm, 20)}`;
    return 'RPE 6–7 (숨차지만 유지 가능)';
  }
  // long
  if (s.easyPaceMinPerKm) return `이지 ${paceRange(s.easyPaceMinPerKm, 40)} (느리게)`;
  return 'RPE 3–4 (지속 가능한 페이스)';
}

function weeklyTargetKm(week: number, baseWeeklyKm: number, cap: number): number {
  // 24주 초보 완주형: 점진 증가 + 4주마다 컷백 + 마지막 3주 테이퍼
  // 주 22~24는 테이퍼/레이스주로 별도 처리
  if (week >= 22) return 0;

  const growth = Math.pow(1.085, week - 1); // ~8.5%/week
  let km = baseWeeklyKm * growth;

  // 컷백: 4,8,12,16,20주
  if (week % 4 === 0) km *= 0.8;

  // 너무 급격히 커지지 않게 캡
  km = clamp(km, baseWeeklyKm, cap);
  return round1(km);
}

function longRunTargetKm(week: number): number {
  // 6km에서 시작해 32km까지 완만하게 증가
  // 컷백 주에는 롱런도 줄임
  if (week === 24) return 42.195;
  if (week >= 22) return week === 23 ? 16 : 24; // 22: 24km, 23: 16km, 24: race

  let km = 6 + (week - 1) * 1.25; // ~1.25km/wk
  km = clamp(km, 6, 32);
  if (week % 4 === 0) km *= 0.85;
  return round1(km);
}

function distributeWeek(week: number, targetKm: number): { easy1: number; tempo: number; easy2: number; long: number } {
  // 4회 러닝: 이지/템포/이지/롱런 (월/수/금 휴식)
  const long = longRunTargetKm(week);
  if (week >= 22 && week <= 23) {
    // 테이퍼: 강도/볼륨 감소, 짧은 템포 1회 유지
    const tempo = week === 22 ? 6 : 5;
    const easy1 = week === 22 ? 6 : 5;
    const easy2 = week === 22 ? 5 : 4;
    return { easy1, tempo, easy2, long };
  }
  if (week === 24) {
    return { easy1: 5, tempo: 0, easy2: 3, long };
  }

  // 목표 주간거리가 롱런보다 작지 않도록 보정
  const adjustedTarget = Math.max(targetKm, long + 8);
  const tempo = round1(adjustedTarget * 0.22);
  const easy1 = round1(adjustedTarget * 0.18);
  const easy2 = round1(Math.max(4, adjustedTarget - long - tempo - easy1));
  return { easy1, tempo, easy2, long };
}

export function generate24WeekPlan(settings: Settings): PlanWeek[] {
  const weeks: PlanWeek[] = [];

  for (let w = 1; w <= 24; w++) {
    const start = addIsoDays(settings.planStartDate, (w - 1) * 7);
    const end = addIsoDays(start, 6);

    const target = w >= 22 ? 0 : weeklyTargetKm(w, settings.baseWeeklyKm, settings.peakWeeklyCapKm);
    const dist = distributeWeek(w, target);

    const days: PlanDay[] = [];
    // 0..6 = Mon..Sun
    const schedule: Array<{ idx: number; type: WorkoutType; km: number }> = [
      { idx: 0, type: 'rest', km: 0 },
      { idx: 1, type: 'easy', km: dist.easy1 },
      { idx: 2, type: 'rest', km: 0 },
      { idx: 3, type: dist.tempo > 0 ? 'tempo' : 'rest', km: dist.tempo },
      { idx: 4, type: 'rest', km: 0 },
      { idx: 5, type: 'easy', km: dist.easy2 },
      { idx: 6, type: 'long', km: dist.long },
    ];

    for (const s of schedule) {
      const date = addIsoDays(start, s.idx);
      days.push({
        date,
        dayIndex: s.idx,
        type: s.type,
        plannedKm: round1(s.km),
        paceHint: paceHintFor(s.type, settings),
      });
    }

    const targetWeeklyKm = round1(days.reduce((sum, d) => sum + d.plannedKm, 0));

    weeks.push({
      weekNumber: w,
      startDate: start,
      endDate: end,
      targetWeeklyKm,
      days,
    });
  }

  return weeks;
}

