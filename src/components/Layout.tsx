
import { NavLink } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { LogOut, User as UserIcon } from 'lucide-react';

interface LayoutProps {
    user: User;
    onLogout: () => void;
    children: React.ReactNode;
}

export function Layout({ user, onLogout, children }: LayoutProps) {
    return (
        <div className="app">
            <header className="topbar">
                <div className="topbar-inner">
                    <div className="brand">
                        <div className="brand-title">24주 마라톤 플래너</div>
                        <div className="brand-subtitle">
                            {user.displayName ? `${user.displayName}님` : '초보(주 10km) → 풀코스 완주'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="muted" style={{ fontSize: '13px', textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{user.displayName ?? '사용자'}</span>
                            <span style={{ opacity: 0.6 }}>{user.email}</span>
                        </div>
                        <button className="btn" onClick={onLogout} style={{ padding: '8px', borderRadius: '50%' }} title="로그아웃">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="topbar-inner" style={{ paddingTop: 0, paddingBottom: '0.5rem', marginTop: '-0.5rem' }}>
                    <nav className="tabs">
                        <NavLink
                            to="/plan"
                            className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
                        >
                            훈련계획
                        </NavLink>
                        <NavLink
                            to="/log"
                            className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
                        >
                            기록
                        </NavLink>
                        <NavLink
                            to="/progress"
                            className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
                        >
                            진행률
                        </NavLink>
                        <NavLink
                            to="/status"
                            className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
                        >
                            목표상태
                        </NavLink>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
                        >
                            설정
                        </NavLink>
                    </nav>
                </div>
            </header>

            <main className="container">
                {children}
            </main>
        </div>
    );
}
