import type { HomeState } from "./types";

type HomeCalendarViewProps = {
    variant: "teacher" | "student";
    home: HomeState;
};

export function HomeCalendarView({ variant, home }: HomeCalendarViewProps) {
    const {
        role,
        activeMenu,
        plansWithId,
        selectedPlanId,
        setSelectedPlanId,
        effectivePlanId,
        studyPlanHasContent,
        studyPlan,
        currentDate,
        goToPreviousMonth,
        goToNextMonth,
        monthNames,
        dayNames,
        startingDayOfWeek,
        daysInMonth,
        formatDateKey,
        hasDotOnDate,
        handleDayClick,
        getUpcomingEvents,
        setSelectedDay,
        setSelectedEventId,
        setEventText,
    } = home;

    if (activeMenu !== "calendar") return null;

    if (variant === "teacher") {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
                <div className="max-w-7xl w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-gradient-to-br from-white via-purple-50/20 to-white rounded-3xl p-10 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>

                            <div className="flex items-center justify-center gap-8 mb-10">
                                <button
                                    onClick={goToPreviousMonth}
                                    className="p-2.5 hover:bg-slate-50 rounded-xl transition-all duration-200"
                                >
                                    <svg className="w-5 h-5 text-slate-600 hover:text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h3>
                                <button
                                    onClick={goToNextMonth}
                                    className="p-2.5 hover:bg-slate-50 rounded-xl transition-all duration-200"
                                >
                                    <svg className="w-5 h-5 text-slate-600 hover:text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {dayNames.map((day) => (
                                    <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2 uppercase tracking-wide">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                                    <div key={`empty-${index}`} className="aspect-square"></div>
                                ))}

                                {Array.from({ length: daysInMonth }).map((_, index) => {
                                    const day = index + 1;
                                    const dateKey = formatDateKey(day);
                                    const hasDot = hasDotOnDate(dateKey);
                                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => handleDayClick(day)}
                                            className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                                                isToday
                                                    ? "bg-purple-900 text-white shadow-sm"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            {day}
                                            {hasDot && (
                                                <div className="absolute bottom-1.5">
                                                    <span className={`w-2 h-2 rounded-full block ${isToday ? "bg-white/90" : "bg-purple-600"}`} aria-hidden />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-100">
                                <div className="flex items-center gap-8 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-purple-900 rounded-full"></div>
                                        <span className="text-slate-600 font-normal">Днес</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 border border-slate-300 rounded-full relative">
                                            <div className="absolute inset-0 m-auto w-1 h-1 bg-purple-900 rounded-full"></div>
                                        </div>
                                        <span className="text-slate-600 font-normal">Събития</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDayClick(new Date().getDate())}
                                    className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl font-medium transition-all duration-200 text-sm flex items-center gap-2 shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Добави
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-3xl p-6 shadow-md border-2 border-purple-200/40 sticky top-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6 relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Предстоящо</h3>

                                <div className="space-y-3 overflow-hidden pr-1 relative">
                                    {getUpcomingEvents().length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-200/40">
                                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-xs font-bold text-purple-700">Няма предстоящи събития</p>
                                        </div>
                                    ) : (
                                        getUpcomingEvents().map(({ id, date, dateStr, event }) => (
                                            <div
                                                key={id}
                                                className="group bg-gradient-to-br from-purple-50/50 to-white hover:from-purple-100/60 hover:to-white border-2 border-purple-200/40 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:border-purple-300/60"
                                                onClick={() => {
                                                    setSelectedDay(dateStr);
                                                    setSelectedEventId(id);
                                                    setEventText(event);
                                                }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 w-2.5 h-2.5 mt-1.5 rounded-full bg-purple-600" aria-hidden />
                                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg flex flex-col items-center justify-center text-white shadow-md">
                                                        <span className="text-[9px] font-bold uppercase leading-tight">
                                                            {date.toLocaleDateString("bg-BG", { month: "short" })}
                                                        </span>
                                                        <span className="text-sm font-bold leading-none mt-0.5">{date.getDate()}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-purple-700 mb-1 uppercase">
                                                            {date.toLocaleDateString("bg-BG", { weekday: "short" })}
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
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
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
            <div className="max-w-7xl w-full">
                {role === "student" && plansWithId.length > 1 && (
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-600 mb-2">План по предмет</label>
                        <select
                            value={plansWithId.some((p) => p.id === selectedPlanId) ? (selectedPlanId ?? "") : effectivePlanId}
                            onChange={(e) => {
                                const id = e.target.value;
                                if (id && plansWithId.some((p) => p.id === id)) {
                                    setSelectedPlanId(id);
                                    if (typeof window !== "undefined") sessionStorage.setItem("homeSelectedPlanId", id);
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

                {role === "student" && studyPlan && studyPlanHasContent && (
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/80 rounded-xl p-4 border border-purple-200/60">
                            <div className="text-xs font-bold text-slate-600 uppercase">Дни до изпита</div>
                            <div className="text-2xl font-bold text-slate-900 tabular-nums">
                                {Math.max(0, Math.ceil((studyPlan.preferences.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                            </div>
                        </div>
                        <div className="bg-white/80 rounded-xl p-4 border border-purple-200/60">
                            <div className="text-xs font-bold text-slate-600 uppercase">Учебни дни</div>
                            <div className="text-2xl font-bold text-slate-900 tabular-nums">{studyPlan.plan.filter((d) => !d.completed && !d.missed).length}</div>
                        </div>
                        <div className="bg-white/80 rounded-xl p-4 border border-emerald-200/60">
                            <div className="text-xs font-bold text-slate-600 uppercase">Завършени</div>
                            <div className="text-2xl font-bold text-emerald-600 tabular-nums">{studyPlan.plan.filter((d) => d.completed).length}</div>
                        </div>
                        <div className="bg-white/80 rounded-xl p-4 border border-purple-200/60">
                            <div className="text-xs font-bold text-slate-600 uppercase">Теми на ден</div>
                            <div className="text-2xl font-bold text-slate-900 tabular-nums">{studyPlan.preferences.topicsPerDay}</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-gradient-to-br from-white via-purple-50/20 to-white rounded-3xl p-10 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                        <div className="flex items-center justify-center gap-8 mb-10 relative">
                            <button onClick={goToPreviousMonth} className="p-2.5 hover:bg-purple-50 rounded-xl transition-all duration-200">
                                <svg className="w-5 h-5 text-slate-600 hover:text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <button onClick={goToNextMonth} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all duration-200">
                                <svg className="w-5 h-5 text-slate-600 hover:text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {dayNames.map((day) => (
                                <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2 uppercase tracking-wide">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                                <div key={`empty-${index}`} className="aspect-square"></div>
                            ))}

                            {Array.from({ length: daysInMonth }).map((_, index) => {
                                const day = index + 1;
                                const dateKey = formatDateKey(day);
                                const hasDot = hasDotOnDate(dateKey);
                                const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                                const studyDay = studyPlan?.plan.find((d) => d.date === dateKey);
                                const hasStudyTopics = studyDay && studyDay.topics.length > 0;

                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDayClick(day)}
                                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 p-1 ${
                                            isToday
                                                ? "bg-purple-900 text-white shadow-sm"
                                                : studyDay?.completed
                                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                : studyDay?.missed
                                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                                : hasStudyTopics
                                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span>{day}</span>
                                        {hasDot && !isToday && (
                                            <div className="absolute bottom-1.5 right-1.5">
                                                <span className="w-1.5 h-1.5 bg-purple-900 rounded-full block" aria-hidden />
                                            </div>
                                        )}
                                        {hasStudyTopics && (
                                            <div className="absolute bottom-1 left-1 flex gap-0.5 items-center">
                                                {studyDay.topics.slice(0, 2).map((topic, idx) => (
                                                    <span key={idx} className={`w-1 h-1 rounded-full ${topic.subject === "Български език" ? "bg-purple-600" : "bg-amber-500"}`} title={topic.name} />
                                                ))}
                                                {studyDay.topics.length > 2 && <span className="text-[8px] leading-none">+{studyDay.topics.length - 2}</span>}
                                            </div>
                                        )}
                                        {studyDay?.completed && <div className="absolute top-1 right-1 text-xs">✓</div>}
                                        {studyDay?.missed && <div className="absolute top-1 right-1 text-xs">✗</div>}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-100">
                            <div className="flex items-center gap-8 text-xs flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-purple-900 rounded-full"></div>
                                    <span className="text-slate-600 font-normal">Днес</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 border border-slate-300 rounded-full relative">
                                        <div className="absolute inset-0 m-auto w-1 h-1 bg-purple-900 rounded-full"></div>
                                    </div>
                                    <span className="text-slate-600 font-normal">Събития</span>
                                </div>
                                {studyPlan && role === "student" && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 bg-blue-50 border border-blue-300 rounded-full"></div>
                                            <span className="text-slate-600 font-normal">Учебни теми</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 bg-emerald-50 border border-emerald-300 rounded-full"></div>
                                            <span className="text-slate-600 font-normal">Завършено</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => handleDayClick(new Date().getDate())}
                                className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl font-medium transition-all duration-200 text-sm flex items-center gap-2 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Добави
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-3xl p-6 shadow-md border-2 border-purple-200/40 sticky top-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6 relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Предстоящо</h3>

                            <div className="space-y-3 overflow-hidden pr-1 relative">
                                {getUpcomingEvents().length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-200/40">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-bold text-purple-700">Няма предстоящи събития</p>
                                    </div>
                                ) : (
                                    getUpcomingEvents().map(({ id, date, dateStr, event, type }) => {
                                        const isStudy = type === "study";
                                        return (
                                            <div
                                                key={id}
                                                className={`group rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md border-2 ${isStudy ? "bg-blue-50/80 hover:bg-blue-100/80 border-blue-200/60" : "bg-gradient-to-br from-purple-50/50 to-white hover:from-purple-100/60 hover:to-white border-purple-200/40 hover:border-purple-300/60"}`}
                                                onClick={() => {
                                                    setSelectedDay(dateStr);
                                                    setSelectedEventId(isStudy ? null : id);
                                                    setEventText(isStudy ? "" : event);
                                                }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className={`flex-shrink-0 w-2.5 h-2.5 mt-1.5 rounded-full ${isStudy ? "bg-blue-600" : "bg-purple-600"}`} aria-hidden />
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white shadow-md ${isStudy ? "bg-gradient-to-br from-blue-600 to-blue-500" : "bg-gradient-to-br from-purple-900 to-purple-800"}`}>
                                                        <span className="text-[9px] font-bold uppercase leading-tight">
                                                            {date.toLocaleDateString("bg-BG", { month: "short" })}
                                                        </span>
                                                        <span className="text-sm font-bold leading-none mt-0.5">{date.getDate()}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[10px] font-bold mb-1 uppercase ${isStudy ? "text-blue-700" : "text-purple-700"}`}>
                                                            {date.toLocaleDateString("bg-BG", { weekday: "short" })}
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
                                                            {event}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
