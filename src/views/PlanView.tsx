
import { formatKm, dayName, logEntryToPace } from '../utils/formatter';
import type { PlanWeek, IsoDate, TrainingLogEntry } from '../types';
import { formatKoreanShort } from '../lib/date';
import { secondsToHms, workoutLabel } from '../lib/plan';

interface PlanViewProps {
    plan: PlanWeek[];
    selectedWeek: number;
    setSelectedWeek: (w: number) => void;
    logsByDate: Record<IsoDate, TrainingLogEntry>;
    onEditLog: (date: IsoDate) => void;
    onDeleteLog: (date: IsoDate) => void;
    onAddLog: (date: IsoDate, plannedKm: number) => void;
}

export function PlanView({ plan, selectedWeek, setSelectedWeek, logsByDate, onEditLog, onDeleteLog, onAddLog }: PlanViewProps) {
    const week = plan.find((w) => w.weekNumber === selectedWeek) ?? plan[0];

    function sum(arr: number[]): number {
        return arr.reduce((a, b) => a + b, 0);
    }

    const actualWeeklyKm = sum(
        week.days
            .map((d) => logsByDate[d.date]?.distanceKm ?? 0)
            .filter((n) => Number.isFinite(n)),
    );

    const plannedToDateKm = sum(week.days.map((d) => d.plannedKm));
    const completionPct = plannedToDateKm > 0 ? Math.min(100, Math.round((actualWeeklyKm / plannedToDateKm) * 100)) : 0;

    return (
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
                            const log = logsByDate[d.date];
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
                                                        onClick={() => onEditLog(d.date)}
                                                    >
                                                        수정
                                                    </button>
                                                    <button className="btn danger" onClick={() => onDeleteLog(d.date)}>
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn primary"
                                                onClick={() => onAddLog(d.date, d.plannedKm)}
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
                            {formatKm(Math.round(actualWeeklyKm * 10) / 10)}
                        </div>
                        <div className="label">주간 실적</div>
                    </div>
                    <div className="item">
                        <div className="value">{completionPct}%</div>
                        <div className="label">주간 달성률</div>
                    </div>
                </div>

                <div style={{ height: 14 }} />
                <div className="muted" style={{ fontSize: 13 }}>
                    - 원칙: 쉬운 날은 정말 쉽게, 롱런은 천천히(부상 방지). <br />- 팁: 기록은 “거리 + 시간”만 입력하면 페이스가
                    자동 계산됩니다.
                </div>
            </aside>
        </div>
    );
}
