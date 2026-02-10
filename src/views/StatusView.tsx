
import { formatKm, typeTitle } from '../utils/formatter';
import type { PlanDay } from '../types';

interface StatusViewProps {
    plannedToDateKm: number;
    actualToDateKm: number;
    completionPct: number;
    nextPlanned?: PlanDay;
    onGoToLog: (date: string, plannedKm: number) => void;
}

export function StatusView({ plannedToDateKm, actualToDateKm, completionPct, nextPlanned, onGoToLog }: StatusViewProps) {
    return (
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
                                    onClick={() => onGoToLog(nextPlanned.date, nextPlanned.plannedKm)}
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
    );
}
