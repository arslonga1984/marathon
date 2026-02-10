
import { useState, useEffect } from 'react';
import type { TrainingLogEntry, IsoDate } from '../types';
import { formatKm, logEntryToPace } from '../utils/formatter';
import { secondsToHms } from '../lib/plan';

interface LogViewProps {
    logsByDate: Record<IsoDate, TrainingLogEntry>;
    logDate: IsoDate;
    setLogDate: (d: IsoDate) => void;
    onSaveLog: (date: IsoDate, km: number, seconds: number, note: string) => void;
    initialKm: string;
    initialNote: string;
}

export function LogView({ logsByDate, logDate, setLogDate, onSaveLog, initialKm, initialNote }: LogViewProps) {
    const [logKm, setLogKm] = useState<string>(initialKm);
    const [hh, setHh] = useState<string>('0');
    const [mm, setMm] = useState<string>('0');
    const [ss, setSs] = useState<string>('0');
    const [note, setNote] = useState<string>(initialNote);

    // 선택된 날짜의 로그를 불러와서 입력 폼에 채우기
    useEffect(() => {
        const existing = logsByDate[logDate];
        if (existing) {
            setLogKm(String(existing.distanceKm));
            const t = existing.timeSeconds;
            setHh(String(Math.floor(t / 3600)));
            setMm(String(Math.floor((t % 3600) / 60)));
            setSs(String(t % 60));
            setNote(existing.note ?? '');
        } else {
            // 기록이 없으면 초기값(계획 거리 등)으로 설정
            setLogKm(initialKm || '');
            setNote(initialNote || '');
            setHh('0');
            setMm('0');
            setSs('0');
        }
    }, [logDate, logsByDate, initialKm, initialNote]);

    function handleSave() {
        const km = Number(logKm);
        const seconds = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);

        if (!km || km <= 0 || !seconds || seconds <= 0) {
            alert('거리와 시간을 올바르게 입력해주세요.');
            return;
        }
        onSaveLog(logDate, km, seconds, note);
        alert('저장되었습니다.');
    }

    const recentLogs = Object.values(logsByDate)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 14);

    return (
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
                    <button className="btn primary" onClick={handleSave}>
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
    );
}
