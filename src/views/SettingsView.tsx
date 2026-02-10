
import type { Settings, IsoDate } from '../types';

interface SettingsViewProps {
    settings: Settings;
    updateSettings: (partial: Partial<Settings>) => void;
    onResetData: () => void;
}

export function SettingsView({ settings, updateSettings, onResetData }: SettingsViewProps) {
    return (
        <div className="grid">
            <section className="card">
                <h2>설정</h2>
                <div className="row">
                    <div className="field">
                        <label>플랜 시작일</label>
                        <input
                            type="date"
                            value={settings.planStartDate}
                            onChange={(e) => updateSettings({ planStartDate: e.target.value as IsoDate })}
                        />
                    </div>
                    <div className="field">
                        <label>현재 주간 거리(km)</label>
                        <input
                            inputMode="decimal"
                            value={String(settings.baseWeeklyKm)}
                            onChange={(e) => updateSettings({ baseWeeklyKm: Number(e.target.value || 0) })}
                        />
                    </div>
                    <div className="field">
                        <label>이지 페이스(분/㎞, 선택)</label>
                        <input
                            inputMode="decimal"
                            placeholder="예: 7.0"
                            value={settings.easyPaceMinPerKm ?? ''}
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
                            value={settings.tempoPaceMinPerKm ?? ''}
                            onChange={(e) =>
                                updateSettings({ tempoPaceMinPerKm: e.target.value ? Number(e.target.value) : undefined })
                            }
                        />
                    </div>
                    <div className="field">
                        <label>주간 최대치 캡(km)</label>
                        <input
                            inputMode="decimal"
                            value={String(settings.peakWeeklyCapKm)}
                            onChange={(e) => updateSettings({ peakWeeklyCapKm: Number(e.target.value || 0) })}
                        />
                    </div>
                </div>

                <div style={{ height: 14 }} />
                <div className="muted" style={{ fontSize: 13 }}>
                    페이스를 입력하지 않으면 RPE(체감 강도)로 안내합니다. 초보자는 **이지/롱런을 느리게** 가져가는 것이
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
                        onClick={onResetData}
                    >
                        모든 데이터 초기화
                    </button>
                </div>
            </aside>
        </div>
    );
}
