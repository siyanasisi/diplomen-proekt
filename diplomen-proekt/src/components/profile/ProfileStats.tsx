interface ProfileStatsProps {
    currentStreak: number;
    longestStreak: number;
    earnedPoints: number;
    totalEvents: number;
}

export function ProfileStats({ currentStreak, longestStreak, earnedPoints, totalEvents }: ProfileStatsProps) {
    const stats = [
        {
            value: currentStreak,
            label: "Текуща серия",
            icon: "local_fire_department",
            bgColor: "bg-orange-500",
            shadowColor: "shadow-orange-500/20",
        },
        {
            value: longestStreak,
            label: "Най-дълга серия",
            icon: "emoji_events",
            bgColor: "bg-yellow-500",
            shadowColor: "shadow-yellow-500/20",
        },
        {
            value: earnedPoints,
            label: "Точки",
            icon: "stars",
            bgColor: "bg-blue-500",
            shadowColor: "shadow-blue-500/20",
        },
        {
            value: totalEvents,
            label: "Събития",
            icon: "calendar_month",
            bgColor: "bg-[#6D28D9]",
            shadowColor: "shadow-[#6D28D9]/20",
        },
    ];

    return (
        <section>
            <h3 className="text-xl font-bold mb-4 text-slate-800 px-1">Статистика</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow"
                    >
                        <div
                            className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg ${stat.shadowColor}`}
                        >
                            <span className="material-icons text-3xl">{stat.icon}</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
                            {stat.label}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
