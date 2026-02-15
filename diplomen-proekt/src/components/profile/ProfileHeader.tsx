interface ProfileHeaderProps {
    role: string | null;
    currentStreak: number;
    onNavigateHome: () => void;
    variant?: "default" | "teacher";
}

export function ProfileHeader({ role, currentStreak, onNavigateHome, variant = "default" }: ProfileHeaderProps) {
    const isTeacher = variant === "teacher";

    if (isTeacher) {
        return (
            <div className="mb-8">
                <button
                    onClick={onNavigateHome}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#6D28D9] transition-colors mb-2"
                >
                    <span className="material-icons text-sm">chevron_left</span>
                    Назад към начало
                </button>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Профил</h1>
                <p className="text-slate-500">Управление на акаунта и настройки</p>
            </div>
        );
    }

    return (
        <div className="mb-16">
            <button
                onClick={onNavigateHome}
                className="text-slate-600 hover:text-purple-900 flex items-center gap-2 mb-10 transition-all duration-500 text-sm font-semibold group hover:gap-3 px-4 py-2 rounded-xl hover:bg-white/60 backdrop-blur-sm hover:shadow-lg"
            >
                <svg
                    className="w-5 h-5 group-hover:-translate-x-2 transition-transform duration-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Назад към начало</span>
            </button>
            <div className="flex items-center justify-between gap-8 mb-4">
                <div className="space-y-2">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-4 bg-gradient-to-r from-slate-900 via-purple-900 via-purple-800 to-slate-900 bg-clip-text text-transparent leading-tight">
                        Профил
                    </h1>
                    <p className="text-lg font-medium text-slate-600">Управление на акаунта и настройки</p>
                </div>
                {role === "student" && (
                    <div className="flex items-center gap-5 px-10 py-6 rounded-3xl bg-white/90 backdrop-blur-2xl border-2 border-purple-200/80 shadow-2xl shadow-purple-900/15 hover:shadow-purple-900/25 transition-all duration-700 hover:scale-110 hover:rotate-1 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="text-5xl animate-pulse group-hover:scale-125 transition-transform duration-700 relative z-10">
                            🔥
                        </div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-purple-900 leading-none tabular-nums group-hover:scale-110 transition-transform duration-700">
                                {currentStreak}
                            </div>
                            <div className="text-xs text-purple-700 font-bold mt-1.5 uppercase tracking-widest">
                                дни серия
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
