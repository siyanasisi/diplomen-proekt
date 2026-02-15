import { useNavigate } from "react-router-dom";
import { useHome } from "../hooks/useHome";
import { HomeSidebar, HomeEventModal, HomeContent } from "../components/home";
import type { HomeMenuItem } from "../components/home";
import type { HomeMenuId } from "../types/home";

const MENU_ICONS = {
    dashboard: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    calendar: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    events: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    ),
    lessons: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    messages: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
};

export const Home = () => {
    const home = useHome();
    const navigate = useNavigate();

    const {
        user,
        role,
        activeMenu,
        setActiveMenu,
        eventsList,
        selectedDay,
        setSelectedDay,
        selectedEventId,
        setSelectedEventId,
        eventText,
        setEventText,
        eventsForDate,
        studyPlan,
        handleSaveEvent,
        handleDeleteEvent,
        handleMarkStudyDayCompleted,
        handleMarkStudyDayMissed,
        ...rest
    } = home;

    const menuItems: HomeMenuItem[] = [
        { id: "dashboard", label: "Табло", icon: MENU_ICONS.dashboard },
        { id: "calendar", label: "Календар", icon: MENU_ICONS.calendar },
        { id: "events", label: "Събития", icon: MENU_ICONS.events },
        { id: "lessons", label: "Часове", icon: MENU_ICONS.lessons },
        ...(role === "teacher" ? [{ id: "messages" as const, label: "Съобщения", icon: MENU_ICONS.messages }] : []),
    ];

    if (!user) return null;

    const isTeacher = role === "teacher";
    const bgClass = isTeacher
        ? "h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 flex overflow-hidden relative"
        : "h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-purple-100/20 flex overflow-hidden relative";

    return (
        <div className={bgClass}>
            {/* background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/30 via-purple-100/20 to-transparent rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-200/20 via-purple-100/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-purple-100/10 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            <HomeSidebar
                menuItems={menuItems}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                isTeacher={isTeacher}
                eventsCount={eventsList.length}
                daysUntilExam={rest.daysUntilExam}
                currentStreak={rest.currentStreak}
                longestStreak={rest.longestStreak}
            />

            <main className="flex-1 overflow-hidden relative z-10">
                <div className="max-w-7xl mx-auto px-8 py-10">
                    <HomeContent
                        activeMenu={activeMenu}
                        setActiveMenu={(id: HomeMenuId) => setActiveMenu(id)}
                        role={role}
                        navigate={navigate}
                        teacherPendingCount={rest.teacherPendingCount}
                        pendingBookingsCount={rest.pendingBookingsCount}
                        todayBookingsCount={rest.todayBookingsCount}
                        eventsList={eventsList}
                        getUpcomingEvents={rest.getUpcomingEvents}
                        getAllEvents={rest.getAllEvents}
                        handleDayClick={rest.handleDayClick}
                        goToToday={rest.goToToday}
                        setSelectedDay={setSelectedDay}
                        setSelectedEventId={setSelectedEventId}
                        setEventText={setEventText}
                        plansWithId={rest.plansWithId}
                        selectedPlanId={rest.selectedPlanId}
                        setSelectedPlanId={rest.setSelectedPlanId}
                        effectivePlanId={rest.effectivePlanId}
                        studyPlan={studyPlan}
                        studyPlanHasContent={rest.studyPlanHasContent}
                        getTodayStudyTasks={rest.getTodayStudyTasks}
                        getTodayDateKey={rest.getTodayDateKey}
                        getStudyPlanProgress={rest.getStudyPlanProgress}
                        getUpcomingStudyTopics={rest.getUpcomingStudyTopics}
                        daysUntilExam={rest.daysUntilExam}
                        longestStreak={rest.longestStreak}
                        currentDate={rest.currentDate}
                        daysInMonth={rest.daysInMonth}
                        startingDayOfWeek={rest.startingDayOfWeek}
                        formatDateKey={rest.formatDateKey}
                        hasDotOnDate={rest.hasDotOnDate}
                        studyPlanForCalendar={studyPlan}
                        MONTH_NAMES={rest.MONTH_NAMES}
                        DAY_NAMES={rest.DAY_NAMES}
                        goToPreviousMonth={rest.goToPreviousMonth}
                        goToNextMonth={rest.goToNextMonth}
                        lessonsLoading={rest.lessonsLoading}
                        pendingBookings={rest.pendingBookings}
                        studentBookings={rest.studentBookings}
                        actingOnBookingId={rest.actingOnBookingId}
                        handleConfirmBooking={rest.handleConfirmBooking}
                        handleCancelByTeacher={rest.handleCancelByTeacher}
                        handleCancelMyBooking={rest.handleCancelMyBooking}
                        messages={rest.messages}
                        loadingMessages={rest.loadingMessages}
                        loadMessages={rest.loadMessages}
                        markMessageAsRead={rest.markMessageAsRead}
                    />
                </div>
            </main>

            {selectedDay && (
                <HomeEventModal
                    selectedDay={selectedDay}
                    eventText={eventText}
                    setEventText={setEventText}
                    eventsForDate={eventsForDate}
                    studyPlan={studyPlan}
                    role={role}
                    onClose={() => {
                        setSelectedDay(null);
                        setSelectedEventId(null);
                        setEventText("");
                    }}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                    onMarkCompleted={handleMarkStudyDayCompleted}
                    onMarkMissed={handleMarkStudyDayMissed}
                />
            )}
        </div>
    );
};
