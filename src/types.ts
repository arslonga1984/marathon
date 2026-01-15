export type IsoDate = `${number}-${number}-${number}`; // yyyy-MM-dd

export type WorkoutType = 'rest' | 'easy' | 'tempo' | 'long';

export type PlanDay = {
  date: IsoDate;
  dayIndex: number; // 0..6 (Mon..Sun)
  type: WorkoutType;
  plannedKm: number;
  paceHint: string;
};

export type PlanWeek = {
  weekNumber: number; // 1..24
  startDate: IsoDate;
  endDate: IsoDate;
  targetWeeklyKm: number;
  days: PlanDay[];
};

export type Settings = {
  planStartDate: IsoDate;
  baseWeeklyKm: number; // current weekly volume
  easyPaceMinPerKm?: number; // e.g. 6.5 => 6:30 /km
  tempoPaceMinPerKm?: number;
  peakWeeklyCapKm: number; // safety cap
};

export type TrainingLogEntry = {
  date: IsoDate;
  distanceKm: number;
  timeSeconds: number;
  note?: string;
};

export type AppStateV1 = {
  version: 1;
  settings: Settings;
  logsByDate: Record<IsoDate, TrainingLogEntry>;
};

