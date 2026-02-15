import { useNavigate } from "react-router-dom";
import type { Topic } from "../../lib/topics";
import { mapStudyPlanTopicToCurriculum } from "../../lib/studyPlanMapping";
import { formatDateLessons } from "../../hooks/useHome";
import type { HomeEventItem, TeacherMessage, StudentBooking, PendingBooking } from "../../types/home";
import type { StudyPlan } from "../../lib/topics";

import type { HomeMenuId } from "../../types/home";

interface HomeContentProps {
    activeMenu: string;
    setActiveMenu: (id: HomeMenuId) => void;
    role: string | null;
    navigate: ReturnType<typeof useNavigate>;
    // dashboard
    teacherPendingCount: number;
    pendingBookingsCount: number;
    todayBookingsCount: number;
    eventsList: { id: string; date: string; event_text: string }[];
    getUpcomingEvents: () => HomeEventItem[];
    getAllEvents: () => HomeEventItem[];
    handleDayClick: (day: number) => void;
    goToToday: () => void;
    setSelectedDay: (d: string | null) => void;
    setSelectedEventId: (id: string | null) => void;
    setEventText: (t: string) => void;
    // student dashboard
    plansWithId: (StudyPlan & { id: string })[];
    selectedPlanId: string | null;
    setSelectedPlanId: (id: string | null) => void;
    effectivePlanId: string;
    studyPlan: StudyPlan | null;
    studyPlanHasContent: boolean;
    getTodayStudyTasks: () => { topics: { subject: string; name: string }[]; completed?: boolean; missed?: boolean } | null | undefined;
    getTodayDateKey: () => string;
    getStudyPlanProgress: () => { completionPercentage: number; completedTopics: number; totalTopics: number } | null;
    getUpcomingStudyTopics: () => { date: string; studyDay: { topics: { subject: string; name: string }[] } }[];
    daysUntilExam: number;
    longestStreak: number;
    // calendar
    currentDate: Date;
    daysInMonth: number;
    startingDayOfWeek: number;
    formatDateKey: (day: number) => string;
    hasDotOnDate: (dateKey: string) => boolean;
    studyPlanForCalendar?: StudyPlan | null;
    MONTH_NAMES: string[];
    DAY_NAMES: string[];
    goToPreviousMonth: () => void;
    goToNextMonth: () => void;
    // lessons
    lessonsLoading: boolean;
    pendingBookings: PendingBooking[];
    studentBookings: StudentBooking[];
    actingOnBookingId: string | null;
    handleConfirmBooking: (id: string, studentId: string, lessonDate: string, lessonTime: string) => void;
    handleCancelByTeacher: (id: string, studentId: string, lessonDate: string, lessonTime: string) => void;
    handleCancelMyBooking: (id: string, teacherId: string, lessonDate: string, lessonTime: string) => void;
    // messages
    messages: TeacherMessage[];
    loadingMessages: boolean;
    loadMessages: () => void;
    markMessageAsRead: (msg: TeacherMessage) => void;
}

