
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

interface ProgressViewProps {
    weeklyChart: { week: string; planned: number; actual: number }[];
    longRunChart: { week: number; planned: number; actual: number }[];
}

export function ProgressView({ weeklyChart, longRunChart }: ProgressViewProps) {
    return (
        <div className="grid">
            <section className="card">
                <h2>주간 거리: 계획 vs 실적</h2>
                <div style={{ width: '100%', height: 360 }}>
                    <ResponsiveContainer>
                        <BarChart data={weeklyChart}>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="week" stroke="rgba(255,255,255,0.6)" />
                            <YAxis stroke="rgba(255,255,255,0.6)" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#222', border: '1px solid #444', color: '#fff' }}
                            />
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
                            <Tooltip
                                contentStyle={{ backgroundColor: '#222', border: '1px solid #444', color: '#fff' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="planned" name="계획 롱런(km)" stroke="rgba(110,168,255,0.9)" dot={false} />
                            <Line type="monotone" dataKey="actual" name="실적 롱런(km)" stroke="rgba(57,217,138,0.9)" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </aside>
        </div>
    );
}
