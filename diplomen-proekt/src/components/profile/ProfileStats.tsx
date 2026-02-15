interface ProfileStatsProps {
    currentStreak: number;
    longestStreak: number;
    earnedPoints: number;
    totalEvents: number;
}

export function ProfileStats({ currentStreak, longestStreak, earnedPoints, totalEvents }: ProfileStatsProps) {
    return (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-10 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-10 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                    Статистика
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { value: currentStreak, label: "Текуща серия", icon: "🔥" },
                        { value: longestStreak, label: "Най-дълга серия", icon: "🏆" },
                        { value: earnedPoints, label: "Точки", icon: "⭐" },
                        { value: totalEvents, label: "Събития", icon: "calendar" },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="bg-gradient-to-br from-white via-purple-50/40 to-white backdrop-blur-sm rounded-2xl p-7 border-2 border-purple-200/50 hover:border-purple-400/70 hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-700 hover:-translate-y-3 hover:scale-110 group/stat relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-200/50 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-700" />
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900 shadow-2xl shadow-purple-900/50 group-hover/stat:scale-125 group-hover/stat:rotate-6 transition-all duration-700">
                                    {stat.icon === "calendar" ? (
                                        <svg
                                            className="w-10 h-10 text-white group-hover/stat:scale-110 transition-transform duration-700"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    ) : (
                                        <span className="text-4xl group-hover/stat:scale-110 transition-transform duration-700">
                                            {stat.icon}
                                        </span>
                                    )}
                                </div>
                                <p className="text-4xl font-black text-slate-900 mb-2 group-hover/stat:scale-110 transition-transform duration-700">
                                    {stat.value}
                                </p>
                                <p className="text-xs font-black text-purple-600 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