export function HomeContent(props: HomeContentProps) {
    const {
        activeMenu,
        setActiveMenu,
        role,
        navigate,
        teacherPendingCount,
        pendingBookingsCount,
        todayBookingsCount,
        eventsList,
        getUpcomingEvents,
        getAllEvents,
        handleDayClick,
        goToToday,
        setSelectedDay,
        setSelectedEventId,
        setEventText,
        plansWithId,
        selectedPlanId,
        setSelectedPlanId,
        effectivePlanId,
        studyPlan,
        studyPlanHasContent,
        getTodayStudyTasks,
        getTodayDateKey,
        getStudyPlanProgress,
        getUpcomingStudyTopics,
        daysUntilExam,
        longestStreak,
        currentDate,
        daysInMonth,
        startingDayOfWeek,
        formatDateKey,
        hasDotOnDate,
        studyPlanForCalendar,
        MONTH_NAMES,
        DAY_NAMES,
        goToPreviousMonth,
        goToNextMonth,
        lessonsLoading,
        pendingBookings,
        studentBookings,
        actingOnBookingId,
        handleConfirmBooking,
        handleCancelByTeacher,
        handleCancelMyBooking,
        messages,
        loadingMessages,
        loadMessages,
        markMessageAsRead,
    } = props;

    const isTeacher = role === "teacher";
    const studyPlanCal = studyPlanForCalendar ?? studyPlan;

    // dashboard - teacher
    if (activeMenu === "dashboard" && isTeacher) {
        return (
            <div className="space-y-8">
                <div className="mb-10">
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                        Добре дошли обратно!
                    </h2>
                    <p className="text-base font-semibold text-slate-600">Преглед на днешната активност</p>
                </div>
                <div className="flex flex-wrap gap-6 mb-8">
                    <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 shadow-md border-2 border-purple-200/40 max-w-md">
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Часове</h3>
                        <ul className="space-y-1.5 text-slate-700 mb-4">
                            <li>• Чакащи потвърждение: <span className="font-bold text-amber-800">{teacherPendingCount}</span></li>
                        </ul>
                        <button
                            onClick={() => setActiveMenu("lessons")}
                            className="w-full px-4 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            Виж всички
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
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
                    <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
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
                <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                    <h3 className="text-xl font-bold text-slate-900 mb-5 tracking-tight">Бързи действия</h3>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => { setActiveMenu("calendar"); handleDayClick(new Date().getDate()); }}
                            className="px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2.5 text-base shadow-lg bg-gradient-to-r from-purple-900 to-purple-800 text-white hover:shadow-xl"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Добави събитие
                        </button>
                        <button
                            onClick={() => { setActiveMenu("calendar"); goToToday(); }}
                            className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-all flex items-center gap-2.5 text-base border border-slate-200/60"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Днес
                        </button>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Последни събития</h3>
                        <button onClick={() => setActiveMenu("calendar")} className="text-sm font-medium text-slate-500 hover:text-slate-700">
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
                                    className="group bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl p-4.5 transition-all cursor-pointer"
                                    onClick={() => { setActiveMenu("calendar"); setSelectedDay(dateStr); setSelectedEventId(id); setEventText(event); }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-purple-600 mt-1" />
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-semibold shadow-sm bg-purple-900">
                                            <span className="uppercase">{date.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                            <span className="text-base font-bold leading-none mt-0.5">{date.getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-500 mb-1 uppercase">{date.toLocaleDateString("bg-BG", { weekday: "long" })}</p>
                                            <p className="text-base font-medium text-slate-900 line-clamp-1">{event}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // dashboard - student
    if (activeMenu === "dashboard" && role === "student") {
        const todayTasks = getTodayStudyTasks();
        const progress = getStudyPlanProgress();
        const upcomingTopics = getUpcomingStudyTopics();

        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-16">
                <div className="max-w-2xl w-full px-8">
                    {pendingBookingsCount > 0 && (
                        <div className="mb-6 p-4 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-amber-800 font-semibold">
                                ⏳ Имате {pendingBookingsCount} {pendingBookingsCount === 1 ? "час" : "часа"}, който чака потвърждение от учителя.
                            </p>
                            <button onClick={() => setActiveMenu("lessons")} className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg transition-colors">
                                Виж всички
                            </button>
                        </div>
                    )}
                    <div className="mb-8 bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl p-6 shadow-xl border-2 border-purple-200/50">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">📚 Часове</h2>
                        <ul className="space-y-2 text-slate-700 mb-4">
                            <li>• Днес: <span className="font-bold text-purple-900">{todayBookingsCount}</span></li>
                            <li>• Чакащи потвърждение: <span className="font-bold text-amber-800">{pendingBookingsCount}</span></li>
                        </ul>
                        <button onClick={() => setActiveMenu("lessons")} className="w-full px-4 py-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold transition-colors text-sm flex items-center justify-center gap-2">
                            Виж всички <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    {plansWithId.length > 1 && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-600 mb-2">План по предмет</label>
                            <select
                                value={plansWithId.some((p) => p.id === selectedPlanId) ? selectedPlanId ?? "" : effectivePlanId}
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
                    <div className="mb-8 bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-purple-200/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                    {studyPlan ? "Добави план по друг предмет" : "Създай своя персонален учебен план"}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {studyPlan ? "Създай учебен план по още един матурен предмет." : "Отговори на няколко кратки въпроса и ще създадем учебен план, съобразен с твоето време и цел за матурата."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate("/study-plan/intro")}
                                className="px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white transition-all shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {studyPlan ? "Нов план" : "Направи ми план"}
                            </button>
                        </div>
                    </div>
                    {studyPlan && !studyPlanHasContent && (
                        <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                            <p className="text-amber-900 font-bold text-lg">За предмет „{studyPlan.preferences.examSubject}" все още няма готово съдържание.</p>
                            <p className="text-amber-800 text-sm mt-2">Ще активираме плана, когато има теми за учене. До тогава можеш да използваш календара и останалите функции.</p>
                        </div>
                    )}
                    {studyPlanHasContent && todayTasks && todayTasks.topics.length > 0 && (
                        <div className="mb-8 bg-white/80 rounded-3xl p-8 shadow-xl border-2 border-purple-200/50">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Днешни учебни задачи</h3>
                            <p className="text-sm text-slate-600 mb-4">{new Date().toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" })}</p>
                            <div className="space-y-3">
                                {todayTasks.topics.map((topic, idx) => {
                                    const { subjectId, topicId } = mapStudyPlanTopicToCurriculum(topic as Topic);
                                    const todayPlanTopicIds = todayTasks.topics.map((t) => mapStudyPlanTopicToCurriculum(t as Topic).topicId);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (!todayTasks.completed && !todayTasks.missed) {
                                                    navigate(`/study/learn/${subjectId}/${topicId}`, { state: { todayPlanTopicIds, todayDate: getTodayDateKey() } });
                                                }
                                            }}
                                            disabled={!!todayTasks.completed || !!todayTasks.missed}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${topic.subject === "Български език" ? "border-purple-200 bg-purple-50/50 hover:border-purple-300" : "border-amber-200 bg-amber-50/50 hover:border-amber-300"} ${(todayTasks.completed || todayTasks.missed) ? "opacity-60 cursor-default" : "cursor-pointer"}`}
                                        >
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${topic.subject === "Български език" ? "bg-purple-200 text-purple-700" : "bg-amber-200 text-amber-700"}`}>{topic.subject}</span>
                                            <p className="mt-2 font-semibold text-slate-900">{topic.name}</p>
                                            {!todayTasks.completed && !todayTasks.missed && <p className="mt-1 text-xs text-slate-500">Натисни за учене →</p>}
                                        </button>
                                    );
                                })}
                            </div>
                            {!todayTasks.completed && !todayTasks.missed && (
                                <button
                                    onClick={() => {
                                        const first = todayTasks.topics[0];
                                        const { subjectId, topicId } = mapStudyPlanTopicToCurriculum(first as Topic);
                                        const todayPlanTopicIds = todayTasks.topics.map((t) => mapStudyPlanTopicToCurriculum(t as Topic).topicId);
                                        navigate(`/study/learn/${subjectId}/${topicId}`, { state: { todayPlanTopicIds, todayDate: getTodayDateKey() } });
                                    }}
                                    className="mt-6 w-full px-4 py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                                >
                                    Започни учене сега
                                </button>
                            )}
                        </div>
                    )}
                    {studyPlanHasContent && progress && (
                        <div className="mb-8 bg-white/80 rounded-3xl p-6 shadow-xl border-2 border-emerald-200/50">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">Напредък в ученето</h3>
                            <div className="flex items-center justify-between gap-4 mb-3">
                                <span className="text-sm font-semibold text-slate-600">Общ напредък</span>
                                <span className="text-2xl font-bold text-emerald-600 tabular-nums">{progress.completionPercentage}%</span>
                            </div>
                            <div className="w-full h-3 bg-emerald-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all" style={{ width: `${progress.completionPercentage}%` }} />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Завършени теми: {progress.completedTopics} от {progress.totalTopics}</p>
                        </div>
                    )}
                    {studyPlan && upcomingTopics.length > 0 && (
                        <div className="mb-8 bg-white/80 rounded-3xl p-8 shadow-xl border-2 border-purple-200/50">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Предстоящи теми</h3>
                            <div className="space-y-4">
                                {upcomingTopics.slice(0, 3).map(({ date, studyDay }) => {
                                    const [y, m, d] = date.split("-").map(Number);
                                    const studyDate = new Date(y, m - 1, d);
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    tomorrow.setHours(0, 0, 0, 0);
                                    studyDate.setHours(0, 0, 0, 0);
                                    const isTomorrow = studyDate.getTime() === tomorrow.getTime();
                                    return (
                                        <button key={date} onClick={() => setActiveMenu("calendar")} className="block w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
                                            <p className="text-xs font-bold text-slate-600 uppercase mb-1">{isTomorrow ? "Утре" : studyDate.toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "short" })}</p>
                                            <p className="text-sm font-semibold text-slate-800">{studyDay.topics.length} теми</p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {studyDay.topics.slice(0, 2).map((t, i) => (
                                                    <span key={i} className={`text-xs px-2 py-0.5 rounded ${t.subject === "Български език" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`}>{t.name}</span>
                                                ))}
                                                {studyDay.topics.length > 2 && <span className="text-xs text-slate-500">+{studyDay.topics.length - 2}</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button onClick={() => setActiveMenu("calendar")} className="mt-4 text-sm font-bold text-purple-600 hover:text-purple-700">Виж всички →</button>
                        </div>
                    )}
                    <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl p-16 shadow-xl border-2 border-purple-200/50 mb-12 relative overflow-hidden">
                        <div className="text-center relative">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">ДЗИ БЕЛ 2026</h1>
                            <p className="text-base font-bold text-purple-700 mb-12">20 май 2026</p>
                            <div className="mb-12">
                                <div className="text-[10rem] md:text-[14rem] font-bold text-purple-900 tabular-nums tracking-tighter leading-none mb-4">{daysUntilExam}</div>
                                <p className="text-xl font-bold text-purple-700">дни остават</p>
                            </div>
                            <div className="max-w-lg mx-auto">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700 bg-purple-900" style={{ width: `${Math.min(100, Math.max(0, ((365 - daysUntilExam) / 365) * 100))}%` }} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap">
                                        {Math.min(100, Math.max(0, Math.round(((365 - daysUntilExam) / 365) * 100)))}%
                                    </span>
                                </div>
                                <p className="text-xs font-normal text-slate-400 mt-2">Готовност</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t-2 border-purple-200/40">
                            <div className="flex items-start gap-3 bg-gradient-to-br from-purple-50/50 to-white rounded-xl p-4 border border-purple-200/40">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center flex-shrink-0 shadow-md">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Запланирани събития</p>
                                    <p className="text-3xl font-bold text-purple-900">{eventsList.length}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-gradient-to-br from-purple-50/50 to-white rounded-xl p-4 border border-purple-200/40">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center flex-shrink-0 shadow-md">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Най-дълга серия</p>
                                    <p className="text-3xl font-bold text-purple-900">{longestStreak} <span className="text-lg font-bold text-purple-700">дни</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl p-8 shadow-xl border-2 border-purple-200/50 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM17 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">Намери учител</h2>
                                <p className="text-sm font-semibold text-slate-600">Открийте идеалния учител за вашата подготовка</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/find-teacher")}
                            className="w-full px-6 py-4 bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            <span>Прегледай учители</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // calendar view
    if (activeMenu === "calendar") {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
                <div className="max-w-7xl w-full">
                    {role === "student" && plansWithId.length > 1 && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-600 mb-2">План по предмет</label>
                            <select
                                value={plansWithId.some((p) => p.id === selectedPlanId) ? selectedPlanId ?? "" : effectivePlanId}
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-gradient-to-br from-white via-purple-50/20 to-white rounded-3xl p-10 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                            <div className="flex items-center justify-center gap-8 mb-10">
                                <button onClick={goToPreviousMonth} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all">
                                    <svg className="w-5 h-5 text-slate-600 hover:text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                                    {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h3>
                                <button onClick={goToNextMonth} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all">
                                    <svg className="w-5 h-5 text-slate-600 hover:text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {DAY_NAMES.map((day) => (
                                    <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2 uppercase">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateKey = formatDateKey(day);
                                    const hasDot = hasDotOnDate(dateKey);
                                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                                    const studyDay = studyPlanCal?.plan.find((d) => d.date === dateKey);
                                    const hasStudyTopics = studyDay && studyDay.topics.length > 0;
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => handleDayClick(day)}
                                            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all p-1 ${
                                                isToday ? "bg-purple-900 text-white shadow-sm" :
                                                studyDay?.completed ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" :
                                                studyDay?.missed ? "bg-red-50 text-red-700 hover:bg-red-100" :
                                                hasStudyTopics ? "bg-blue-50 text-blue-700 hover:bg-blue-100" :
                                                "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span>{day}</span>
                                            {hasDot && !isToday && <div className="absolute bottom-1.5 right-1.5"><span className="w-1.5 h-1.5 bg-purple-900 rounded-full block" /></div>}
                                            {hasStudyTopics && (
                                                <div className="absolute bottom-1 left-1 flex gap-0.5 items-center">
                                                    {studyDay!.topics.slice(0, 2).map((topic, idx) => (
                                                        <span key={idx} className={`w-1 h-1 rounded-full ${topic.subject === "Български език" ? "bg-purple-600" : "bg-amber-500"}`} title={topic.name} />
                                                    ))}
                                                    {studyDay!.topics.length > 2 && <span className="text-[8px] leading-none">+{studyDay!.topics.length - 2}</span>}
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
                                        <div className="w-2.5 h-2.5 bg-purple-900 rounded-full" />
                                        <span className="text-slate-600">Днес</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 border border-slate-300 rounded-full relative">
                                            <div className="absolute inset-0 m-auto w-1 h-1 bg-purple-900 rounded-full" />
                                        </div>
                                        <span className="text-slate-600">Събития</span>
                                    </div>
                                    {studyPlanCal && role === "student" && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 bg-blue-50 border border-blue-300 rounded-full" />
                                                <span className="text-slate-600">Учебни теми</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 bg-emerald-50 border border-emerald-300 rounded-full" />
                                                <span className="text-slate-600">Завършено</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button onClick={() => handleDayClick(new Date().getDate())} className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Добави
                                </button>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-3xl p-6 shadow-md border-2 border-purple-200/40 sticky top-6">
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6">Предстоящо</h3>
                                <div className="space-y-3 overflow-hidden">
                                    {getUpcomingEvents().length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-xs font-bold text-purple-700">Няма предстоящи събития</p>
                                        </div>
                                    ) : (
                                        getUpcomingEvents().map(({ id, date, dateStr, event, type }) => {
                                            const isStudy = type === "study";
                                            return (
                                                <div
                                                    key={id}
                                                    className={`group rounded-xl p-4 transition-all cursor-pointer border-2 ${isStudy ? "bg-blue-50/80 hover:bg-blue-100/80 border-blue-200/60" : "bg-gradient-to-br from-purple-50/50 to-white hover:from-purple-100/60 hover:to-white border-purple-200/40"}`}
                                                    onClick={() => { setSelectedDay(dateStr); setSelectedEventId(isStudy ? null : id); setEventText(isStudy ? "" : event); }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className={`flex-shrink-0 w-2.5 h-2.5 mt-1.5 rounded-full ${isStudy ? "bg-blue-600" : "bg-purple-600"}`} />
                                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white shadow-md ${isStudy ? "bg-gradient-to-br from-blue-600 to-blue-500" : "bg-gradient-to-br from-purple-900 to-purple-800"}`}>
                                                            <span className="text-[9px] font-bold uppercase">{date.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                                            <span className="text-sm font-bold leading-none mt-0.5">{date.getDate()}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[10px] font-bold mb-1 uppercase ${isStudy ? "text-blue-700" : "text-purple-700"}`}>
                                                                {date.toLocaleDateString("bg-BG", { weekday: "short" })}
                                                            </p>
                                                            <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{event}</p>
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

    // events view
    if (activeMenu === "events") {
        return (
            <div className="space-y-8">
                <div className="mb-10">
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Събития</h2>
                    <p className="text-base font-semibold text-slate-600">Прегледайте всички ваши събития</p>
                </div>
                <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6">Всички събития</h3>
                    <div className="space-y-3">
                        {getAllEvents().length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-sm font-normal text-slate-500">Няма събития. Добавете ново събитие от календара.</p>
                            </div>
                        ) : (
                            getAllEvents().map(({ id, date, dateStr, event }) => (
                                <div
                                    key={id}
                                    className="group bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl p-4.5 transition-all cursor-pointer"
                                    onClick={() => { setActiveMenu("calendar"); setSelectedDay(dateStr); setSelectedEventId(id); setEventText(event); }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-purple-600 mt-1" />
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-semibold shadow-sm bg-purple-900">
                                            <span className="uppercase">{date.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                            <span className="text-base font-bold leading-none mt-0.5">{date.getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-500 mb-1 uppercase">{date.toLocaleDateString("bg-BG", { weekday: "long" })}</p>
                                            <p className="text-base font-medium text-slate-900 line-clamp-1">{event}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // messages view - teacher only
    if (activeMenu === "messages" && isTeacher) {
        return (
            <div className="space-y-8">
                <div className="mb-10">
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Съобщения</h2>
                    <p className="text-base font-semibold text-slate-600">Прегледайте съобщенията от ученици</p>
                </div>
                <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Всички съобщения ({messages.length})</h3>
                        <button onClick={loadMessages} disabled={loadingMessages} className="px-4 py-2 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                            <svg className={`w-4 h-4 ${loadingMessages ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Обнови
                        </button>
                    </div>
                    <div className="space-y-3">
                        {loadingMessages ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 border-4 border-purple-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-sm font-semibold text-slate-700">Зареждане на съобщения...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-sm font-normal text-slate-500">Няма получени съобщения</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const messageDate = new Date(message.created_at);
                                const isRead = message.read_at !== null;
                                return (
                                    <div
                                        key={message.id}
                                        onClick={() => markMessageAsRead(message)}
                                        className={`group bg-gradient-to-br ${isRead ? "from-slate-50/60 to-white" : "from-purple-50/80 to-white"} hover:from-purple-100/70 hover:to-white border-2 ${isRead ? "border-slate-200/60" : "border-purple-300/60"} rounded-xl p-5 transition-all cursor-pointer`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center text-white text-lg font-bold">
                                                    {(message.student_name ?? "У").charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <p className="text-base font-bold text-slate-900">{message.student_name ?? "Ученик"}</p>
                                                        {message.student_email && <p className="text-xs font-medium text-slate-500">{message.student_email}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!isRead && <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />}
                                                        <span className="text-xs font-medium text-slate-500">
                                                            {messageDate.toLocaleDateString("bg-BG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{message.message}</p>
                                                {!isRead && <p className="text-xs font-semibold text-purple-600 mt-2">Кликнете, за да маркирате като прочетено</p>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // lessons view - teacher
    if (activeMenu === "lessons" && isTeacher) {
        const pending = pendingBookings.filter((b) => (b.status ?? "pending") === "pending");
        const confirmed = pendingBookings.filter((b) => b.status === "confirmed");
        return (
            <div className="max-w-3xl">
                <header className="mb-14 pb-8 border-b border-slate-200/80">
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Часове</h2>
                    <p className="text-slate-500 text-[15px] mt-2">Чакащи потвърждение и потвърдени часове. Можете да откажете час при нужда.</p>
                </header>
                {lessonsLoading ? (
                    <div className="flex flex-col items-center justify-center py-28 gap-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                        <p className="text-sm text-slate-500 font-medium">Зареждане...</p>
                    </div>
                ) : pendingBookings.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-20 text-center">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Няма записани часове</h3>
                        <p className="text-slate-500 text-[15px] max-w-sm mx-auto">Нови записи от ученици ще се появят тук.</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {pending.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3">Чакащи потвърждение</h3>
                                <ul className="space-y-3">
                                    {pending.map((b) => {
                                        const lessonDate = new Date(b.lesson_date + "T12:00");
                                        return (
                                            <li key={b.id} className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden">
                                                <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                                                    <div className="flex items-center gap-5 min-w-0 flex-1">
                                                        <div className="flex-shrink-0 w-[72px] rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center py-2.5">
                                                            <span className="text-[11px] font-semibold uppercase opacity-90">{lessonDate.toLocaleDateString("bg-BG", { weekday: "short" })}</span>
                                                            <span className="text-2xl font-bold leading-none tabular-nums">{lessonDate.toLocaleDateString("bg-BG", { day: "numeric" })}</span>
                                                            <span className="text-[11px] font-medium opacity-80">{lessonDate.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-slate-900 text-[15px]">{String(b.lesson_time).slice(0, 5)} ч.</p>
                                                            <p className="text-slate-600 text-[15px] mt-0.5 truncate">{b.student_name}</p>
                                                            {b.message && <p className="text-sm text-slate-400 mt-2 truncate max-w-sm" title={b.message}>{b.message}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2.5 sm:flex-shrink-0">
                                                        <button
                                                            type="button"
                                                            disabled={actingOnBookingId !== null}
                                                            onClick={() => handleConfirmBooking(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                                                        >
                                                            {actingOnBookingId === b.id ? "Изчакване..." : "Потвърди"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={actingOnBookingId !== null}
                                                            onClick={() => handleCancelByTeacher(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                                                        >
                                                            Откажи час
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        )}
                        {confirmed.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3">Потвърдени часове</h3>
                                <ul className="space-y-3">
                                    {confirmed.map((b) => {
                                        const lessonDate = new Date(b.lesson_date + "T12:00");
                                        return (
                                            <li key={b.id} className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden">
                                                <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                                                    <div className="flex items-center gap-5 min-w-0 flex-1">
                                                        <div className="flex-shrink-0 w-[72px] rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center py-2.5">
                                                            <span className="text-[11px] font-semibold uppercase opacity-90">{lessonDate.toLocaleDateString("bg-BG", { weekday: "short" })}</span>
                                                            <span className="text-2xl font-bold leading-none tabular-nums">{lessonDate.toLocaleDateString("bg-BG", { day: "numeric" })}</span>
                                                            <span className="text-[11px] font-medium opacity-80">{lessonDate.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-slate-900 text-[15px]">{String(b.lesson_time).slice(0, 5)} ч.</p>
                                                            <p className="text-slate-600 text-[15px] mt-0.5 truncate">{b.student_name}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={actingOnBookingId !== null}
                                                        onClick={() => handleCancelByTeacher(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                                                    >
                                                        Откажи час
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // lessons view - student
    if (activeMenu === "lessons" && role === "student") {
        return (
            <div className="max-w-3xl">
                <header className="mb-14 pb-8 border-b border-slate-200/80">
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Часове</h2>
                    <p className="text-slate-500 text-[15px] mt-2">Вашите записани уроци. Ще получите съобщение в чата при потвърждение или отказ.</p>
                </header>
                {lessonsLoading ? (
                    <div className="flex flex-col items-center justify-center py-28 gap-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                        <p className="text-sm text-slate-500 font-medium">Зареждане...</p>
                    </div>
                ) : studentBookings.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-20 text-center">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Нямате записани часове</h3>
                        <p className="text-slate-500 text-[15px] max-w-sm mx-auto mb-10">Намерете учител и запишете час — той ще се появи тук.</p>
                        <button onClick={() => navigate("/find-teacher")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800">
                            Намери учител <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {studentBookings.map((b) => {
                            const isPending = b.status === "pending";
                            const lessonDate = new Date(b.lesson_date + "T12:00");
                            return (
                                <li key={b.id} className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden">
                                    <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                                        <div className="flex items-center gap-5 min-w-0 flex-1">
                                            <div className="flex-shrink-0 w-[72px] rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center py-2.5">
                                                <span className="text-[11px] font-semibold uppercase opacity-90">{lessonDate.toLocaleDateString("bg-BG", { weekday: "short" })}</span>
                                                <span className="text-2xl font-bold leading-none tabular-nums">{lessonDate.toLocaleDateString("bg-BG", { day: "numeric" })}</span>
                                                <span className="text-[11px] font-medium opacity-80">{lessonDate.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-slate-900 text-[15px]">{String(b.lesson_time).slice(0, 5)} ч. · {b.teacher_name}</p>
                                                <p className="text-slate-500 text-[15px] mt-0.5">{formatDateLessons(b.lesson_date)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 sm:flex-shrink-0">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium ${isPending ? "bg-amber-50 text-amber-800 border border-amber-200/70" : "bg-emerald-50 text-emerald-800 border border-emerald-200/70"}`}>
                                                {isPending ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Чака потвърждение</> : <><svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Потвърден</>}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCancelMyBooking(b.id, b.teacher_id ?? "", b.lesson_date, b.lesson_time)}
                                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-red-600"
                                            >
                                                Откажи час
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        );
    }

    // settings view
    if (activeMenu === "settings") {
        return (
            <div className="space-y-8">
                <div className="mb-10">
                    <h2 className="text-5xl font-bold text-slate-800 tracking-tight mb-3 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Настройки</h2>
                    <p className="text-lg text-slate-600 font-bold">Персонализирайте вашите настройки</p>
                </div>
                <div className="bg-white rounded-3xl p-12 shadow-lg border border-purple-900/20 text-center">
                    <div className="w-20 h-20 bg-purple-900/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">Функционалността скоро ще бъде достъпна</h3>
                    <p className="text-lg text-slate-500 font-medium">Работим по добавянето на настройки</p>
                </div>
            </div>
        );
    }

    return null;
}
