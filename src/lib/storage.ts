import type { AppStateV1 } from '../types';
import { defaultSettings } from './plan';

const KEY = 'marathon.trainer.v1';

export function loadState(): AppStateV1 {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw) as AppStateV1;
    if (!parsed || parsed.version !== 1) throw new Error('bad version');
    if (!parsed.settings || !parsed.logsByDate) throw new Error('bad shape');
    return parsed;
  } catch {
    return {
      version: 1,
      settings: defaultSettings(),
      logsByDate: {},
    };
  }
}

export function saveState(state: AppStateV1): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(KEY);
}

