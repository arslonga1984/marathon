import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AppStateV1, IsoDate, Settings, TrainingLogEntry, WorkoutType } from './types';
import { formatKoreanShort, fromIsoDate, round1, toIsoDate } from './lib/date';
import { defaultSettings, generate24WeekPlan, parseTimeToSeconds, secToPace, secondsToHms, workoutLabel } from './lib/plan';
import { auth } from './lib/firebase';
import { loadUserState, saveUserState, clearUserState } from './lib/firestore';
import { LoginScreen } from './components/LoginScreen';

type Tab = 'plan' | 'log' | 'progress' | 'status' | 'settings';

function formatKm(km: number): string {
  if (km === 0) return '-';
  return `${round1(km)} km`;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function typeTitle(t: WorkoutType): string {
  const { label } = workoutLabel(t);
  return label;
}

function logEntryToPace(entry: TrainingLogEntry): string {
  if (!entry.distanceKm || !entry.timeSeconds) return '-';
  const secPerKm = entry.timeSeconds / entry.distanceKm;
  return `${secToPace(secPerKm)}/km`;
}

function dayName(idx: number): string {
  return ['월', '화', '수', '목', '금', '토', '일'][idx] ?? '';
}

function asNumber(v: string): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function App() {
  // ===== 모든 Hook은 컴포넌트 최상단에서 항상 실행되어야 합니다 =====
  // React Hook 규칙: Hook은 항상 같은 순서로 호출되어야 하며,
  // 조건문이나 return 문 이후에 호출되면 안 됩니다.
  
  // 1. 모든 useState Hook 선언
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('plan');
  const [state, setState] = useState<AppStateV1 | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [logDate, setLogDate] = useState<IsoDate>(() => toIsoDate(new Date()));
  const [logKm, setLogKm] = useState<string>('');
  const [hh, setHh] = useState<string>('0');
  const [mm, setMm] = useState<string>('0');
  const [ss, setSs] = useState<string>('0');
  const [note, setNote] = useState<string>('');

  // 2. 모든 useEffect Hook 선언
  // 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 사용자 데이터 로드
        try {
          const userData = await loadUserState(currentUser.uid);
          setState(userData);
        } catch (error) {
          console.error('Failed to load user data:', error);
          alert('데이터를 불러오는데 실패했습니다.');
          // 로그인은 되었지만 데이터 로드 실패 시에도 빈 화면이 나오지 않게 null로 두지 않음
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

  // 상태가 변경될 때마다 Firestore에 저장
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

  const plan = useMemo(() => {
    const settings = state?.settings ?? defaultSettings();
    return generate24WeekPlan(settings);
  }, [state?.settings]);

  useEffect(() => {
    // auto-select current week based on today
    if (!state) return;
    const start = fromIsoDate(state.settings.planStartDate).getTime();
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - start) / (1000 * 60 * 60 * 24));
    const w = Math.floor(diffDays / 7) + 1;
    if (w >= 1 && w <= 24) setSelectedWeek(w);
  }, [state?.settings.planStartDate]);

  const week = plan.find((w) => w.weekNumber === selectedWeek) ?? plan[0];

  const todayIso = toIsoDate(new Date());
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

  // 로그 입력 필드 동기화
  useEffect(() => {
    if (!state) return;
    const existing = state.logsByDate[logDate];
    if (!existing) return;
    setLogKm(String(existing.distanceKm));
    const t = existing.timeSeconds;
    setHh(String(Math.floor(t / 3600)));
    setMm(String(Math.floor((t % 3600) / 60)));
    setSs(String(t % 60));
    setNote(existing.note ?? '');
  }, [logDate, state]);

  function saveLog(): void {
    if (!state) return;
    const km = asNumber(logKm);
    const seconds = parseTimeToSeconds(hh, mm, ss);
    if (!km || km <= 0 || !seconds || seconds <= 0) return;

    const entry: TrainingLogEntry = {
      date: logDate,
      distanceKm: round1(km),
      timeSeconds: seconds,
      note: note.trim() ? note.trim() : undefined,
    };
    setState((s) => {
      if (!s) return s;
      return { ...s, logsByDate: { ...s.logsByDate, [logDate]: entry } };
    });
  }

  function deleteLog(date: IsoDate): void {
    if (!state) return;
    setState((s) => {
      if (!s) return s;
      const copy = { ...s.logsByDate };
      delete copy[date];
      return { ...s, logsByDate: copy };
    });
  }

  function updateSettings(partial: Partial<Settings>): void {
    if (!state) return;
    setState((s) => {
      if (!s) return s;
      return { ...s, settings: { ...s.settings, ...partial } };
    });
  }

  const recentLogs = useMemo(() => {
    if (!state) return [];
    return Object.values(state.logsByDate)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 14);
  }, [state]);

  const nextPlanned = useMemo(() => {
    const allDays = plan.flatMap((w) => w.days);
    return allDays.find((d) => d.date >= todayIso && d.type !== 'rest') ?? allDays.find((d) => d.date >= todayIso);
  }, [plan, todayIso]);

  // ---- Render 분기 (Hook 이후에만) ----
  // 인증 정보는 있지만 유저 상태를 아직 못 불러온 경우도 로딩으로 처리
  if (loading || (user && !state)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="muted">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // 방어: 여기까지 왔는데도 state가 없으면 로딩 처리
  if (!state) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="muted">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-title">24주 마라톤 플래너</div>
            <div className="brand-subtitle">
              {user.displayName ? `${user.displayName}님, 초보(주 10km) → 풀코스 완주` : '초보(주 10km) → 풀코스 완주'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="muted" style={{ fontSize: '13px', textAlign: 'right' }}>
              <div>{user.displayName ?? '로그인됨'}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{user.email}</div>
            </div>
            <button className="btn" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '13px' }}>
              로그아웃
            </button>
          </div>
          <nav className="tabs" aria-label="탭">
            <button className="tab" aria-current={tab === 'plan' ? 'page' : undefined} onClick={() => setTab('plan')}>
              훈련계획
            </button>
            <button className="tab" aria-current={tab === 'log' ? 'page' : undefined} onClick={() => setTab('log')}>
              기록
            </button>
            <button
              className="tab"
              aria-current={tab === 'progress' ? 'page' : undefined}
              onClick={() => setTab('progress')}
            >
              진행률
            </button>
            <button
              className="tab"
              aria-current={tab === 'status' ? 'page' : undefined}
              onClick={() => setTab('status')}
            >
              목표상태
            </button>
            <button
              className="tab"
              aria-current={tab === 'settings' ? 'page' : undefined}
              onClick={() => setTab('settings')}
            >
              설정
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {tab === 'plan' && (
          <div className="grid">
            <section className="card">
              <h2>주차별 훈련 계획</h2>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="field">
                  <label>주차 선택</label>
                  <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))}>
                    {plan.map((w) => (
                      <option key={w.weekNumber} value={w.weekNumber}>
                        {w.weekNumber}주차 ({w.startDate} ~ {w.endDate})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>주간 목표 거리</label>
                  <div style={{ padding: '10px 10px' }} className="muted">
                    <strong style={{ color: 'var(--text)' }}>{formatKm(week.targetWeeklyKm)}</strong>
                  </div>
                </div>
              </div>

              <div style={{ height: 10 }} />

              <table className="table">
                <thead>
                  <tr>
                    <th>요일/날짜</th>
                    <th>종류</th>
                    <th>계획</th>
                    <th>페이스</th>
                    <th>실행(기록)</th>
                  </tr>
                </thead>
                <tbody>
                  {week.days.map((d) => {
                    const log = state.logsByDate[d.date];
                    const { label, dot } = workoutLabel(d.type);
                    return (
                      <tr key={d.date}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div>
                              <strong>{dayName(d.dayIndex)}</strong> · {d.date}
                            </div>
                            <div className="muted" style={{ fontSize: 12 }}>
                              {formatKoreanShort(d.date)}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge">
                            <span className={`dot ${dot}`} />
                            {label}
                          </span>
                        </td>
                        <td>{formatKm(d.plannedKm)}</td>
                        <td className="muted">{d.paceHint}</td>
                        <td>
                          {log ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div>
                                <strong>{formatKm(log.distanceKm)}</strong> · {secondsToHms(log.timeSeconds)} ·{' '}
                                <span className="muted">{logEntryToPace(log)}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                  className="btn"
                                  onClick={() => {
                                    setTab('log');
                                    setLogDate(d.date);
                                  }}
                                >
                                  수정
                                </button>
                                <button className="btn danger" onClick={() => deleteLog(d.date)}>
                                  삭제
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="btn primary"
                              onClick={() => {
                                setTab('log');
                                setLogDate(d.date);
                                setLogKm(String(d.plannedKm || ''));
                                setHh('0');
                                setMm('0');
                                setSs('0');
                                setNote('');
                              }}
                              disabled={d.type === 'rest'}
                              title={d.type === 'rest' ? '휴식일은 기록을 생략해도 됩니다.' : undefined}
                            >
                              기록하기
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <aside className="card">
              <h2>이번 주 요약</h2>
              <div className="kpi">
                <div className="item">
                  <div className="value">{formatKm(week.targetWeeklyKm)}</div>
                  <div className="label">주간 계획</div>
                </div>
                <div className="item">
                  <div className="value">
                    {formatKm(round1(sum(week.days.map((d) => state.logsByDate[d.date]?.distanceKm ?? 0))))}
                  </div>
                  <div className="label">주간 실적</div>
                </div>
                <div className="item">
                  <div className="value">{completionPct}%</div>
                  <div className="label">전체(오늘까지) 달성률</div>
                </div>
              </div>

              <div style={{ height: 14 }} />
              <div className="muted" style={{ fontSize: 13 }}>
                - 원칙: 쉬운 날은 정말 쉽게, 롱런은 천천히(부상 방지). <br />- 팁: 기록은 “거리 + 시간”만 입력하면 페이스가
                자동 계산됩니다.
              </div>
            </aside>
          </div>
        )}

        {tab === 'log' && (
          <div className="grid">
            <section className="card">
              <h2>일일 훈련 기록</h2>
              <div className="row">
                <div className="field">
                  <label>날짜</label>
                  <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value as IsoDate)} />
                </div>
                <div className="field">
                  <label>거리 (km)</label>
                  <input inputMode="decimal" placeholder="예: 8.0" value={logKm} onChange={(e) => setLogKm(e.target.value)} />
                </div>
                <div className="field">
                  <label>시간 (h:m:s)</label>
                  <div className="row" style={{ gap: 6 }}>
                    <input style={{ width: 70 }} value={hh} onChange={(e) => setHh(e.target.value)} />
                    <input style={{ width: 70 }} value={mm} onChange={(e) => setMm(e.target.value)} />
                    <input style={{ width: 70 }} value={ss} onChange={(e) => setSs(e.target.value)} />
                  </div>
                </div>
                <div className="field" style={{ flex: 1, minWidth: 220 }}>
                  <label>메모(선택)</label>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 다리 무거움 / 날씨" />
                </div>
                <button className="btn primary" onClick={saveLog}>
                  저장
                </button>
              </div>

              <div style={{ height: 10 }} />
              <div className="muted" style={{ fontSize: 13 }}>
                저장 위치: **Firebase 클라우드** (모든 기기에서 동기화)
              </div>
            </section>

            <aside className="card">
              <h2>최근 기록</h2>
              {recentLogs.length === 0 ? (
                <div className="muted">아직 기록이 없어요. 오늘 훈련부터 입력해보세요.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>거리</th>
                      <th>시간</th>
                      <th>페이스</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((e) => (
                      <tr key={e.date}>
                        <td>{e.date}</td>
                        <td>{formatKm(e.distanceKm)}</td>
                        <td>{secondsToHms(e.timeSeconds)}</td>
                        <td className="muted">{logEntryToPace(e)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </aside>
          </div>
        )}

        {tab === 'progress' && (
          <div className="grid">
            <section className="card">
              <h2>주간 거리: 계획 vs 실적</h2>
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer>
                  <BarChart data={weeklyChart}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="week" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planned" name="계획(km)" fill="rgba(110,168,255,0.55)" />
                    <Bar dataKey="actual" name="실적(km)" fill="rgba(57,217,138,0.55)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                목표는 “완벽히 다 함”이 아니라 **지속 가능하게 누적**이에요. 실적이 밀리면 다음 주는 무리하지 말고
                1주 정도만 살짝 조정하세요.
              </div>
            </section>

            <aside className="card">
              <h2>롱런 추이</h2>
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer>
                  <LineChart data={longRunChart}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="week" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="planned" name="계획 롱런(km)" stroke="rgba(110,168,255,0.9)" dot={false} />
                    <Line type="monotone" dataKey="actual" name="실적 롱런(km)" stroke="rgba(57,217,138,0.9)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </aside>
          </div>
        )}

        {tab === 'status' && (
          <div className="grid">
            <section className="card">
              <h2>목표 대비 현재 상태</h2>
              <div className="kpi">
                <div className="item">
                  <div className="value">{formatKm(plannedToDateKm)}</div>
                  <div className="label">오늘까지 계획 누적</div>
                </div>
                <div className="item">
                  <div className="value">{formatKm(actualToDateKm)}</div>
                  <div className="label">오늘까지 실적 누적</div>
                </div>
                <div className="item">
                  <div className="value">{completionPct}%</div>
                  <div className="label">달성률</div>
                </div>
              </div>

              <div style={{ height: 14 }} />
              <div className="card" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <h2 style={{ marginBottom: 6 }}>다음 훈련</h2>
                {nextPlanned ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>
                      <strong>{nextPlanned.date}</strong> · {typeTitle(nextPlanned.type)} ·{' '}
                      <strong>{formatKm(nextPlanned.plannedKm)}</strong>
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {nextPlanned.paceHint}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn primary"
                        onClick={() => {
                          setTab('log');
                          setLogDate(nextPlanned.date);
                          setLogKm(String(nextPlanned.plannedKm || ''));
                          setHh('0');
                          setMm('0');
                          setSs('0');
                          setNote('');
                        }}
                        disabled={nextPlanned.type === 'rest'}
                      >
                        기록 입력하러 가기
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="muted">플랜이 아직 없어요. 설정에서 시작일을 확인해 주세요.</div>
                )}
              </div>
            </section>

            <aside className="card">
              <h2>빠른 체크</h2>
              <div className="muted" style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  - **부상 징후(통증)**가 2~3일 지속되면: 강도/거리 즉시 줄이고 휴식 우선
                </div>
                <div>
                  - **롱런**은 “완주”가 목표: 느리게, 중간에 걷기 섞어도 OK
                </div>
                <div>
                  - 너무 힘들면 설정에서 **주간 기본 거리**를 낮추면 플랜이 자동으로 완만해져요
                </div>
              </div>
            </aside>
          </div>
        )}

        {tab === 'settings' && (
          <div className="grid">
            <section className="card">
              <h2>설정</h2>
              <div className="row">
                <div className="field">
                  <label>플랜 시작일</label>
                  <input
                    type="date"
                    value={state.settings.planStartDate}
                    onChange={(e) => updateSettings({ planStartDate: e.target.value as IsoDate })}
                  />
                </div>
                <div className="field">
                  <label>현재 주간 거리(km)</label>
                  <input
                    inputMode="decimal"
                    value={String(state.settings.baseWeeklyKm)}
                    onChange={(e) => updateSettings({ baseWeeklyKm: Number(e.target.value || 0) })}
                  />
                </div>
                <div className="field">
                  <label>이지 페이스(분/㎞, 선택)</label>
                  <input
                    inputMode="decimal"
                    placeholder="예: 7.0"
                    value={state.settings.easyPaceMinPerKm ?? ''}
                    onChange={(e) =>
                      updateSettings({ easyPaceMinPerKm: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div className="field">
                  <label>템포 페이스(분/㎞, 선택)</label>
                  <input
                    inputMode="decimal"
                    placeholder="예: 6.0"
                    value={state.settings.tempoPaceMinPerKm ?? ''}
                    onChange={(e) =>
                      updateSettings({ tempoPaceMinPerKm: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div className="field">
                  <label>주간 최대치 캡(km)</label>
                  <input
                    inputMode="decimal"
                    value={String(state.settings.peakWeeklyCapKm)}
                    onChange={(e) => updateSettings({ peakWeeklyCapKm: Number(e.target.value || 0) })}
                  />
                </div>
              </div>

              <div style={{ height: 14 }} />
              <div className="muted" style={{ fontSize: 13 }}>
                페이스를 입력하지 않으면 RPE(체감 강도)로 안내합니다. 초보자는 **이스지/롱런을 느리게** 가져가는 것이
                완주에 가장 크게 도움이 돼요.
              </div>
            </section>

            <aside className="card">
              <h2>데이터</h2>
              <div className="muted" style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
                  - 모든 데이터는 **Firebase 클라우드**에 저장되어 모든 기기에서 동기화됩니다.
      </div>
                <button
                  className="btn danger"
                  onClick={async () => {
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
                  }}
                >
                  모든 데이터 초기화
        </button>
              </div>
            </aside>
          </div>
        )}
      </main>
      </div>
  );
}

