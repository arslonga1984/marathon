import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { loadUserState, saveUserState, clearUserState } from '../lib/firestore';
import { defaultSettings, parseTimeToSeconds } from '../lib/plan';
import { round1, toIsoDate } from '../lib/date';
import type { AppStateV1, IsoDate, Settings, TrainingLogEntry } from '../types';

export function useMarathonData() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppStateV1 | null>(null);

  // 인증 상태 감지 및 데이터 로드
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userData = await loadUserState(currentUser.uid);
          setState(userData);
        } catch (error) {
          console.error('Failed to load user data:', error);
          // 실패 시 기본값 설정 (빈 화면 방지)
          setState({
            version: 1,
            settings: defaultSettings(),
            logsByDate: {},
          });
        }
      } else {
        setState(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 상태 변경 시 자동 저장
  useEffect(() => {
    if (user && state) {
      saveUserState(user.uid, state).catch((error) => {
        console.error('Failed to save user data:', error);
      });
    }
  }, [state, user]);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      alert('로그아웃에 실패했습니다.');
    }
  }

  function saveLog(date: IsoDate, km: number, seconds: number, note: string) {
    if (!state) return;

    const entry: TrainingLogEntry = {
      date,
      distanceKm: round1(km),
      timeSeconds: seconds,
      note: note.trim() ? note.trim() : undefined,
    };

    setState((s) => {
      if (!s) return s;
      return { ...s, logsByDate: { ...s.logsByDate, [date]: entry } };
    });
  }

  function deleteLog(date: IsoDate) {
    if (!state) return;
    setState((s) => {
      if (!s) return s;
      const copy = { ...s.logsByDate };
      delete copy[date];
      return { ...s, logsByDate: copy };
    });
  }

  function updateSettings(partial: Partial<Settings>) {
    if (!state) return;
    setState((s) => {
      if (!s) return s;
      return { ...s, settings: { ...s.settings, ...partial } };
    });
  }

  async function resetData() {
    if (!user) return;
    if (!confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      await clearUserState(user.uid);
      const freshState = await loadUserState(user.uid);
      setState(freshState);
      alert('데이터가 초기화되었습니다.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('데이터 초기화에 실패했습니다.');
    }
  }

  return {
    user,
    loading,
    state,
    handleLogout,
    saveLog,
    deleteLog,
    updateSettings,
    resetData
  };
}
