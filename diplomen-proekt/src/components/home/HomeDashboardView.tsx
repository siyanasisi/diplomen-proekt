import type { HomeState } from "./types";

type HomeDashboardViewProps = {
    variant: "teacher" | "student";
    home: HomeState;
};

export function HomeDashboardView({ variant, home }: HomeDashboardViewProps) {
    const {
        role,
        activeMenu,
        setActiveMenu,
        daysUntilExam,
        studyPlan,
        studyPlans,
        plansWithId,
        selectedPlanId,
        setSelectedPlanId,
        effectivePlanId,
        pendingBookingsCount,
        teacherPendingCount,
        todayBookingsCount,
        navigate,
        eventsList,
        longestStreak,
        goToToday,
        handleDayClick,
        getTodayStudyTasks,
        getUpcomingStudyTopics,
        getStudyPlanProgress,
        studyPlanHasContent,
        getUpcomingEvents,
        getAllEvents,
        setSelectedDay,
        setSelectedEventId,
        setEventText,
    } = home;

    if (variant === "teacher") {
        return (
            <>
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

                        
            </>
        );
    }

    return (
        <>
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

                    
        </>
    );
}
