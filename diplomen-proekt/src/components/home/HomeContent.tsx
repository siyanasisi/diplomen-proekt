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
        studyPlanHasContent: _studyPlanHasContent,
        getTodayStudyTasks,
        getTodayDateKey,
        getStudyPlanProgress,
        getUpcomingStudyTopics,
        daysUntilExam,
        longestStreak: _longestStreak,
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
            <div className="max-w-6xl mx-auto">
                {/* header */}
                <header className="mb-10">
                    <h1 className="text-4xl font-bold text-[#6B21A8] mb-2">Добре дошли обратно!</h1>
                    <p className="text-slate-500 text-lg">Преглед на днешната активност</p>
                </header>

                {/* confirmation bar */}
                {teacherPendingCount > 0 && (
                    <div
                        className="mb-8 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100"
                        style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="font-medium">Чакащи потвърждение: <span className="text-orange-600">{teacherPendingCount}</span></span>
                        </div>
                        <button
                            onClick={() => setActiveMenu("lessons")}
                            className="text-[#6B21A8] font-semibold flex items-center gap-1 hover:underline"
                        >
                            Виж всички <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                )}

                {/* stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div
                        className="bg-white p-6 rounded-2xl flex items-center gap-6 border border-slate-100"
                        style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}
                    >
                        <div className="w-16 h-16 bg-[#6B21A8] rounded-2xl flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-3xl">calendar_month</span>
                        </div>
                        <div>
                            <p className="text-[#6B21A8] font-bold text-xs uppercase tracking-wider mb-1">Общо събития</p>
                            <p className="text-5xl font-bold">{eventsList.length}</p>
                        </div>
                    </div>
                    <div
                        className="bg-white p-6 rounded-2xl flex items-center gap-6 border border-slate-100"
                        style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}
                    >
                        <div className="w-16 h-16 bg-[#6B21A8] rounded-2xl flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-3xl">schedule</span>
                        </div>
                        <div>
                            <p className="text-[#6B21A8] font-bold text-xs uppercase tracking-wider mb-1">Предстоящи</p>
                            <p className="text-5xl font-bold">{getUpcomingEvents().length}</p>
                        </div>
                    </div>
                </div>

                {/* Quick actions */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Бързи действия</h2>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => { setActiveMenu("calendar"); handleDayClick(new Date().getDate()); }}
                            className="bg-[#6B21A8] hover:bg-purple-800 text-white px-6 py-3 rounded-full flex items-center gap-2 font-medium transition-all shadow-lg shadow-purple-200"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            Добави събитие
                        </button>
                        <button
                            onClick={() => { setActiveMenu("calendar"); goToToday(); }}
                            className="bg-white text-slate-700 px-6 py-3 rounded-full flex items-center gap-2 font-medium border border-slate-200 hover:bg-slate-50 transition-all"
                            style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}
                        >
                            <span className="material-symbols-outlined">calendar_today</span>
                            Днес
                        </button>
                    </div>
                </section>

                {/* recent events */}
                <section>
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-xl font-bold">Последни събития</h2>
                        <button
                            onClick={() => setActiveMenu("events")}
                            className="text-[#6B21A8] font-semibold flex items-center gap-1 hover:underline"
                        >
                            Виж всички <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                    <div className="space-y-3">
                        {getAllEvents().slice(0, 5).length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-3xl text-slate-400">calendar_month</span>
                                </div>
                                <p className="text-sm text-slate-500">Няма събития. Добавете ново събитие от календара.</p>
                            </div>
                        ) : (
                            getAllEvents().slice(0, 5).map(({ id, date, dateStr, event }) => {
                                const monthNum = String(date.getMonth() + 1).padStart(2, "0");
                                const dayNum = String(date.getDate()).padStart(2, "0");
                                const weekday = date.toLocaleDateString("bg-BG", { weekday: "long" });
                                return (
                                    <div
                                        key={id}
                                        className="group flex items-center bg-white p-4 rounded-xl border border-slate-50 hover:border-[#6B21A8]/30 transition-all cursor-pointer"
                                        style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}
                                        onClick={() => { setActiveMenu("calendar"); setSelectedDay(dateStr); setSelectedEventId(id); setEventText(event); }}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-2 h-2 rounded-full bg-[#6B21A8] shrink-0" />
                                            <div className="bg-[#6B21A8] text-white w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[10px] uppercase font-bold leading-none opacity-80">{monthNum}</span>
                                                <span className="text-xl font-bold leading-none">{dayNum}</span>
                                            </div>
                                            <div className="ml-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{weekday}</p>
                                                <h3 className="text-lg font-semibold text-[#6B21A8]">{event}</h3>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        );
    }

    // dashboard - student
    if (activeMenu === "dashboard" && role === "student") {
        const todayTasks = getTodayStudyTasks();
        const progress = getStudyPlanProgress();
        const upcomingTopics = getUpcomingStudyTopics();

        const MONTH_ABBREV: Record<string, string> = {
            "януари": "ЯНУ", "февруари": "ФЕВ", "март": "МАР", "април": "АПР",
            "май": "МАЙ", "юни": "ЮНИ", "юли": "ЮЛИ", "август": "АВГ",
            "септември": "СЕП", "октомври": "ОКТ", "ноември": "НОЕ", "декември": "ДЕК",
        };
        const SUBJECT_ORDER = ["БЕЛ", "Математика", "Английски", "История"];
        const examSubject = studyPlan?.preferences.examSubject ?? "БЕЛ";
        const belProgress = progress?.completionPercentage ?? 0;

        return (
            <div className="max-w-[1200px] mx-auto pb-16" style={{ marginTop: "3rem" }}>
                {/* bookings banner */}
                {pendingBookingsCount > 0 && (
                    <div className="mb-6 flex items-center justify-between bg-amber-50/80 backdrop-blur-md border border-amber-200/60 p-4 rounded-2xl" style={{ marginBottom: "2rem" }}>
                        <div className="flex items-center gap-3">
                            <span className="material-icons-round text-amber-500 text-xl">hourglass_empty</span>
                            <p className="text-sm font-medium text-amber-800">
                                Имате {pendingBookingsCount} {pendingBookingsCount === 1 ? "час" : "часа"}, който чака потвърждение от учителя.
                            </p>
                        </div>
                        <button onClick={() => setActiveMenu("lessons")} className="text-amber-700 text-sm font-semibold hover:underline">
                            Виж всички
                        </button>
                    </div>
                )}

                {/* main */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* left column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* top small cards row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: "1.5rem" }}>
                            {/* lessons card */}
                            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm p-5 min-h-[120px] flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                                            <span className="material-icons-round text-xl">auto_stories</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">Часове</h3>
                                            <p className="text-xs uppercase tracking-wide text-slate-500">Днешна активност</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Днес:</span>
                                        <span className="text-2xl font-bold text-slate-900">{todayBookingsCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Чакащи:</span>
                                        <span className="text-2xl font-bold text-violet-600">{pendingBookingsCount}</span>
                                    </div>
                                </div>
                                <button onClick={() => setActiveMenu("lessons")} className="mt-4 h-9 px-3 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors w-full">
                                    Виж всички часове
                                </button>
                            </div>

                            {/* study plan card */}
                            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm p-5 min-h-[120px] flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                            <span className="material-icons-round text-xl">add_task</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">Учебен план</h3>
                                            <p className="text-xs uppercase tracking-wide text-slate-500">Нов предмет</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 mb-4 flex-1">Създай учебен план по още един матурен предмет.</p>
                                <button
                                    type="button"
                                    onClick={() => navigate("/study-plan/intro")}
                                    className="h-9 px-3 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-600/20 transition-all w-full flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons-round text-base">add</span> Добави план
                                </button>
                            </div>
                        </div>

                        {/* progress section */}
                        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900">Напредък в ученето</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Завършени теми: <span className="font-semibold text-slate-900">{progress?.completedTopics ?? 0} от {progress?.totalTopics ?? 22}</span>
                                    </p>
                                </div>
                                <div className="text-4xl font-extrabold text-emerald-500">{progress?.completionPercentage ?? 0}%</div>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className="bg-violet-600 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, progress?.completionPercentage ?? 0)}%` }} />
                            </div>
                            {/* subject tabs */}
                            <div className="mt-6 bg-slate-100 rounded-2xl p-1 flex gap-1">
                                {SUBJECT_ORDER.map((label) => {
                                    const isActive = label === "БЕЛ" && examSubject === "БЕЛ";
                                    const pct = isActive ? belProgress : "-";
                                    return (
                                        <div key={label} className={`flex-1 py-2 rounded-xl text-center text-sm font-semibold transition-all ${isActive ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
                                            <p>{label}</p>
                                            <p className={`text-xs mt-0.5 ${isActive ? "text-violet-600 font-bold" : "text-slate-400"}`}>{typeof pct === "number" ? `${pct}%` : pct}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* upcoming topics */}
                        <div style={{ marginTop: "1.5rem" }}>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-xl font-semibold text-slate-900">Предстоящи теми</h3>
                                <button onClick={() => setActiveMenu("calendar")} className="text-sm font-semibold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1">
                                    Виж всички <span className="material-icons-round text-base">arrow_forward</span>
                                </button>
                            </div>
                            {studyPlan && upcomingTopics.length > 0 ? (
                                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
                                    {upcomingTopics.slice(0, 3).map(({ date, studyDay }) => {
                                        const [y, m, d] = date.split("-").map(Number);
                                        const studyDate = new Date(y, m - 1, d);
                                        const dayNum = studyDate.getDate();
                                        const monthKey = studyDate.toLocaleDateString("bg-BG", { month: "long" }).toLowerCase();
                                        const monthAbbrev = MONTH_ABBREV[monthKey] ?? monthKey.slice(0, 3).toUpperCase();
                                        const firstTopic = studyDay.topics[0];
                                        const litTopic = studyDay.topics.find((t) => t.subject === "Литература");
                                        const { subjectId, topicId } = mapStudyPlanTopicToCurriculum(firstTopic as Topic);
                                        const todayPlanTopicIds = studyDay.topics.map((t) => mapStudyPlanTopicToCurriculum(t as Topic).topicId);
                                        return (
                                            <div
                                                key={date}
                                                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                onClick={() => {
                                                    if (!todayTasks?.completed && !todayTasks?.missed) {
                                                        navigate(`/study/learn/${subjectId}/${topicId}`, { state: { todayPlanTopicIds, todayDate: date } });
                                                    } else {
                                                        setActiveMenu("calendar");
                                                    }
                                                }}
                                            >
                                                {/* date badge */}
                                                <div className="w-14 shrink-0 text-center rounded-xl bg-slate-100 py-2">
                                                    <p className="text-lg font-bold text-slate-900">{dayNum}</p>
                                                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{monthAbbrev}</p>
                                                </div>
                                                {/* content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-0.5">{studyDay.topics.length} теми</p>
                                                    <h4 className="text-base font-semibold text-slate-900 group-hover:text-violet-600 transition-colors truncate">{firstTopic.name}</h4>
                                                    {litTopic && (
                                                        <p className="text-sm text-orange-500 font-medium truncate">{litTopic.name}</p>
                                                    )}
                                                </div>
                                                {/* action icon button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!todayTasks?.completed && !todayTasks?.missed) {
                                                            navigate(`/study/learn/${subjectId}/${topicId}`, { state: { todayPlanTopicIds, todayDate: date } });
                                                        }
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-violet-600 group-hover:text-white transition-all shrink-0"
                                                >
                                                    <span className="material-icons-round text-xl">play_arrow</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm p-6 text-center text-slate-500">
                                    Няма предстоящи теми. <button onClick={() => navigate("/study-plan/intro")} className="text-violet-600 font-semibold hover:underline">Създай учебен план</button>.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* right sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* exam countdown card */}
                        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
                            <h2 className="text-xl font-semibold text-slate-900">ДЗИ БЕЛ 2026</h2>
                            <p className="text-sm text-slate-500 mt-1">20 май 2026</p>
                            {/* countdown circle */}
                            <div className="my-5 relative w-40 h-40 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                    <circle className="text-slate-100" cx="80" cy="80" fill="transparent" r="72" stroke="currentColor" strokeWidth="10" />
                                    <circle
                                        className="text-violet-600"
                                        cx="80"
                                        cy="80"
                                        fill="transparent"
                                        r="72"
                                        stroke="currentColor"
                                        strokeDasharray={2 * Math.PI * 72}
                                        strokeDashoffset={2 * Math.PI * 72 - (2 * Math.PI * 72 * Math.min(100, progress?.completionPercentage ?? 0)) / 100}
                                        strokeLinecap="round"
                                        strokeWidth="10"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-bold text-violet-600">{daysUntilExam}</span>
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Дни остават</span>
                                </div>
                            </div>
                            {/* stats cards */}
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <div className="bg-slate-100 rounded-xl p-3 text-center">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Прогрес</p>
                                    <p className="text-lg font-bold text-slate-900">{progress?.completionPercentage ?? 0}%</p>
                                </div>
                                <div className="bg-slate-100 rounded-xl p-3 text-center">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Задачи</p>
                                    <p className="text-lg font-bold text-slate-900">{progress?.completedTopics ?? 0}/{progress?.totalTopics ?? 32}</p>
                                </div>
                            </div>
                            {/* CTA button */}
                            <button
                                onClick={() => {
                                    if (todayTasks && todayTasks.topics.length > 0 && !todayTasks.completed && !todayTasks.missed) {
                                        const first = todayTasks.topics[0];
                                        const { subjectId, topicId } = mapStudyPlanTopicToCurriculum(first as Topic);
                                        const todayPlanTopicIds = todayTasks.topics.map((t) => mapStudyPlanTopicToCurriculum(t as Topic).topicId);
                                        navigate(`/study/learn/${subjectId}/${topicId}`, { state: { todayPlanTopicIds, todayDate: getTodayDateKey() } });
                                    } else {
                                        navigate("/study");
                                    }
                                }}
                                className="mt-4 h-11 w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all shadow-sm shadow-violet-600/20"
                            >
                                Започни ученето
                            </button>
                        </div>

                        {/* recommended teachers */}
                        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm p-5" style={{ marginTop: "1.5rem" }}>
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Препоръчани учители</h3>
                            <div className="space-y-1">
                                <button onClick={() => navigate("/find-teacher")} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors w-full text-left">
                                    <img alt="Tutor" className="w-10 h-10 rounded-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGXdge3E-tPU4RMSzJ1g1StM6FyWjMx9pugeMSjnCiT-l1I1WPoXlBFL9Eh7jhkMFnIAe4poPFO0A9jasl4NYx_CJCnNbgsByRRTT9Xwnl9woh2IDosilVIcI2usnf1nCIhzTCGmA1MYvEKHIFJTiBXtTcVOSwfrL2XeJMV_7tI88zfvZGzbanN9q6om2sBG1ue8_gS_XGOrBSmSldOCjgHQxKEBmi5MrGm2GyQzgBx4pnDX7i2RgIa63N_tXxzZ6Dsiw-ROccvhZi" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">Проф. Иванова</p>
                                        <p className="text-xs text-slate-500">Български език</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-icons-round text-amber-400 text-sm">star</span>
                                        <span className="text-sm font-bold text-slate-900">4.9</span>
                                    </div>
                                </button>
                                <button onClick={() => navigate("/find-teacher")} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors w-full text-left">
                                    <img alt="Tutor" className="w-10 h-10 rounded-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfy5-FeemOOpPbXp7Qu5JsplbSIjagP_vPxC4j0vHTK3NGV_xQ1YdoNiimn7Cs7l8ztMYPTeRHVTBpcl3vWV6zXAVeszl6LFBcgTPY3I5ktha0SWOJvAIElordYVPMcslFgiAMn8dY4OyaQs2ebttgeH30yVPbNWLPcus2vBdQ3waQUprqfawm4XDrt_D36n00MIyVxKHEVHQTSz8TBNsKv-enGluo8OpWNX8cVtIloJPRSUlWdq8zk9AYQs-9MOjZlKp-MMWRBWYZ" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">Д-р Петров</p>
                                        <p className="text-xs text-slate-500">Литература</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-icons-round text-amber-400 text-sm">star</span>
                                        <span className="text-sm font-bold text-slate-900">5.0</span>
                                    </div>
                                </button>
                            </div>
                            <button onClick={() => navigate("/find-teacher")} className="mt-4 h-10 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-colors">
                                Разгледай всички
                            </button>
                        </div>
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
            <div className="space-y-12">
                <div className="mb-14">
                    <h2 className="text-5xl font-bold text-slate-900 tracking-tight mb-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Събития</h2>
                    <p className="text-xl font-semibold text-slate-600">Прегледайте всички ваши събития</p>
                </div>
                <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-3xl p-10 shadow-lg border-2 border-purple-200/40">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">Всички събития</h3>
                    <div className="space-y-4">
                        {getAllEvents().length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-sm font-normal text-slate-500">Няма събития. Добавете ново събитие от календара.</p>
                            </div>
                        ) : (
                            getAllEvents().map(({ id, date, dateStr, event }) => (
                                <div
                                    key={id}
                                    className="group bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl p-6 transition-all cursor-pointer"
                                    onClick={() => { setActiveMenu("calendar"); setSelectedDay(dateStr); setSelectedEventId(id); setEventText(event); }}
                                >
                                    <div className="flex items-center gap-5">
                                        <span className="flex-shrink-0 w-3 h-3 rounded-full bg-purple-600 mt-1" />
                                        <div className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white text-sm font-semibold shadow-sm bg-purple-900">
                                            <span className="uppercase">{date.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                            <span className="text-lg font-bold leading-none mt-0.5">{date.getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-500 mb-1 uppercase">{date.toLocaleDateString("bg-BG", { weekday: "long" })}</p>
                                            <p className="text-lg font-medium text-slate-900 line-clamp-1">{event}</p>
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
