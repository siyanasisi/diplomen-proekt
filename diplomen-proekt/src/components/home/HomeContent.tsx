import { useNavigate } from "react-router-dom";
import type { Topic } from "../../lib/topics";
import { mapStudyPlanTopicToCurriculum } from "../../lib/studyPlanMapping";
import { formatDateLessons } from "../../hooks/useHome";
import type { HomeEventItem, TeacherMessage, StudentBooking, PendingBooking } from "../../types/home";
import type { StudyPlan } from "../../lib/topics";

import type { HomeMenuId } from "../../types/home";
import { AlertBanner } from "../ui/feedback/AlertBanner";

function canCancelBefore24h(lessonDate: string, lessonTime: string): boolean {
    const normalizedTime = `${String(lessonTime).slice(0, 5)}:00`;
    const lessonDateTime = new Date(`${lessonDate}T${normalizedTime}`);
    if (Number.isNaN(lessonDateTime.getTime())) return false;
    return lessonDateTime.getTime() - Date.now() >= 24 * 60 * 60 * 1000;
}

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
    openDateModal: (date: Date) => void;
    openTodayModal: () => void;
    getStudyPlanProgress: () => { completionPercentage: number; completedTopics: number; totalTopics: number } | null;
    getUpcomingStudyTopics: () => { date: string; studyDay: { topics: { subject: string; name: string }[] }; isToday: boolean }[];
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
        openDateModal,
        openTodayModal,
        getStudyPlanProgress,
        getUpcomingStudyTopics,
        daysUntilExam: _daysUntilExam,
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
            <div className="max-w-5xl mx-auto">
                <header style={{ marginBottom: '2rem' }}>
                    <h1 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Добре дошли обратно!</h1>
                    <p className="text-slate-500" style={{ fontSize: '0.9375rem', marginTop: '0.25rem' }}>Преглед на днешната активност</p>
                </header>

                {teacherPendingCount > 0 && (
                    <AlertBanner variant="warning" className="!items-center" style={{ marginBottom: '1.5rem' }}>
                        <div className="flex items-center justify-between w-full gap-3 flex-wrap">
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                Чакащи потвърждение: <span style={{ fontWeight: 700 }}>{teacherPendingCount}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setActiveMenu("lessons")}
                                className="text-purple-700 hover:text-purple-800 shrink-0"
                                style={{ fontSize: '0.8125rem', fontWeight: 600 }}
                            >
                                Виж всички →
                            </button>
                        </div>
                    </AlertBanner>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
                    <div className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
                        <div className="flex items-center" style={{ gap: '1rem' }}>
                            <div className="flex items-center justify-center bg-purple-700 text-white" style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.375rem' }}>calendar_month</span>
                            </div>
                            <div>
                                <p className="text-purple-700 uppercase" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.125rem' }}>Общо събития</p>
                                <p className="text-slate-900" style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1 }}>{eventsList.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
                        <div className="flex items-center" style={{ gap: '1rem' }}>
                            <div className="flex items-center justify-center bg-purple-700 text-white" style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.375rem' }}>schedule</span>
                            </div>
                            <div>
                                <p className="text-purple-700 uppercase" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.125rem' }}>Предстоящи</p>
                                <p className="text-slate-900" style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1 }}>{getUpcomingEvents().length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.75rem' }}>Бързи действия</h2>
                    <div className="flex flex-wrap" style={{ gap: '0.75rem' }}>
                        <button
                            onClick={() => { setActiveMenu("calendar"); openTodayModal(); }}
                            className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors"
                            style={{ gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                        >
                            <span className="material-icons" style={{ fontSize: '1.125rem' }}>add_circle</span>
                            Добави събитие
                        </button>
                        <button
                            onClick={() => { setActiveMenu("calendar"); goToToday(); }}
                            className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center transition-colors"
                            style={{ gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                        >
                            <span className="material-icons" style={{ fontSize: '1.125rem' }}>calendar_today</span>
                            Днес
                        </button>
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                        <h2 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600 }}>Последни събития</h2>
                        <button onClick={() => setActiveMenu("events")} className="text-purple-700 hover:text-purple-800" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                            Виж всички →
                        </button>
                    </div>
                    <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                        {getAllEvents().slice(0, 5).length === 0 ? (
                            <div className="bg-white border border-slate-200 text-center" style={{ borderRadius: '1rem', padding: '3rem' }}>
                                <span className="material-icons text-slate-300" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'block' }}>calendar_month</span>
                                <p className="text-slate-500" style={{ fontSize: '0.875rem' }}>Няма събития. Добавете ново от календара.</p>
                            </div>
                        ) : (
                            getAllEvents().slice(0, 5).map(({ id, date, dateStr, event }) => {
                                const monthNum = String(date.getMonth() + 1).padStart(2, "0");
                                const dayNum = String(date.getDate()).padStart(2, "0");
                                const weekday = date.toLocaleDateString("bg-BG", { weekday: "long" });
                                return (
                                    <div
                                        key={id}
                                        className="group flex items-center bg-white border border-slate-200 hover:border-purple-300 cursor-pointer transition-all"
                                        style={{ borderRadius: '0.75rem', padding: '1rem 1.25rem', gap: '1rem' }}
                                        onClick={() => { setActiveMenu("calendar"); setSelectedDay(dateStr); setSelectedEventId(id); setEventText(event); }}
                                    >
                                        <div className="flex items-center justify-center bg-purple-700 text-white shrink-0" style={{ width: '3rem', height: '3rem', borderRadius: '0.625rem' }}>
                                            <div className="text-center">
                                                <span style={{ fontSize: '0.5625rem', fontWeight: 700, display: 'block', opacity: 0.8 }}>{monthNum}</span>
                                                <span style={{ fontSize: '1.125rem', fontWeight: 800, lineHeight: 1 }}>{dayNum}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-400 uppercase" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.125rem' }}>{weekday}</p>
                                            <h3 className="text-slate-900 truncate" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{event}</h3>
                                        </div>
                                        <span className="material-icons text-slate-300 group-hover:text-purple-700 transition-colors" style={{ fontSize: '1.125rem' }}>chevron_right</span>
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
        const selectedExamSubject = studyPlan?.preferences.examSubject ?? null;
        const getPlanProgress = (plan: StudyPlan) => {
            const totalTopics = plan.plan.reduce((sum, day) => sum + day.topics.length, 0);
            const completedTopics = plan.plan
                .filter((d) => d.completed)
                .reduce((sum, day) => sum + day.topics.length, 0);
            const completionPercentage =
                totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
            return { totalTopics, completedTopics, completionPercentage };
        };
        const getDaysUntilExam = (plan: StudyPlan) => {
            const examDate = plan.preferences.examDate;
            const date = examDate instanceof Date ? examDate : new Date(examDate);
            const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return Math.max(0, diffDays);
        };

        return (
            <div className="max-w-5xl mx-auto" style={{ paddingBottom: '4rem' }}>
                {pendingBookingsCount > 0 && (
                    <AlertBanner variant="warning" className="!items-center" style={{ marginBottom: '1.5rem' }}>
                        <div className="flex items-center justify-between w-full gap-3 flex-wrap">
                            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                Имате {pendingBookingsCount} {pendingBookingsCount === 1 ? "час" : "часа"}, който чака потвърждение.
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveMenu("lessons")}
                                className="text-purple-700 hover:text-purple-800 shrink-0"
                                style={{ fontSize: '0.8125rem', fontWeight: 600 }}
                            >
                                Виж всички
                            </button>
                        </div>
                    </AlertBanner>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 items-start" style={{ gap: '1.5rem' }}>
                    <div className="lg:col-span-8 flex flex-col" style={{ gap: '1.25rem' }}>
                        {/* top cards row */}
                        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1rem' }}>
                            <div className="bg-white border border-slate-200 flex flex-col" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
                                <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div className="flex items-center justify-center bg-purple-50 text-purple-700" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem' }}>
                                        <span className="material-icons" style={{ fontSize: '1.25rem' }}>auto_stories</span>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 600 }}>Часове</h3>
                                        <p className="text-slate-500 uppercase" style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em' }}>Днешна активност</p>
                                    </div>
                                </div>
                                <div className="flex-1" style={{ marginBottom: '1rem' }}>
                                    <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                                        <span className="text-slate-500" style={{ fontSize: '0.875rem' }}>Днес:</span>
                                        <span className="text-slate-900" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{todayBookingsCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500" style={{ fontSize: '0.875rem' }}>Чакащи:</span>
                                        <span className="text-purple-700" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{pendingBookingsCount}</span>
                                    </div>
                                </div>
                                <button onClick={() => setActiveMenu("lessons")} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors" style={{ height: '2.25rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                                    Виж всички часове
                                </button>
                            </div>

                            <div className="bg-white border border-slate-200 flex flex-col" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
                                <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div className="flex items-center justify-center bg-emerald-50 text-emerald-600" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem' }}>
                                        <span className="material-icons" style={{ fontSize: '1.25rem' }}>add_task</span>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 600 }}>Учебен план</h3>
                                        <p className="text-slate-500 uppercase" style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em' }}>Нов предмет</p>
                                    </div>
                                </div>
                                <p className="text-slate-500 flex-1" style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>Създай учебен план по още един матурен предмет.</p>
                                <button
                                    type="button"
                                    onClick={() => navigate("/study-plan/intro")}
                                    className="w-full bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center transition-colors"
                                    style={{ height: '2.25rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, gap: '0.375rem' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '1rem' }}>add</span> Добави план
                                </button>
                            </div>
                        </div>

                        {/* progress section */}
                        <div className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
                            <div className="flex items-start justify-between" style={{ marginBottom: '1.25rem' }}>
                                <div>
                                    <h3 className="text-slate-900" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                                        {selectedExamSubject ? `Напредък в ученето · ${selectedExamSubject}` : "Напредък в ученето"}
                                    </h3>
                                    <p className="text-slate-500" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                        {selectedExamSubject ? (
                                            <>Завършени теми: <span className="text-slate-900" style={{ fontWeight: 600 }}>{progress?.completedTopics ?? 0} от {progress?.totalTopics ?? 22}</span></>
                                        ) : (
                                            "Няма избран предмет."
                                        )}
                                    </p>
                                </div>
                                <div className="text-emerald-500" style={{ fontSize: '2rem', fontWeight: 800 }}>
                                    {selectedExamSubject ? `${progress?.completionPercentage ?? 0}%` : "—"}
                                </div>
                            </div>
                            <div className="bg-slate-100 overflow-hidden" style={{ height: '0.5rem', borderRadius: '0.25rem' }}>
                                <div className="bg-purple-700 h-full transition-all duration-1000" style={{ width: `${Math.min(100, selectedExamSubject ? progress?.completionPercentage ?? 0 : 0)}%`, borderRadius: '0.25rem' }} />
                            </div>
                            <div className="flex bg-slate-50 border border-slate-100 flex-wrap" style={{ marginTop: '1.25rem', borderRadius: '0.625rem', padding: '0.25rem', gap: '0.25rem' }}>
                                {plansWithId.map((plan) => {
                                    const isActive = plan.id === selectedPlanId || (!selectedPlanId && plan.id === effectivePlanId);
                                    const subjectProgress = getPlanProgress(plan).completionPercentage;
                                    return (
                                        <div
                                            key={plan.id}
                                            className={`text-center transition-all cursor-pointer ${isActive ? "bg-white shadow-sm" : ""}`}
                                            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', minWidth: '8rem' }}
                                            onClick={() => setSelectedPlanId(plan.id)}
                                        >
                                            <p className={isActive ? "text-slate-900" : "text-slate-500"} style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                                                {plan.preferences.examSubject}
                                            </p>
                                            <p className={isActive ? "text-purple-700" : "text-slate-400"} style={{ fontSize: '0.6875rem', fontWeight: isActive ? 700 : 500, marginTop: '0.125rem' }}>
                                                {subjectProgress}%
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* upcoming topics */}
                        <div>
                            <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                                <h3 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600 }}>Днес и предстоящи</h3>
                                <button onClick={() => setActiveMenu("calendar")} className="text-purple-700 hover:text-purple-800 inline-flex items-center" style={{ fontSize: '0.8125rem', fontWeight: 600, gap: '0.25rem' }}>
                                    Виж всички <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span>
                                </button>
                            </div>
                            {studyPlan && upcomingTopics.length > 0 ? (
                                <div className="bg-white border border-slate-200 overflow-hidden divide-y divide-slate-100" style={{ borderRadius: '1rem' }}>
                                    {upcomingTopics.slice(0, 3).map(({ date, studyDay, isToday }) => {
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
                                                className={`flex items-center transition-colors cursor-pointer group ${isToday ? 'bg-purple-50 hover:bg-purple-100' : 'hover:bg-slate-50'}`}
                                                style={{ gap: '1rem', padding: '1rem 1.25rem' }}
                                                onClick={() => {
                                                    if (!todayTasks?.completed && !todayTasks?.missed) {
                                                        navigate(`/study/learn/${subjectId}/${topicId}`, { state: { todayPlanTopicIds, todayDate: date } });
                                                    } else {
                                                        setActiveMenu("calendar");
                                                    }
                                                }}
                                            >
                                                <div className={`shrink-0 text-center border ${isToday ? 'bg-purple-700 border-purple-700' : 'bg-slate-50 border-slate-100'}`} style={{ width: '3.25rem', borderRadius: '0.5rem', padding: '0.375rem 0' }}>
                                                    <p className={isToday ? 'text-white' : 'text-slate-900'} style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{dayNum}</p>
                                                    <p className={isToday ? 'text-purple-200 uppercase' : 'text-slate-500 uppercase'} style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.04em' }}>{isToday ? 'ДНЕС' : monthAbbrev}</p>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-purple-700 uppercase" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.125rem' }}>{isToday ? `Днешен план · ${studyDay.topics.length} теми` : `${studyDay.topics.length} теми`}</p>
                                                    <h4 className="text-slate-900 group-hover:text-purple-700 transition-colors truncate" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{firstTopic.name}</h4>
                                                    {litTopic && (
                                                        <p className="text-orange-500 truncate" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{litTopic.name}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!todayTasks?.completed && !todayTasks?.missed) {
                                                            navigate(`/study/learn/${subjectId}/${topicId}`, { state: { todayPlanTopicIds, todayDate: date } });
                                                        }
                                                    }}
                                                    className={`flex items-center justify-center transition-all shrink-0 ${isToday ? 'bg-purple-700 text-white hover:bg-purple-800' : 'bg-slate-50 hover:bg-purple-700 text-slate-400 hover:text-white'}`}
                                                    style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem' }}
                                                >
                                                    <span className="material-icons" style={{ fontSize: '1.25rem' }}>play_arrow</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-200 text-center text-slate-500" style={{ borderRadius: '1rem', padding: '2rem', fontSize: '0.875rem' }}>
                                    Няма предстоящи теми. <button onClick={() => navigate("/study-plan/intro")} className="text-purple-700 hover:text-purple-800" style={{ fontWeight: 600 }}>Създай учебен план</button>.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* right sidebar */}
                    <div className="lg:col-span-4 flex flex-col" style={{ gap: '1.25rem' }}>
                        {/* dynamic exam/progress windows */}
                        <div className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
                            <h2 className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                                Прозорци до матурата
                            </h2>
                            <div className="flex flex-col" style={{ gap: '0.625rem' }}>
                                {plansWithId.length === 0 ? (
                                    <p className="text-slate-500" style={{ fontSize: '0.8125rem' }}>
                                        Няма активни планове.
                                    </p>
                                ) : (
                                    plansWithId.map((plan) => {
                                        const p = getPlanProgress(plan);
                                        const daysLeft = getDaysUntilExam(plan);
                                        const examDateLabel = plan.preferences.examDate.toLocaleDateString("bg-BG", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        });
                                        const isActive = plan.id === selectedPlanId || (!selectedPlanId && plan.id === effectivePlanId);
                                        return (
                                            <button
                                                key={plan.id}
                                                type="button"
                                                onClick={() => setSelectedPlanId(plan.id)}
                                                className={`w-full text-left transition-colors border ${isActive ? "border-purple-200 bg-purple-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                                                style={{ borderRadius: '0.75rem', padding: '0.75rem' }}
                                            >
                                                <div className="flex items-center justify-between" style={{ gap: '0.75rem' }}>
                                                    <div>
                                                        <p className="text-slate-900" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                                                            {plan.preferences.examSubject}
                                                        </p>
                                                        <p className="text-slate-500" style={{ fontSize: '0.6875rem' }}>
                                                            Изпит: {examDateLabel}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-purple-700" style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>
                                                            {daysLeft}
                                                        </p>
                                                        <p className="text-slate-500 uppercase" style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                                                            дни остават
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between" style={{ marginTop: '0.5rem' }}>
                                                    <p className="text-slate-500" style={{ fontSize: '0.6875rem' }}>
                                                        Прогрес: <span className="text-slate-700" style={{ fontWeight: 700 }}>{p.completionPercentage}%</span>
                                                    </p>
                                                    <p className="text-slate-500" style={{ fontSize: '0.6875rem' }}>
                                                        {p.completedTopics}/{p.totalTopics} теми
                                                    </p>
                                                </div>
                                                <div className="bg-slate-200 overflow-hidden" style={{ height: '0.375rem', borderRadius: '999px', marginTop: '0.375rem' }}>
                                                    <div className="bg-purple-700 h-full" style={{ width: `${Math.min(100, p.completionPercentage)}%` }} />
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
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
                                className="w-full bg-purple-700 hover:bg-purple-800 text-white transition-colors"
                                style={{ marginTop: '1rem', height: '2.75rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                            >
                                Започни ученето
                            </button>
                        </div>

                        {/* recommended teachers */}
                        <div className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
                            <h3 className="text-slate-900" style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Препоръчани учители</h3>
                            <div className="flex flex-col" style={{ gap: '0.25rem' }}>
                                <button onClick={() => navigate("/find-teacher")} className="flex items-center hover:bg-slate-50 transition-colors w-full text-left" style={{ gap: '0.75rem', padding: '0.625rem', borderRadius: '0.5rem' }}>
                                    <img alt="Tutor" className="object-cover" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem' }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGXdge3E-tPU4RMSzJ1g1StM6FyWjMx9pugeMSjnCiT-l1I1WPoXlBFL9Eh7jhkMFnIAe4poPFO0A9jasl4NYx_CJCnNbgsByRRTT9Xwnl9woh2IDosilVIcI2usnf1nCIhzTCGmA1MYvEKHIFJTiBXtTcVOSwfrL2XeJMV_7tI88zfvZGzbanN9q6om2sBG1ue8_gS_XGOrBSmSldOCjgHQxKEBmi5MrGm2GyQzgBx4pnDX7i2RgIa63N_tXxzZ6Dsiw-ROccvhZi" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Проф. Иванова</p>
                                        <p className="text-slate-500" style={{ fontSize: '0.75rem' }}>Български език</p>
                                    </div>
                                    <div className="flex items-center" style={{ gap: '0.25rem' }}>
                                        <span className="material-icons text-amber-400" style={{ fontSize: '0.875rem' }}>star</span>
                                        <span className="text-slate-900" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>4.9</span>
                                    </div>
                                </button>
                                <button onClick={() => navigate("/find-teacher")} className="flex items-center hover:bg-slate-50 transition-colors w-full text-left" style={{ gap: '0.75rem', padding: '0.625rem', borderRadius: '0.5rem' }}>
                                    <img alt="Tutor" className="object-cover" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem' }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfy5-FeemOOpPbXp7Qu5JsplbSIjagP_vPxC4j0vHTK3NGV_xQ1YdoNiimn7Cs7l8ztMYPTeRHVTBpcl3vWV6zXAVeszl6LFBcgTPY3I5ktha0SWOJvAIElordYVPMcslFgiAMn8dY4OyaQs2ebttgeH30yVPbNWLPcus2vBdQ3waQUprqfawm4XDrt_D36n00MIyVxKHEVHQTSz8TBNsKv-enGluo8OpWNX8cVtIloJPRSUlWdq8zk9AYQs-9MOjZlKp-MMWRBWYZ" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Д-р Петров</p>
                                        <p className="text-slate-500" style={{ fontSize: '0.75rem' }}>Литература</p>
                                    </div>
                                    <div className="flex items-center" style={{ gap: '0.25rem' }}>
                                        <span className="material-icons text-amber-400" style={{ fontSize: '0.875rem' }}>star</span>
                                        <span className="text-slate-900" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>5.0</span>
                                    </div>
                                </button>
                            </div>
                            <button onClick={() => navigate("/find-teacher")} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors" style={{ marginTop: '0.75rem', height: '2.25rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
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
            <div className="max-w-6xl mx-auto" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
                {role === "student" && plansWithId.length > 1 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="text-slate-600" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>План по предмет</label>
                        <select
                            value={plansWithId.some((p) => p.id === selectedPlanId) ? selectedPlanId ?? "" : effectivePlanId}
                            onChange={(e) => {
                                const id = e.target.value;
                                if (id && plansWithId.some((p) => p.id === id)) {
                                    setSelectedPlanId(id);
                                    if (typeof window !== "undefined") sessionStorage.setItem("homeSelectedPlanId", id);
                                }
                            }}
                            className="text-slate-800 bg-white border border-slate-200 focus:border-purple-500 outline-none transition-all"
                            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}
                        >
                            {plansWithId.map((p) => (
                                <option key={p.id} value={p.id}>{p.preferences.examSubject}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '1.25rem' }}>
                    <div className="lg:col-span-2 bg-white border border-slate-200 relative overflow-hidden" style={{ borderRadius: '1rem', padding: '2rem' }}>
                        <div className="flex items-center justify-center" style={{ gap: '2rem', marginBottom: '1.5rem' }}>
                            <button onClick={goToPreviousMonth} className="text-slate-400 hover:text-slate-700 transition-colors" style={{ padding: '0.375rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.25rem' }}>chevron_left</span>
                            </button>
                            <h3 className="text-slate-900" style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <button onClick={goToNextMonth} className="text-slate-400 hover:text-slate-700 transition-colors" style={{ padding: '0.375rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.25rem' }}>chevron_right</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-7" style={{ gap: '0.25rem', marginBottom: '0.5rem' }}>
                            {DAY_NAMES.map((day) => (
                                <div key={day} className="text-center text-slate-400 uppercase" style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.04em', padding: '0.5rem 0' }}>{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7" style={{ gap: '0.25rem' }}>
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
                                        className={`relative aspect-square flex flex-col items-center justify-center transition-all ${
                                            isToday ? "bg-purple-700 text-white" :
                                            studyDay?.completed ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" :
                                            studyDay?.missed ? "bg-red-50 text-red-700 hover:bg-red-100" :
                                            hasStudyTopics ? "bg-blue-50 text-blue-700 hover:bg-blue-100" :
                                            "text-slate-700 hover:bg-slate-50"
                                        }`}
                                        style={{ borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 500, padding: '0.125rem' }}
                                    >
                                        <span>{day}</span>
                                        {hasDot && !isToday && <div className="absolute" style={{ bottom: '0.25rem', right: '0.25rem' }}><span className="block bg-purple-700" style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%' }} /></div>}
                                        {hasStudyTopics && (
                                            <div className="absolute flex items-center" style={{ bottom: '0.125rem', left: '0.125rem', gap: '0.125rem' }}>
                                                {studyDay!.topics.slice(0, 2).map((topic, idx) => (
                                                    <span key={idx} className={topic.subject === "Български език" ? "bg-purple-600" : "bg-amber-500"} style={{ width: '0.1875rem', height: '0.1875rem', borderRadius: '50%', display: 'block' }} title={topic.name} />
                                                ))}
                                                {studyDay!.topics.length > 2 && <span style={{ fontSize: '0.5rem', lineHeight: 1 }}>+{studyDay!.topics.length - 2}</span>}
                                            </div>
                                        )}
                                        {studyDay?.completed && <div className="absolute" style={{ top: '0.125rem', right: '0.125rem', fontSize: '0.625rem' }}>✓</div>}
                                        {studyDay?.missed && <div className="absolute" style={{ top: '0.125rem', right: '0.125rem', fontSize: '0.625rem' }}>✗</div>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100" style={{ marginTop: '1.5rem', paddingTop: '1.25rem' }}>
                            <div className="flex items-center flex-wrap" style={{ gap: '1.25rem' }}>
                                {[
                                    { color: 'bg-purple-700', label: 'Днес' },
                                    { color: 'bg-purple-700', label: 'Събития', dot: true },
                                    ...(studyPlanCal && role === "student" ? [
                                        { color: 'bg-blue-100 border border-blue-300', label: 'Учебни теми' },
                                        { color: 'bg-emerald-100 border border-emerald-300', label: 'Завършено' },
                                    ] : []),
                                ].map((legend) => (
                                    <div key={legend.label} className="flex items-center" style={{ gap: '0.375rem' }}>
                                        <div className={legend.color} style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%' }} />
                                        <span className="text-slate-500" style={{ fontSize: '0.6875rem' }}>{legend.label}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => openTodayModal()} className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors" style={{ padding: '0.4375rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, gap: '0.375rem' }}>
                                <span className="material-icons" style={{ fontSize: '1rem' }}>add</span>
                                Добави
                            </button>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-slate-200 sticky" style={{ borderRadius: '1rem', padding: '1.25rem', top: '1.5rem' }}>
                            <h3 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '1rem' }}>Предстоящо</h3>
                            <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                                {getUpcomingEvents().length === 0 ? (
                                    <div className="text-center" style={{ padding: '2rem 0' }}>
                                        <p className="text-slate-400" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Няма предстоящи събития</p>
                                    </div>
                                ) : (
                                    getUpcomingEvents().map(({ id, date, dateStr, event, type }) => {
                                        const isStudy = type === "study";
                                        return (
                                            <div
                                                key={id}
                                                className={`cursor-pointer transition-all ${isStudy ? "bg-blue-50 border border-blue-100 hover:bg-blue-100" : "bg-slate-50 border border-slate-100 hover:bg-slate-100"}`}
                                                style={{ borderRadius: '0.625rem', padding: '0.75rem' }}
                                                onClick={() => {
                                                    if (isStudy) {
                                                        openDateModal(new Date(`${dateStr}T12:00:00`));
                                                    } else {
                                                        setSelectedDay(dateStr);
                                                        setSelectedEventId(id);
                                                        setEventText(event);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-start" style={{ gap: '0.625rem' }}>
                                                    <div className={`flex-shrink-0 flex flex-col items-center justify-center text-white ${isStudy ? "bg-blue-600" : "bg-purple-700"}`} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.375rem' }}>
                                                        <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>{date.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, lineHeight: 1 }}>{date.getDate()}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={isStudy ? "text-blue-600" : "text-purple-700"} style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.125rem' }}>
                                                            {date.toLocaleDateString("bg-BG", { weekday: "short" })}
                                                        </p>
                                                        <p className="text-slate-800 line-clamp-2" style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3 }}>{event}</p>
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
        );
    }

    // events view
    if (activeMenu === "events") {
        return (
            <div className="max-w-4xl mx-auto" style={{ paddingBottom: '3rem' }}>
                <header style={{ marginBottom: '1.5rem' }}>
                    <h2 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Събития</h2>
                    <p className="text-slate-500" style={{ fontSize: '0.9375rem', marginTop: '0.25rem' }}>Прегледайте всички ваши събития</p>
                </header>
                <div className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
                    <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                        {getAllEvents().length === 0 ? (
                            <div className="text-center" style={{ padding: '3rem 0' }}>
                                <span className="material-icons text-slate-300" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>event_busy</span>
                                <p className="text-slate-500" style={{ fontSize: '0.875rem' }}>Няма събития. Добавете ново от календара.</p>
                            </div>
                        ) : (
                            getAllEvents().map(({ id, date, dateStr, event }) => (
                                <div
                                    key={id}
                                    className="group flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-100 cursor-pointer transition-all"
                                    style={{ borderRadius: '0.75rem', padding: '1rem 1.25rem', gap: '1rem' }}
                                    onClick={() => { setActiveMenu("calendar"); setSelectedDay(dateStr); setSelectedEventId(id); setEventText(event); }}
                                >
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center text-white bg-purple-700" style={{ width: '3rem', height: '3rem', borderRadius: '0.625rem' }}>
                                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase' }}>{date.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                        <span style={{ fontSize: '1.125rem', fontWeight: 800, lineHeight: 1 }}>{date.getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-400 uppercase" style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.125rem' }}>{date.toLocaleDateString("bg-BG", { weekday: "long" })}</p>
                                        <p className="text-slate-900 line-clamp-1" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{event}</p>
                                    </div>
                                    <span className="material-icons text-slate-300 group-hover:text-purple-700 transition-colors" style={{ fontSize: '1.125rem' }}>chevron_right</span>
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
            <div className="max-w-4xl mx-auto" style={{ paddingBottom: '3rem' }}>
                <header style={{ marginBottom: '1.5rem' }}>
                    <h2 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Съобщения</h2>
                    <p className="text-slate-500" style={{ fontSize: '0.9375rem', marginTop: '0.25rem' }}>Прегледайте съобщенията от ученици</p>
                </header>
                <div className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
                        <h3 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600 }}>Всички съобщения ({messages.length})</h3>
                        <button onClick={loadMessages} disabled={loadingMessages} className="text-purple-700 hover:bg-purple-50 disabled:opacity-50 flex items-center transition-colors" style={{ fontSize: '0.8125rem', fontWeight: 600, gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '0.5rem' }}>
                            <span className={`material-icons ${loadingMessages ? "animate-spin" : ""}`} style={{ fontSize: '1rem' }}>refresh</span>
                            Обнови
                        </button>
                    </div>
                    <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                        {loadingMessages ? (
                            <div className="text-center" style={{ padding: '3rem 0' }}>
                                <div className="mx-auto animate-spin" style={{ width: '2rem', height: '2rem', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', marginBottom: '0.75rem' }} />
                                <p className="text-slate-500" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Зареждане на съобщения...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center" style={{ padding: '3rem 0' }}>
                                <span className="material-icons text-slate-300" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>inbox</span>
                                <p className="text-slate-500" style={{ fontSize: '0.875rem' }}>Няма получени съобщения</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const messageDate = new Date(message.created_at);
                                const isRead = message.read_at !== null;
                                return (
                                    <div
                                        key={message.id}
                                        onClick={() => markMessageAsRead(message)}
                                        className={`cursor-pointer transition-all ${isRead ? "bg-slate-50 border border-slate-100 hover:bg-slate-100" : "bg-purple-50 border border-purple-100 hover:bg-purple-100"}`}
                                        style={{ borderRadius: '0.75rem', padding: '1rem 1.25rem' }}
                                    >
                                        <div className="flex items-start" style={{ gap: '0.875rem' }}>
                                            <div className="flex-shrink-0 flex items-center justify-center bg-purple-700 text-white" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', fontSize: '1rem', fontWeight: 700 }}>
                                                {(message.student_name ?? "У").charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between" style={{ marginBottom: '0.375rem' }}>
                                                    <div>
                                                        <p className="text-slate-900" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{message.student_name ?? "Ученик"}</p>
                                                        {message.student_email && <p className="text-slate-500" style={{ fontSize: '0.75rem' }}>{message.student_email}</p>}
                                                    </div>
                                                    <div className="flex items-center" style={{ gap: '0.5rem' }}>
                                                        {!isRead && <span className="bg-purple-600 animate-pulse" style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', display: 'block' }} />}
                                                        <span className="text-slate-400" style={{ fontSize: '0.75rem' }}>
                                                            {messageDate.toLocaleDateString("bg-BG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-slate-700 whitespace-pre-wrap" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>{message.message}</p>
                                                {!isRead && <p className="text-purple-700" style={{ fontSize: '0.6875rem', fontWeight: 600, marginTop: '0.5rem' }}>Кликнете, за да маркирате като прочетено</p>}
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
            <div className="max-w-4xl mx-auto" style={{ paddingBottom: '3rem' }}>
                <header className="border-b border-slate-100" style={{ marginBottom: '2rem', paddingBottom: '1.25rem' }}>
                    <h2 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Часове</h2>
                    <p className="text-slate-500" style={{ fontSize: '0.9375rem', marginTop: '0.25rem' }}>Чакащи потвърждение и потвърдени часове.</p>
                </header>
                {lessonsLoading ? (
                    <div className="flex flex-col items-center justify-center bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '4rem 2rem', gap: '1rem' }}>
                        <div className="animate-spin" style={{ width: '2rem', height: '2rem', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%' }} />
                        <p className="text-slate-500" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Зареждане...</p>
                    </div>
                ) : pendingBookings.length === 0 ? (
                    <div className="bg-white border border-slate-200 text-center" style={{ borderRadius: '1rem', padding: '4rem 2rem' }}>
                        <span className="material-icons text-slate-300" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>event_busy</span>
                        <h3 className="text-slate-800" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.375rem' }}>Няма записани часове</h3>
                        <p className="text-slate-500" style={{ fontSize: '0.875rem', maxWidth: '20rem', margin: '0 auto' }}>Нови записи от ученици ще се появят тук.</p>
                    </div>
                ) : (
                    <div className="flex flex-col" style={{ gap: '2rem' }}>
                        {pending.length > 0 && (
                            <section>
                                <h3 className="text-amber-800 uppercase" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.625rem' }}>Чакащи потвърждение</h3>
                                <ul className="flex flex-col" style={{ gap: '0.5rem' }}>
                                    {pending.map((b) => {
                                        const lessonDate = new Date(b.lesson_date + "T12:00");
                                        return (
                                            <li key={b.id} className="bg-white border border-slate-200 overflow-hidden" style={{ borderRadius: '0.75rem' }}>
                                                <div className="flex flex-col sm:flex-row sm:items-center" style={{ padding: '1.25rem', gap: '1rem' }}>
                                                    <div className="flex items-center min-w-0 flex-1" style={{ gap: '1rem' }}>
                                                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-800 text-white" style={{ width: '3.5rem', borderRadius: '0.625rem', padding: '0.5rem 0' }}>
                                                            <span className="uppercase" style={{ fontSize: '0.5625rem', fontWeight: 600, opacity: 0.9 }}>{lessonDate.toLocaleDateString("bg-BG", { weekday: "short" })}</span>
                                                            <span className="tabular-nums" style={{ fontSize: '1.375rem', fontWeight: 700, lineHeight: 1 }}>{lessonDate.toLocaleDateString("bg-BG", { day: "numeric" })}</span>
                                                            <span style={{ fontSize: '0.5625rem', fontWeight: 500, opacity: 0.8 }}>{lessonDate.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-slate-900 truncate" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                                                                {b.student_name ?? "Ученик"}
                                                            </p>
                                                            <p className="text-slate-500" style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>
                                                                {String(b.lesson_time).slice(0, 5)} ч. · {formatDateLessons(b.lesson_date)}
                                                            </p>
                                                            {b.message && <p className="text-slate-400 truncate" style={{ fontSize: '0.8125rem', marginTop: '0.375rem', maxWidth: '20rem' }} title={b.message}>{b.message}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex sm:flex-shrink-0" style={{ gap: '0.5rem' }}>
                                                        <button
                                                            type="button"
                                                            disabled={actingOnBookingId !== null}
                                                            onClick={() => handleConfirmBooking(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                            className="bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50 transition-colors"
                                                            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
                                                        >
                                                            {actingOnBookingId === b.id ? "Изчакване..." : "Потвърди"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={actingOnBookingId !== null}
                                                            onClick={() => handleCancelByTeacher(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                            className="border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                                                            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
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
                                <h3 className="text-emerald-800 uppercase" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.625rem' }}>Потвърдени часове</h3>
                                <ul className="flex flex-col" style={{ gap: '0.5rem' }}>
                                    {confirmed.map((b) => {
                                        const lessonDate = new Date(b.lesson_date + "T12:00");
                                        return (
                                            <li key={b.id} className="bg-white border border-slate-200 overflow-hidden" style={{ borderRadius: '0.75rem' }}>
                                                <div className="flex flex-col sm:flex-row sm:items-center" style={{ padding: '1.25rem', gap: '1rem' }}>
                                                    <div className="flex items-center min-w-0 flex-1" style={{ gap: '1rem' }}>
                                                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-800 text-white" style={{ width: '3.5rem', borderRadius: '0.625rem', padding: '0.5rem 0' }}>
                                                            <span className="uppercase" style={{ fontSize: '0.5625rem', fontWeight: 600, opacity: 0.9 }}>{lessonDate.toLocaleDateString("bg-BG", { weekday: "short" })}</span>
                                                            <span className="tabular-nums" style={{ fontSize: '1.375rem', fontWeight: 700, lineHeight: 1 }}>{lessonDate.toLocaleDateString("bg-BG", { day: "numeric" })}</span>
                                                            <span style={{ fontSize: '0.5625rem', fontWeight: 500, opacity: 0.8 }}>{lessonDate.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-slate-900 truncate" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                                                                {b.student_name ?? "Ученик"}
                                                            </p>
                                                            <p className="text-slate-500" style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>
                                                                {String(b.lesson_time).slice(0, 5)} ч. · {formatDateLessons(b.lesson_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={actingOnBookingId !== null}
                                                        onClick={() => handleCancelByTeacher(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                        className="border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                                                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
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
            <div className="max-w-4xl mx-auto" style={{ paddingBottom: '3rem' }}>
                <header className="border-b border-slate-100" style={{ marginBottom: '2rem', paddingBottom: '1.25rem' }}>
                    <h2 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Часове</h2>
                    <p className="text-slate-500" style={{ fontSize: '0.9375rem', marginTop: '0.25rem' }}>Вашите записани уроци.</p>
                </header>
                {lessonsLoading ? (
                    <div className="flex flex-col items-center justify-center bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '4rem 2rem', gap: '1rem' }}>
                        <div className="animate-spin" style={{ width: '2rem', height: '2rem', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%' }} />
                        <p className="text-slate-500" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Зареждане...</p>
                    </div>
                ) : studentBookings.length === 0 ? (
                    <div className="bg-white border border-slate-200 text-center" style={{ borderRadius: '1rem', padding: '4rem 2rem' }}>
                        <span className="material-icons text-slate-300" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>event_busy</span>
                        <h3 className="text-slate-800" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.375rem' }}>Нямате записани часове</h3>
                        <p className="text-slate-500" style={{ fontSize: '0.875rem', maxWidth: '20rem', margin: '0 auto', marginBottom: '1.5rem' }}>Намерете учител и запишете час.</p>
                        <button onClick={() => navigate("/find-teacher")} className="bg-purple-700 hover:bg-purple-800 text-white inline-flex items-center transition-colors" style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, gap: '0.375rem' }}>
                            Намери учител <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span>
                        </button>
                    </div>
                ) : (
                    <ul className="flex flex-col" style={{ gap: '0.5rem' }}>
                        {studentBookings.map((b) => {
                            const isPending = b.status === "pending";
                            const canCancel = canCancelBefore24h(b.lesson_date, b.lesson_time);
                            const lessonDate = new Date(b.lesson_date + "T12:00");
                            return (
                                <li key={b.id} className="bg-white border border-slate-200 overflow-hidden" style={{ borderRadius: '0.75rem' }}>
                                    <div className="flex flex-col sm:flex-row sm:items-center" style={{ padding: '1.25rem', gap: '1rem' }}>
                                        <div className="flex items-center min-w-0 flex-1" style={{ gap: '1rem' }}>
                                            <div className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-800 text-white" style={{ width: '3.5rem', borderRadius: '0.625rem', padding: '0.5rem 0' }}>
                                                <span className="uppercase" style={{ fontSize: '0.5625rem', fontWeight: 600, opacity: 0.9 }}>{lessonDate.toLocaleDateString("bg-BG", { weekday: "short" })}</span>
                                                <span className="tabular-nums" style={{ fontSize: '1.375rem', fontWeight: 700, lineHeight: 1 }}>{lessonDate.toLocaleDateString("bg-BG", { day: "numeric" })}</span>
                                                <span style={{ fontSize: '0.5625rem', fontWeight: 500, opacity: 0.8 }}>{lessonDate.toLocaleDateString("bg-BG", { month: "short" })}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-slate-900" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{String(b.lesson_time).slice(0, 5)} ч. · {b.teacher_name}</p>
                                                <p className="text-slate-500" style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>{formatDateLessons(b.lesson_date)}</p>
                                                {!canCancel && (
                                                    <p className="text-amber-700" style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>
                                                        Отказът е заключен (по-малко от 24ч)
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center sm:flex-shrink-0" style={{ gap: '0.5rem' }}>
                                            <span className={`inline-flex items-center ${isPending ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`} style={{ gap: '0.375rem', padding: '0.3125rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                                {isPending ? <><span className="bg-amber-500 animate-pulse" style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', display: 'block' }} />Чака потвърждение</> : <><span className="material-icons text-emerald-600" style={{ fontSize: '0.875rem' }}>check</span>Потвърден</>}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={!canCancel}
                                                onClick={() => handleCancelMyBooking(b.id, b.teacher_id ?? "", b.lesson_date, b.lesson_time)}
                                                title={canCancel ? "Откажи час" : "Отказът е възможен само до 24 часа преди часа"}
                                                className="border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600"
                                                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
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

    // settings view (legacy tab — redirect content matches dedicated /settings page)
    if (activeMenu === "settings") {
        return (
            <div className="max-w-3xl mx-auto" style={{ paddingBottom: "3rem" }}>
                <header style={{ marginBottom: "1.5rem" }}>
                    <h2 className="text-slate-900" style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                        Настройки
                    </h2>
                    <p className="text-slate-500" style={{ fontSize: "0.9375rem", marginTop: "0.25rem" }}>
                        Управлявайте акаунта и сигурността
                    </p>
                </header>
                <div className="bg-white border border-slate-200 text-center" style={{ borderRadius: "1rem", padding: "3rem 2rem" }}>
                    <div
                        className="flex items-center justify-center mx-auto bg-purple-50 border border-purple-100"
                        style={{ width: "4rem", height: "4rem", borderRadius: "0.75rem", marginBottom: "1rem" }}
                    >
                        <span className="material-icons text-purple-700" style={{ fontSize: "2rem" }}>
                            settings
                        </span>
                    </div>
                    <h3 className="text-slate-800" style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                        Настройките са на отделна страница
                    </h3>
                    <p className="text-slate-500" style={{ fontSize: "0.875rem", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                        Сменете парола, излезте или изтрийте акаунта от там.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/settings")}
                        className="bg-purple-700 hover:bg-purple-800 text-white inline-flex items-center transition-colors"
                        style={{ padding: "0.625rem 1.25rem", borderRadius: "0.625rem", fontSize: "0.875rem", fontWeight: 600, gap: "0.375rem" }}
                    >
                        Отвори настройки
                        <span className="material-icons" style={{ fontSize: "1rem" }}>arrow_forward</span>
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
