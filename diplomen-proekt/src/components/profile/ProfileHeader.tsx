interface ProfileHeaderProps {
    role: string | null;
    currentStreak: number;
    onNavigateHome: () => void;
}

export function ProfileHeader({ role, currentStreak, onNavigateHome }: ProfileHeaderProps) {
    return (
        <header className="flex justify-between items-start mb-8">
            <div>
                <button
                    onClick={onNavigateHome}
                    className="flex items-center text-sm font-medium text-slate-500 hover:text-[#6D28D9] transition-colors mb-2"
                >
                    <span className="material-icons text-lg mr-1">chevron_left</span>
                    Назад към начало
                </button>
                <h1 className="text-5xl font-extrabold text-[#6D28D9] tracking-tight">Профил</h1>
                <p className="text-slate-500 mt-1">Управление на акаунта и настройки</p>
            </div>
            {role === "student" && (
                <div className="flex items-center bg-white border border-slate-200 rounded-full px-6 py-3 shadow-sm">
                    <div className="relative flex items-center justify-center mr-3">
                        <span className="material-icons text-orange-500 text-4xl">local_fire_department</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-900 leading-none">{currentStreak}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">дни серия</span>
                    </div>
                </div>
            )}
        </header>
    );
}
