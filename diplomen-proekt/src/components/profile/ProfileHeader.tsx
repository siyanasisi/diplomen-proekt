interface ProfileHeaderProps {
    role: string | null;
    onNavigateHome: () => void;
    title?: string;
    subtitle?: string;
    currentStreak?: number;
    showStreak?: boolean;
}

export function ProfileHeader({
    role,
    onNavigateHome,
    title = "Профил",
    subtitle = "Управление на акаунта и настройки",
    currentStreak = 0,
    showStreak = true,
}: ProfileHeaderProps) {
    return (
        <header style={{ marginBottom: '2rem' }}>
            <button
                onClick={onNavigateHome}
                className="flex items-center text-slate-500 hover:text-purple-700 transition-colors"
                style={{ fontSize: '0.8125rem', fontWeight: 600, gap: '0.25rem', marginBottom: '0.75rem' }}
            >
                <span className="material-icons" style={{ fontSize: '1.125rem' }}>chevron_left</span>
                Назад към начало
            </button>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h1>
                    <p className="text-slate-500" style={{ fontSize: '0.9375rem', marginTop: '0.25rem' }}>{subtitle}</p>
                </div>
                {showStreak && role === "student" && (
                    <div
                        className="flex items-center bg-white border border-slate-200"
                        style={{ gap: '0.75rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}
                    >
                        <div className="flex items-center justify-center bg-purple-50 text-purple-700" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem' }}>
                            <span className="material-icons" style={{ fontSize: '1.375rem' }}>local_fire_department</span>
                        </div>
                        <div>
                            <p className="text-slate-900" style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{currentStreak}</p>
                            <p className="text-slate-500 uppercase" style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em' }}>дни серия</p>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
