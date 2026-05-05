import { useNavigate } from "react-router-dom";
import { useHome } from "../hooks/useHome";
import { HomeSidebar, HomeEventModal, HomeContent } from "../components/home";
import type { HomeMenuItem } from "../components/home";
import type { HomeMenuId } from "../types/home";

export const Home = () => {
    const home = useHome();
    const navigate = useNavigate();

    const {
        user, role, activeMenu, setActiveMenu,
        eventsList, selectedDay, setSelectedDay,
        selectedEventId, setSelectedEventId,
        eventText, setEventText, eventsForDate,
        studyPlan, handleSaveEvent, handleDeleteEvent,
        handleMarkStudyDayCompleted, handleMarkStudyDayMissed,
        ...rest
    } = home;

    const menuItems: HomeMenuItem[] = [
        { id: "dashboard", label: "Табло", icon: <span className="material-icons" style={{ fontSize: '1.25rem' }}>dashboard</span> },
        { id: "calendar", label: "Календар", icon: <span className="material-icons" style={{ fontSize: '1.25rem' }}>calendar_today</span> },
        { id: "events", label: "Събития", icon: <span className="material-icons" style={{ fontSize: '1.25rem' }}>event_note</span> },
        { id: "lessons", label: "Часове", icon: <span className="material-icons" style={{ fontSize: '1.25rem' }}>schedule</span> },
        ...(role === "teacher" ? [{ id: "messages" as const, label: "Съобщения", icon: <span className="material-icons" style={{ fontSize: '1.25rem' }}>mail</span> }] : []),
    ];

    if (!user) return null;

    const isTeacher = role === "teacher";

    return (
        <div className="flex min-h-full bg-slate-50 overflow-hidden relative">
            {/* subtle bg accent */}
            <div
                className="pointer-events-none fixed top-0 right-0 -z-10 opacity-30"
                style={{ width: '30%', height: '100vh', background: 'linear-gradient(to left, rgba(126,34,206,0.04), transparent)' }}
            />

            {/* sidebar */}
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

            {/* main */}
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ padding: isTeacher ? '2.5rem 2rem 2.5rem 3rem' : '0' }}>
                <div style={!isTeacher ? { paddingTop: '2rem', paddingLeft: '3rem', paddingRight: '2rem', paddingBottom: '6rem' } : {}}>
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
                        openDateModal={rest.openDateModal}
                        openTodayModal={rest.openTodayModal}
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

            {/* mobile bottom nav (student only) */}
            {!isTeacher && (
                <div
                    className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/90 backdrop-blur-xl border-t border-slate-200 flex items-center justify-around z-50"
                    style={{ padding: '0.625rem 0.5rem', paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
                >
                    {[
                        { id: 'dashboard' as const, icon: 'dashboard', label: 'Табло', action: () => setActiveMenu('dashboard') },
                        { id: 'find' as const, icon: 'person_search', label: 'Учители', action: () => navigate('/find-teacher') },
                        { id: 'plan' as const, icon: 'add_circle', label: 'План', action: () => navigate('/study-plan/intro'), accent: true },
                        { id: 'study' as const, icon: 'school', label: 'Учене', action: () => navigate('/study') },
                        { id: 'profile' as const, icon: 'person', label: 'Профил', action: () => navigate('/profile') },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={item.action}
                            className={`flex flex-col items-center transition-colors ${
                                item.accent ? 'text-purple-700' : activeMenu === item.id ? 'text-purple-700' : 'text-slate-400'
                            }`}
                            style={{ gap: '0.125rem', padding: '0.25rem 0.75rem' }}
                        >
                            <span className="material-icons" style={{ fontSize: item.accent ? '1.75rem' : '1.375rem' }}>{item.icon}</span>
                            <span style={{ fontSize: '0.625rem', fontWeight: 700 }}>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* event modal */}
            {selectedDay && (
                <HomeEventModal
                    selectedDay={selectedDay}
                    selectedEventId={selectedEventId}
                    eventText={eventText}
                    setEventText={setEventText}
                    onSelectEvent={(id, text) => { setSelectedEventId(id); setEventText(text); }}
                    eventsForDate={eventsForDate}
                    studyPlan={studyPlan}
                    role={role}
                    onClose={() => { setSelectedDay(null); setSelectedEventId(null); setEventText(""); }}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                    onMarkCompleted={handleMarkStudyDayCompleted}
                    onMarkMissed={handleMarkStudyDayMissed}
                />
            )}
        </div>
    );
};
