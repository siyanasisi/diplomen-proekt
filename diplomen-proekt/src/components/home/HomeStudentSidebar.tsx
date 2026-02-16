import type { HomeMenuId } from "../../types/home";

interface HomeStudentSidebarProps {
    activeMenu: HomeMenuId;
    setActiveMenu: (id: HomeMenuId) => void;
    onFindTeacher: () => void;
    currentStreak: number;
    longestStreak: number;
    eventsCount: number;
}

export function HomeStudentSidebar({
    activeMenu,
    setActiveMenu,
    onFindTeacher,
    currentStreak,
    longestStreak,
    eventsCount,
}: HomeStudentSidebarProps) {
    return (
        <aside className="w-72 flex-shrink-0 h-full bg-white border-r border-slate-200 hidden lg:flex lg:flex-col p-6 relative overflow-y-auto shadow-sm">
            {/* Navigation */}
            <div className="space-y-2 flex-shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5 px-3">Навигация</p>
                <button
                    onClick={() => setActiveMenu("dashboard")}
                    className={
                        activeMenu === "dashboard"
                            ? "flex items-center gap-3 px-4 py-3.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-full font-semibold w-full text-left text-[15px] transition-all"
                            : "flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50/80 rounded-full w-full text-left transition-all text-[15px]"
                    }
                >
                    <span className="material-icons-round text-[22px]">dashboard</span>
                    Табло
                </button>
                <button
                    onClick={onFindTeacher}
                    className="flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50/80 rounded-full w-full text-left transition-all text-[15px]"
                >
                    <span className="material-icons-round text-[22px]">person_search</span>
                    Намери учител
                </button>
                <button
                    onClick={() => setActiveMenu("calendar")}
                    className={
                        activeMenu === "calendar"
                            ? "flex items-center gap-3 px-4 py-3.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-full font-semibold w-full text-left text-[15px] transition-all"
                            : "flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50/80 rounded-full w-full text-left transition-all text-[15px]"
                    }
                >
                    <span className="material-icons-round text-[22px]">event_note</span>
                    Календар
                </button>
                <button
                    onClick={() => setActiveMenu("events")}
                    className={
                        activeMenu === "events"
                            ? "flex items-center gap-3 px-4 py-3.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-full font-semibold w-full text-left text-[15px] transition-all"
                            : "flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50/80 rounded-full w-full text-left transition-all text-[15px]"
                    }
                >
                    <span className="material-icons-round text-[22px]">local_fire_department</span>
                    Събития
                </button>
                <button
                    onClick={() => setActiveMenu("lessons")}
                    className={
                        activeMenu === "lessons"
                            ? "flex items-center gap-3 px-4 py-3.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-full font-semibold w-full text-left text-[15px] transition-all"
                            : "flex items-center gap-3 px-4 py-3.5 text-slate-600 hover:bg-slate-50/80 rounded-full w-full text-left transition-all text-[15px]"
                    }
                >
                    <span className="material-icons-round text-[22px]">schedule</span>
                    Часове
                </button>
            </div>

            {/* Statistics */}
            <div className="mt-16 flex-shrink-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-4">Статистика</p>
                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <span className="text-sm font-medium text-slate-600">Текуща серия</span>
                        <span className="text-lg font-bold text-slate-900">{currentStreak} дни</span>
                    </div>
                    <div className="flex items-center justify-between mb-5">
                        <span className="text-sm font-medium text-slate-600">Най-дълга</span>
                        <span className="text-lg font-bold text-slate-900">{longestStreak} дни</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Събития</span>
                        <span className="text-lg font-bold text-slate-900">{eventsCount}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
