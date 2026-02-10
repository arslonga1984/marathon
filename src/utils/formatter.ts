
import { round1 } from '../lib/date';
import { secToPace, workoutLabel } from '../lib/plan';
import type { TrainingLogEntry, WorkoutType } from '../types';

export function formatKm(km: number): string {
    if (km === 0) return '-';
    return `${round1(km)} km`;
}

export function sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
}

export function typeTitle(t: WorkoutType): string {
    const { label } = workoutLabel(t);
    return label;
}

export function logEntryToPace(entry: TrainingLogEntry): string {
    if (!entry.distanceKm || !entry.timeSeconds) return '-';
    const secPerKm = entry.timeSeconds / entry.distanceKm;
    return `${secToPace(secPerKm)}/km`;
}

export function dayName(idx: number): string {
    return ['월', '화', '수', '목', '금', '토', '일'][idx] ?? '';
}

export function asNumber(v: string): number | null {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return n;
}
