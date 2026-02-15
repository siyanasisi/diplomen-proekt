interface ProfileQuickActionsProps {
    role: string | null;
    onAddEvent: () => void;
    onViewStats: () => void;
    variant?: "default" | "teacher";
}

export function ProfileQuickActions({ role, onAddEvent, onViewStats, variant = "default" }: ProfileQuickActionsProps) {
    const isTeacher = variant === "teacher";

    if (isTeacher) {
        return (
            <section className="bg-[#6D28D9] rounded-2xl p-6 text-white shadow-xl shadow-[#6D28D9]/20">
                <h3 className="text-lg font-bold mb-4">Бързи действия</h3>
                <button
                    onClick={onAddEvent}
                    className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 transition-colors py-3 rounded-xl font-bold border border-white/30 backdrop-blur-sm"
                >
                    <span className="material-icons">add</span>
                    Добави събитие
                </button>
            </section>
        );
    }

    return (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-10 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                    Бързи действия
                </h3>
                <div className="space-y-5">
                    <button
                        onClick={onAddEvent}
                        className="w-full px-8 py-5 rounded-2xl font-black transition-all duration-700 ease-out flex items-center justify-center gap-3 text-base shadow-2xl shadow-purple-900/40 hover:shadow-purple-900/50 hover:-translate-y-3 hover:scale-110 bg-gradient-to-r from-purple-900 via-purple-800 via-purple-700 to-purple-900 text-white group/btn relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                        <svg
                            className="w-6 h-6 group-hover/btn:rotate-180 transition-transform duration-700 relative z-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="relative z-10">Добави събитие</span>
                    </button>
                    {role === "student" && (
                        <button
                            onClick={onViewStats}
                            className="w-full px-8 py-5 bg-gradient-to-br from-white via-slate-50 to-white hover:from-purple-50 hover:via-purple-100/50 hover:to-purple-50 text-slate-700 hover:text-purple-900 rounded-2xl font-bold transition-all duration-700 flex items-center justify-center gap-3 text-base border-2 border-slate-200/60 hover:border-purple-300/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20 group/btn"
                        >
                            <svg
                                className="w-6 h-6 group-hover/btn:scale-110 transition-transform duration-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            Виж статистики
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
