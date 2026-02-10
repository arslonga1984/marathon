
import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useMarathonData } from './hooks/useMarathonData';
import { Layout } from './components/Layout';
import { PlanView } from './views/PlanView';
import { LogView } from './views/LogView';
import { ProgressView } from './views/ProgressView';
import { StatusView } from './views/StatusView';
import { SettingsView } from './views/SettingsView';
import { LoginScreen } from './components/LoginScreen';
import { defaultSettings, generate24WeekPlan } from './lib/plan';
import { fromIsoDate, round1, toIsoDate } from './lib/date';
import type { IsoDate } from './types';

export default function App() {
  const { user, loading: dataLoading, state, handleLogout, saveLog, deleteLog, updateSettings, resetData } = useMarathonData();
  const navigate = useNavigate();

  // UI States
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [logDate, setLogDate] = useState<IsoDate>(() => toIsoDate(new Date()));
  const [initialLogKm, setInitialLogKm] = useState<string>('');
  const [initialLogNote, setInitialLogNote] = useState<string>('');

  // Plan Calculation
  const plan = useMemo(() => {
    const settings = state?.settings ?? defaultSettings();
    return generate24WeekPlan(settings);
  }, [state?.settings]);

  // Auto-select current week
  useEffect(() => {
    if (!state) return;
    const start = fromIsoDate(state.settings.planStartDate).getTime();
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - start) / (1000 * 60 * 60 * 24));
    const w = Math.floor(diffDays / 7) + 1;
    if (w >= 1 && w <= 24) setSelectedWeek(w);
  }, [state?.settings.planStartDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived Data
  const todayIso = toIsoDate(new Date());

  function sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
  }

  const pastDays = useMemo(() => {
    const allDays = plan.flatMap((w) => w.days);
    return allDays.filter((d) => d.date <= todayIso);
  }, [plan, todayIso]);

  const plannedToDateKm = useMemo(() => sum(pastDays.map((d) => d.plannedKm)), [pastDays]);

  const actualToDateKm = useMemo(() => {
    if (!state) return 0;
    return sum(Object.values(state.logsByDate).map((e) => e.distanceKm));
  }, [state]);

  const completionPct = plannedToDateKm > 0 ? Math.min(100, Math.round((actualToDateKm / plannedToDateKm) * 100)) : 0;

  const weeklyChart = useMemo(() => {
    return plan.map((w) => {
      const planned = round1(sum(w.days.map((d) => d.plannedKm)));
      const actual = round1(
        sum(
          w.days
            .map((d) => (state ? state.logsByDate[d.date]?.distanceKm ?? 0 : 0))
            .filter((n) => Number.isFinite(n)),
        ),
      );
      return { week: `W${w.weekNumber}`, planned, actual };
    });
  }, [plan, state]);

  const longRunChart = useMemo(() => {
    return plan.map((w) => {
      const longDay = w.days.find((d) => d.type === 'long');
      const planned = longDay?.plannedKm ?? 0;
      const actual = longDay && state ? state.logsByDate[longDay.date]?.distanceKm ?? 0 : 0;
      return { week: w.weekNumber, planned, actual };
    });
  }, [plan, state]);

  const nextPlanned = useMemo(() => {
    const allDays = plan.flatMap((w) => w.days);
    return allDays.find((d) => d.date >= todayIso && d.type !== 'rest') ?? allDays.find((d) => d.date >= todayIso);
  }, [plan, todayIso]);

  // Handlers for cross-tab navigation
  const handleEditLog = (date: IsoDate) => {
    setLogDate(date);
    setInitialLogKm('');
    setInitialLogNote('');
    navigate('/log');
  };

  const handleAddLog = (date: IsoDate, plannedKm: number) => {
    setLogDate(date);
    setInitialLogKm(String(plannedKm));
    setInitialLogNote('');
    navigate('/log');
  };

  const handleGoToLog = (date: string, plannedKm: number) => {
    setLogDate(date as IsoDate);
    setInitialLogKm(String(plannedKm));
    navigate('/log');
  }


  // Render
  if (dataLoading || (user && !state)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner"></div> {/* Spinner logic can be improved later */}
        <div className="muted">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!state) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="muted">초기화 중...</div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/plan" replace />} />
        <Route path="/plan" element={
          <PlanView
            plan={plan}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            logsByDate={state.logsByDate}
            onEditLog={handleEditLog}
            onDeleteLog={deleteLog}
            onAddLog={handleAddLog}
          />
        } />
        <Route path="/log" element={
          <LogView
            logsByDate={state.logsByDate}
            logDate={logDate}
            setLogDate={setLogDate}
            onSaveLog={saveLog}
            initialKm={initialLogKm}
            initialNote={initialLogNote}
          />
        } />
        <Route path="/progress" element={
          <ProgressView
            weeklyChart={weeklyChart}
            longRunChart={longRunChart}
          />
        } />
        <Route path="/status" element={
          <StatusView
            plannedToDateKm={plannedToDateKm}
            actualToDateKm={actualToDateKm}
            completionPct={completionPct}
            nextPlanned={nextPlanned}
            onGoToLog={handleGoToLog}
          />
        } />
        <Route path="/settings" element={
          <SettingsView
            settings={state.settings}
            updateSettings={updateSettings}
            onResetData={resetData}
          />
        } />
        <Route path="*" element={<Navigate to="/plan" replace />} />
      </Routes>
    </Layout>
  );
}
