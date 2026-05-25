interface ProfileStatsProps {
    currentStreak: number;
    longestStreak: number;
    earnedPoints: number;
    totalEvents: number;
}

export function ProfileStats({ currentStreak, longestStreak, earnedPoints, totalEvents }: ProfileStatsProps) {
    const stats = [
        { value: currentStreak, label: "Текуща серия", icon: "local_fire_department", iconBg: "bg-purple-50 text-purple-700" },
        { value: longestStreak, label: "Най-дълга серия", icon: "emoji_events", iconBg: "bg-amber-50 text-amber-600" },
        { value: earnedPoints, label: "Точки", icon: "stars", iconBg: "bg-emerald-50 text-emerald-600" },
        { value: totalEvents, label: "Събития", icon: "calendar_month", iconBg: "bg-purple-50 text-purple-700" },
    ];

    return (
        <section>
            <h3 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.75rem' }}>Статистика</h3>
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '1rem' }}>
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-white border border-slate-200"
                        style={{ borderRadius: '1rem', padding: '1.25rem' }}
                    >
                        <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className={`flex items-center justify-center ${stat.iconBg}`} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.25rem' }}>{stat.icon}</span>
                            </div>
                        </div>
                        <p className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{stat.value}</p>
                        <p className="text-slate-500 uppercase" style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', marginTop: '0.375rem' }}>{stat.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
