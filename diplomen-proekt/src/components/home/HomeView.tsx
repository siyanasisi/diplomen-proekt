import type { useHome } from "../../hooks/useHome";
import { HomeSettingsView } from "./HomeSettingsView";
import { HomeMessagesView } from "./HomeMessagesView";
import { HomeEventsView } from "./HomeEventsView";
import { HomeCalendarView } from "./HomeCalendarView";
import { HomeLessonsView } from "./HomeLessonsView";
import { HomeEventModal } from "./HomeEventModal";

type HomeViewProps = {
    home: ReturnType<typeof useHome>;
};

export function HomeView({ home }: HomeViewProps) {
    const {
        role,
        navigate,
        eventsList,
        setSelectedEventId,
        setSelectedDay,
        setEventText,
        currentStreak,
        longestStreak,
        activeMenu,
        setActiveMenu,
        studyPlans,
        selectedPlanId,
        setSelectedPlanId,
        pendingBookingsCount,
        todayBookingsCount,
        teacherPendingCount,
        plansWithId,
        studyPlan,
        effectivePlanId,
        daysUntilExam,
        goToToday,
        getTodayStudyTasks,
        getUpcomingStudyTopics,
        getStudyPlanProgress,
        studyPlanHasContent,
        handleDayClick,
        getUpcomingEvents,
        getAllEvents,
    } = home;

    const menuItems = [
        { 
            id: 'dashboard' as const, 
            label: 'Табло', 
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        { 
            id: 'calendar' as const, 
            label: 'Календар', 
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        { 
            id: 'events' as const, 
            label: 'Събития', 
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )
        },
        {
            id: 'lessons' as const,
            label: 'Часове',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        ...(role === 'teacher' ? [{
            id: 'messages' as const,
            label: 'Съобщения',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        }] : []),
    ];



    // teacher dashboard 
    if (role === 'teacher') {
    return (

            <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 flex overflow-hidden relative">
                {/* background*/}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/30 via-purple-100/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-200/20 via-purple-100/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-purple-100/10 via-transparent to-transparent rounded-full blur-3xl"></div>
                </div>
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

                {/* main content area */}
                <main className="flex-1 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-8 py-10">
                        {/* dashboard view */}
                        {activeMenu === 'dashboard' && (
                            <div className="space-y-8">
                                {/* welcome header */}
                                <div className="mb-10">
                                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                        Добре дошли обратно!
                                    </h2>
                                    <p className="text-base font-semibold text-slate-600">
                                        Преглед на днешната активност
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 shadow-md border-2 border-purple-200/40 max-w-md">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">Часове</h3>
                                    <ul className="space-y-1.5 text-slate-700 mb-4">
                                        <li>• Чакащи потвърждение: <span className="font-bold text-amber-800">{teacherPendingCount}</span></li>
                                    </ul>
                                    <button
                                        onClick={() => setActiveMenu('lessons')}
                                        className="w-full px-4 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        Виж всички
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>

                                {/* statistics row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Total events card */}
                                    <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 hover:shadow-xl hover:shadow-purple-900/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-2xl"></div>
                                        <div className="relative flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-purple-700 mb-1.5 uppercase tracking-wide">Общо събития</p>
                                                <p className="text-4xl font-bold text-purple-900 tracking-tight">{eventsList.length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upcoming events card */}
                                    <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 hover:shadow-xl hover:shadow-purple-900/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-2xl"></div>
                                        <div className="relative flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-purple-700 mb-1.5 uppercase tracking-wide">Предстоящи</p>
                                                <p className="text-4xl font-bold text-purple-900 tracking-tight">{getUpcomingEvents().length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-5 tracking-tight relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Бързи действия</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <button 
                                            onClick={() => {
                                                setActiveMenu('calendar');
                                                handleDayClick(new Date().getDate());
                                            }}
                                            className="px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 ease-out flex items-center gap-2.5 text-base shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-900/40 hover:-translate-y-1 hover:scale-[1.02] bg-gradient-to-r from-purple-900 to-purple-800 text-white"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Добави събитие
                                        </button>

                                        <button 
                                            onClick={() => {
                                                setActiveMenu('calendar');
                                                goToToday();
                                            }}
                                            className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-all duration-300 flex items-center gap-2.5 text-base border border-slate-200/60 hover:border-slate-300/60 hover:-translate-y-0.5"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Днес
                                        </button>
                                    </div>
                                </div>

                                {/* recent events */}
                                <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                                    <div className="flex items-center justify-between mb-6 relative">
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Последни събития</h3>
                                        <button 
                                            onClick={() => setActiveMenu('calendar')}
                                            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                                        >
                                            Виж всички →
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {getAllEvents().slice(0, 5).length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-normal text-slate-500">Няма събития. Добавете ново събитие от календара.</p>
                                            </div>
                                        ) : (
                                            getAllEvents().slice(0, 5).map(({ id, date, dateStr, event }) => (
                                                <div 
                                                    key={id} 
                                                    className="group bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl p-4.5 transition-all duration-300 cursor-pointer hover:shadow-sm hover:border-slate-300/60"
                                                    onClick={() => {
                                                        setActiveMenu('calendar');
                                                        setSelectedDay(dateStr);
                                                        setSelectedEventId(id);
                                                        setEventText(event);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-purple-600 mt-1" aria-hidden />
                                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-semibold shadow-sm bg-purple-900">
                                                            <span className="uppercase leading-tight">
                                                                {date.toLocaleDateString('bg-BG', { month: 'short' })}
                                                            </span>
                                                            <span className="text-base font-bold leading-none mt-0.5">{date.getDate()}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                                                                {date.toLocaleDateString('bg-BG', { weekday: 'long' })}
                                                            </p>
                                                            <p className="text-base font-medium text-slate-900 line-clamp-1">
                                                                {event}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <HomeCalendarView variant="teacher" home={home} />
                        <HomeEventsView variant="teacher" home={home} />
                        <HomeMessagesView home={home} />
                        <HomeLessonsView variant="teacher" home={home} />
                        <HomeSettingsView home={home} />
                    </div>
                </main>
                <HomeEventModal home={home} />
            </div>
        );
    }

    // Student Dashboard View
    return (
        <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-purple-100/20 flex overflow-hidden relative">
            {/* background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-purple-300/25 via-purple-200/15 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-200/20 via-purple-100/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
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

            {/* main content area */}
            <main className="flex-1 overflow-hidden relative z-10">
                <div className="max-w-7xl mx-auto px-8 py-10">
                    {/* dashboard view */}
                    {activeMenu === 'dashboard' && (
                        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-16">
                            <div className="max-w-2xl w-full px-8">
                                {role === 'student' && pendingBookingsCount > 0 && (
                                    <div className="mb-6 p-4 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between gap-4 flex-wrap">
                                        <p className="text-amber-800 font-semibold">
                                            ⏳ Имате {pendingBookingsCount} {pendingBookingsCount === 1 ? 'час' : 'часа'}, който чака потвърждение от учителя.
                                        </p>
                                        <button
                                            onClick={() => setActiveMenu('lessons')}
                                            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg transition-colors"
                                        >
                                            Виж всички
                                        </button>
                                    </div>
                                )}

                                {role === 'student' && (
                                    <div className="mb-8 bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl p-6 shadow-xl border-2 border-purple-200/50 relative overflow-hidden">
                                        <h2 className="text-xl font-bold text-slate-900 mb-4">📚 Часове</h2>
                                        <ul className="space-y-2 text-slate-700 mb-4">
                                            <li>• Днес: <span className="font-bold text-purple-900">{todayBookingsCount}</span></li>
                                            <li>• Чакащи потвърждение: <span className="font-bold text-amber-800">{pendingBookingsCount}</span></li>
                                        </ul>
                                        <button
                                            onClick={() => setActiveMenu('lessons')}
                                            className="w-full px-4 py-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            Виж всички
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                )}

                                {/* plan selector - when multiple plans */}
                                {role === 'student' && plansWithId.length > 1 && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-600 mb-2">План по предмет</label>
                                        <select
                                            value={plansWithId.some(p => p.id === selectedPlanId) ? (selectedPlanId ?? '') : effectivePlanId}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                if (id && plansWithId.some(p => p.id === id)) {
                                                    setSelectedPlanId(id);
                                                    if (typeof window !== 'undefined') sessionStorage.setItem('homeSelectedPlanId', id);
                                                }
                                            }}
                                            className="px-4 py-3 rounded-xl border-2 border-slate-200 bg-white font-semibold text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                        >
                                            {plansWithId.map((p) => (
                                                <option key={p.id} value={p.id}>{p.preferences.examSubject}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* create plan / add another plan card */}
                                {role === 'student' && (
                                    <div className="mb-8 bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-purple-200/50 relative overflow-hidden">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                    {studyPlans.length > 0 ? 'Добави план по друг предмет' : 'Създай своя персонален учебен план'}
                                                </h3>
                                                <p className="text-sm text-slate-600">
                                                    {studyPlans.length > 0 ? 'Създай учебен план по още един матурен предмет.' : 'Отговори на няколко кратки въпроса и ще създадем учебен план, съобразен с твоето време и цел за матурата.'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/study-plan/intro')}
                                                className="px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {studyPlans.length > 0 ? 'Нов план' : 'Направи ми план'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* plan exists but no content for this subject */}
                                {role === 'student' && studyPlan && !studyPlanHasContent && (
                                    <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                                        <p className="text-amber-900 font-bold text-lg">За предмет „{studyPlan.preferences.examSubject}" все още няма готово съдържание.</p>
                                        <p className="text-amber-800 text-sm mt-2">Ще активираме плана, когато има теми за учене. До тогава можеш да използваш календара и останалите функции.</p>
                                    </div>
                                )}

                                {/* today's study tasks */}
                                {role === 'student' && studyPlanHasContent && getTodayStudyTasks() && getTodayStudyTasks()!.topics.length > 0 && (
                                    <div className="mb-8 bg-white/80 rounded-3xl p-8 shadow-xl border-2 border-purple-200/50">
                                        <h3 className="text-xl font-bold text-slate-800 mb-4">Днешни учебни задачи</h3>
                                        <p className="text-sm text-slate-600 mb-4">{new Date().toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                        <div className="space-y-3">
                                            {getTodayStudyTasks()!.topics.map((topic, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-4 rounded-xl border-2 ${topic.subject === 'Български език' ? 'border-purple-200 bg-purple-50/50' : 'border-amber-200 bg-amber-50/50'}`}
                                                >
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${topic.subject === 'Български език' ? 'bg-purple-200 text-purple-700' : 'bg-amber-200 text-amber-700'}`}>{topic.subject}</span>
                                                    <p className="mt-2 font-semibold text-slate-900">{topic.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {!getTodayStudyTasks()?.completed && !getTodayStudyTasks()?.missed && (
                                            <button
                                                onClick={() => setActiveMenu('calendar')}
                                                className="mt-6 w-full px-4 py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                                            >
                                                Започни учене сега
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* study progress - when plan has content */}
                                {role === 'student' && studyPlanHasContent && getStudyPlanProgress() && (
                                    <div className="mb-8 bg-white/80 rounded-3xl p-6 shadow-xl border-2 border-emerald-200/50">
                                        <h3 className="text-lg font-bold text-slate-800 mb-3">Напредък в ученето</h3>
                                        <div className="flex items-center justify-between gap-4 mb-3">
                                            <span className="text-sm font-semibold text-slate-600">Общ напредък</span>
                                            <span className="text-2xl font-bold text-emerald-600 tabular-nums">{getStudyPlanProgress()!.completionPercentage}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-emerald-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all" style={{ width: `${getStudyPlanProgress()!.completionPercentage}%` }} />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Завършени теми: {getStudyPlanProgress()!.completedTopics} от {getStudyPlanProgress()!.totalTopics}</p>
                                    </div>
                                )}

                                {/* upcoming study topics */}
                                {role === 'student' && studyPlan && getUpcomingStudyTopics().length > 0 && (
                                    <div className="mb-8 bg-white/80 rounded-3xl p-8 shadow-xl border-2 border-purple-200/50">
                                        <h3 className="text-xl font-bold text-slate-800 mb-4">Предстоящи теми</h3>
                                        <div className="space-y-4">
                                            {getUpcomingStudyTopics().slice(0, 3).map(({ date, studyDay }) => {
                                                const [y, m, d] = date.split('-').map(Number);
                                                const studyDate = new Date(y, m - 1, d);
                                                const tomorrow = new Date();
                                                tomorrow.setDate(tomorrow.getDate() + 1);
                                                tomorrow.setHours(0, 0, 0, 0);
                                                studyDate.setHours(0, 0, 0, 0);
                                                const isTomorrow = studyDate.getTime() === tomorrow.getTime();
                                                return (
                                                    <button
                                                        key={date}
                                                        onClick={() => setActiveMenu('calendar')}
                                                        className="block w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                                                    >
                                                        <p className="text-xs font-bold text-slate-600 uppercase mb-1">{isTomorrow ? 'Утре' : studyDate.toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                                        <p className="text-sm font-semibold text-slate-800">{studyDay.topics.length} теми</p>
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {studyDay.topics.slice(0, 2).map((t, i) => (
                                                                <span key={i} className={`text-xs px-2 py-0.5 rounded ${t.subject === 'Български език' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{t.name}</span>
                                                            ))}
                                                            {studyDay.topics.length > 2 && <span className="text-xs text-slate-500">+{studyDay.topics.length - 2}</span>}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button onClick={() => setActiveMenu('calendar')} className="mt-4 text-sm font-bold text-purple-600 hover:text-purple-700">Виж всички →</button>
                                    </div>
                                )}

                                {/* countdown card */}
                                <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl p-16 shadow-xl border-2 border-purple-200/50 mb-12 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100/15 to-transparent rounded-full blur-3xl"></div>
                                    <div className="text-center relative">
                                        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                            ДЗИ БЕЛ 2026
                                        </h1>
                                        <p className="text-base font-bold text-purple-700 mb-12">
                                            20 май 2026
                                        </p>
                                        <div className="mb-12">
                                            <div className="text-[10rem] md:text-[14rem] font-bold text-purple-900 tabular-nums tracking-tighter leading-none mb-4 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 bg-clip-text text-transparent">
                                                {daysUntilExam}
                                            </div>
                                            <p className="text-xl font-bold text-purple-700">дни остават</p>
                                        </div>

                                        {/* progress bar */}
                                        <div className="max-w-lg mx-auto">
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-700 bg-purple-900"
                                                        style={{ 
                                                            width: `${Math.min(100, Math.max(0, ((365 - daysUntilExam) / 365) * 100))}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap">
                                                    {Math.min(100, Math.max(0, Math.round(((365 - daysUntilExam) / 365) * 100)))}%
                                                </span>
                                            </div>
                                            <p className="text-xs font-normal text-slate-400 mt-2">Готовност</p>
                                        </div>
                                    </div>

                                    {/* stat sections at bottom - inside the card */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t-2 border-purple-200/40 relative">
                                        {/* events section */}
                                        <div className="flex items-start gap-3 bg-gradient-to-br from-purple-50/50 to-white rounded-xl p-4 border border-purple-200/40">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center flex-shrink-0 shadow-md">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Запланирани събития</p>
                                                <p className="text-3xl font-bold text-purple-900">{eventsList.length}</p>
                                            </div>
                                        </div>
                                        
                                        {/* study streak section */}
                                        <div className="flex items-start gap-3 bg-gradient-to-br from-purple-50/50 to-white rounded-xl p-4 border border-purple-200/40">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center flex-shrink-0 shadow-md">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Най-дълга серия</p>
                                                <p className="text-3xl font-bold text-purple-900">{longestStreak} <span className="text-lg font-bold text-purple-700">дни</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* find teacher card */}
                                <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl p-8 shadow-xl border-2 border-purple-200/50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-3xl"></div>
                                    <div className="relative">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center flex-shrink-0 shadow-lg">
                                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM17 10a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-bold text-slate-900 mb-1">Намери учител</h2>
                                                <p className="text-sm font-semibold text-slate-600">
                                                    Открийте идеалния учител за вашата подготовка
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate('/find-teacher')}
                                            className="w-full px-6 py-4 bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <span>Прегледай учители</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <HomeCalendarView variant="student" home={home} />
                    <HomeEventsView variant="student" home={home} />
                    <HomeLessonsView variant="student" home={home} />
                    <HomeSettingsView home={home} />
                </div>
            </main>
            <HomeEventModal home={home} />
        </div>
    );

}
