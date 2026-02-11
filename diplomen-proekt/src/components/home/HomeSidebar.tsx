import type { HomeMenuItem, HomeState } from "./types";

type HomeSidebarProps = {
    variant: "teacher" | "student";
    menuItems: HomeMenuItem[];
    home: HomeState;
};

export function HomeSidebar({ variant, menuItems, home }: HomeSidebarProps) {
    const {
        activeMenu,
        setActiveMenu,
        currentStreak,
        longestStreak,
        eventsList,
        daysUntilExam,
    } = home;

    if (variant === "teacher") {
        return (
            <>
{/* left sidebar nav*/}
                <aside className="w-72 h-full bg-white/90 backdrop-blur-2xl border-r-2 border-purple-200/40 flex flex-col shadow-2xl shadow-purple-900/10 relative z-10">
                    {/* sidebar header */}
                    <div className="flex-shrink-0 p-6 border-b-2 border-purple-200/40 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30">
                        <div className="flex items-center gap-3.5">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-900/50 bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900 ring-4 ring-purple-200/60 transition-all duration-700 group-hover:ring-purple-400/80 group-hover:shadow-purple-900/40 group-hover:scale-110 group-hover:rotate-3">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                {/* badge indicator */}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 border-3 border-white shadow-2xl ring-2 ring-emerald-200/50 animate-pulse"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <h1 className="text-base font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Учителски панел</h1>
                                    <span className="px-3 py-1 text-xs font-black text-purple-900 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl uppercase tracking-wider border-2 border-purple-200/60 shadow-sm">
                                        TEACHER
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-600 truncate">Добре дошли обратно</p>
                            </div>
                        </div>
                    </div>

                    {/* nav menu */}
                    <nav 
                        className="flex-1 overflow-y-auto" 
                        aria-label="Main navigation" 
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div className="px-4 pt-6 pb-2">
                            {/* section label */}
                            <div className="px-3 mb-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Навигация</p>
                            </div>
                            {/* menu items  */}
                            <div className="flex flex-col gap-10 ">
                                {menuItems.map((item) => {
                                    const isActive = activeMenu === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveMenu(item.id)}
                                            aria-current={isActive ? 'page' : undefined}
                                            className={`
                                                group relative w-full flex items-center 
                                                gap-5 px-5 py-4 
                                                rounded-xl transition-all duration-300 ease-out
                                                text-left focus:outline-none 
                                                focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:ring-offset-2
                                                ${isActive ? 'text-purple-900 bg-gradient-to-r from-purple-50/80 to-purple-100/50 shadow-lg shadow-purple-900/10' : 'text-slate-600 hover:text-purple-900 hover:bg-white/60 backdrop-blur-sm'}
                                            `}
                                        >
                                            {/* active indicator - left border */}
                                            {isActive && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 via-purple-900 to-purple-600 rounded-r-full shadow-lg shadow-purple-500/50"></div>
                                            )}
                                            {/* subtle hover indicator */}
                                            {!isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 rounded-r-full bg-gradient-to-b from-purple-600 to-purple-900 group-hover:h-10 transition-all duration-300 ease-out shadow-lg shadow-purple-500/30"></div>
                                            )}

                                            <span className={`
                                                relative flex-shrink-0 w-7 h-7 flex items-center justify-center 
                                                transition-colors duration-150
                                                ${isActive ? 'text-purple-900' : 'text-slate-500 group-hover:text-purple-900'}
                                            `}>
                                                {item.icon}
                                            </span>
                                            <span className={`
                                                flex-1 text-lg font-semibold tracking-tight 
                                                transition-colors duration-150
                                                ${isActive ? 'text-purple-900' : 'text-slate-700 group-hover:text-purple-900'}
                                            `}>
                                                {item.label}
                                            </span>
                                            {/* active checkmark indicator */}
                                            {isActive && (
                                                <svg className="w-5 h-5 text-purple-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </nav>

                    {/* sidebar footer stats */}
                    <div className="flex-shrink-0 p-4 border-t border-slate-200/60">
                        <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl p-4 border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Бърза статистика</p>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl border border-purple-100/50">
                                    <span className="text-xs font-medium text-slate-600">Общо събития</span>
                                    <span className="text-base font-bold text-purple-900 tabular-nums">{eventsList.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </>
        );
    }

    return (
        <>
{/* left sidebar nav */}
            <aside className="w-72 h-full bg-white/95 backdrop-blur-xl border-r-2 border-purple-200/50 flex flex-col shadow-2xl shadow-purple-900/10 relative z-10">
                {/* sidebar header */}
                <div className="flex-shrink-0 p-6 border-b-2 border-purple-200/40 bg-gradient-to-br from-purple-50/50 via-purple-100/30 to-transparent">
                    <div className="flex items-center gap-3.5">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 ring-2 ring-purple-200/50">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            {/* badge indicator */}
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-900 rounded-full border-2 border-white flex items-center justify-center shadow-md"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <h1 className="text-base font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Ученически панел</h1>
                                <span className="px-2 py-0.5 text-[10px] font-black text-purple-900 bg-gradient-to-br from-purple-100 to-purple-50 rounded-md uppercase tracking-wider border border-purple-200/60">
                                    STUDENT
                                </span>
                            </div>
                            <p className="text-xs font-bold text-purple-700 truncate">Подготовка за изпит</p>
                        </div>
                    </div>
                </div>

                {/* nav menu */}
                <nav 
                    className="flex-1 overflow-y-auto" 
                    aria-label="Main navigation" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <div className="px-4 pt-6 pb-2">
                        {/* section label */}
                        <div className="px-3 mb-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Навигация</p>
                        </div>
                        {/* menu items */}
                        <div className="flex flex-col gap-10">
                            {menuItems.map((item) => {
                                const isActive = activeMenu === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveMenu(item.id)}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`
                                            group relative w-full flex items-center 
                                            gap-5 px-5 py-4 
                                            rounded-xl transition-all duration-150 
                                            text-left focus:outline-none 
                                            focus-visible:ring-2 focus-visible:ring-purple-900/20 focus-visible:ring-offset-2
                                            ${isActive ? 'text-purple-900' : 'text-slate-600 hover:text-purple-900'}
                                        `}
                                    >
                                        {/* active indicator - left border */}
                                        {isActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-900 rounded-r-full"></div>
                                        )}
                                        {/* subtle hover indicator */}
                                        {!isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 rounded-r-full bg-purple-900 group-hover:h-8 transition-all duration-200"></div>
                                        )}
                                        {/* icon container - easily adjustable size */}
                                        <span className={`
                                            relative flex-shrink-0 w-7 h-7 flex items-center justify-center 
                                            transition-colors duration-150
                                            ${isActive ? 'text-purple-900' : 'text-slate-500 group-hover:text-purple-900'}
                                        `}>
                                            {item.icon}
                                        </span>
                                        {/* label */}
                                        <span className={`
                                            flex-1 text-lg font-bold tracking-tight 
                                            transition-colors duration-150
                                            ${isActive ? 'text-purple-900' : 'text-slate-700 group-hover:text-purple-900'}
                                        `}>
                                            {item.label}
                                        </span>
                                        {/* active checkmark indicator */}
                                        {isActive && (
                                            <svg className="w-5 h-5 text-purple-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                {/* sidebar footer stats */}
                <div className="flex-shrink-0 p-4 border-t-2 border-purple-200/40">
                    <div className="bg-gradient-to-br from-white via-purple-50/40 to-white rounded-xl p-4 border-2 border-purple-200/40 shadow-md mb-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-2xl"></div>
                        <div className="flex items-center gap-2 mb-3 relative">
                            <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Дни до изпита</p>
                        </div>
                        <div className="text-center relative">
                            <p className="text-4xl font-bold text-purple-900 tracking-tight tabular-nums bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 bg-clip-text text-transparent">{daysUntilExam}</p>
                            <p className="text-xs font-bold text-purple-700 mt-1">дни остават</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-white via-purple-50/40 to-white rounded-xl p-4 border-2 border-purple-200/40 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-2xl"></div>
                        <div className="flex items-center gap-2 mb-3 relative">
                            <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Бърза статистика</p>
                        </div>
                        <div className="space-y-2.5 relative">
                            <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-purple-100/60 to-purple-50/40 rounded-lg border border-purple-200/40">
                                <span className="text-xs font-bold text-purple-700">Текуща серия</span>
                                <span className="text-base font-bold text-purple-900 tabular-nums">{currentStreak} дни</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-purple-100/60 to-purple-50/40 rounded-lg border border-purple-200/40">
                                <span className="text-xs font-bold text-purple-700">Най-дълга</span>
                                <span className="text-base font-bold text-purple-900 tabular-nums">{longestStreak} дни</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-purple-100/60 to-purple-50/40 rounded-lg border border-purple-200/40">
                                <span className="text-xs font-bold text-purple-700">Събития</span>
                                <span className="text-base font-bold text-purple-900 tabular-nums">{eventsList.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
