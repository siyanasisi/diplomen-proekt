import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { supabase, ensureValidSession } from "../supabase-client";
import { useNavigate } from "react-router-dom";

export const Home = () => {

    type CalendarEventRow = { id: string; date: string; event_text: string };
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [eventsList, setEventsList] = useState<CalendarEventRow[]>([]);
    const [bookedLessonDates, setBookedLessonDates] = useState<string[]>([]);
    const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [eventText, setEventText] = useState("");
    const [longestStreak, setLongestStreak] = useState(0);
    const [activeMenu, setActiveMenu] = useState<'dashboard' | 'study-plan' | 'calendar' | 'events' | 'settings' | 'messages'>('dashboard');
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    // Load events and booked lesson dates from Supabase when user changes
    useEffect(() => {
        if (user) {
            loadEvents();
            loadBookedLessonDates();
            loadUserStats();
            if (role === 'teacher') {
                loadMessages();
            }
        }
    }, [user, role]);

    const loadEvents = async () => {
        if (!user) return;
        
        try {
            // ensure we have a valid access token before making request
            await ensureValidSession();
            
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true })
                .order('created_at', { ascending: true });

            if (error) {
                // if auth error persists-  sign out
                if (error.code === 'PGRST303' || error.message?.includes('JWT')) {
                    console.error('Authentication error, signing out...');
                    await supabase.auth.signOut();
                    navigate('/login');
                    return;
                }
                console.error('Error loading events:', error);
            } else if (data) {
                setEventsList((data as CalendarEventRow[]).map(e => ({ id: e.id, date: e.date, event_text: e.event_text })));
            }
        } catch (error) {
            console.error('Failed to ensure valid session:', error);
            await supabase.auth.signOut();
            navigate('/login');
        }
    };

    const loadBookedLessonDates = async () => {
        if (!user) return;
        try {
            await ensureValidSession();
            const { data: asStudent } = await supabase
                .from('bookings')
                .select('lesson_date')
                .eq('student_id', user.id);
            const { data: asTeacher } = await supabase
                .from('bookings')
                .select('lesson_date')
                .eq('teacher_id', user.id);
            const allDates = [...(asStudent ?? []), ...(asTeacher ?? [])]
                .map((r: { lesson_date: string }) => r.lesson_date)
                .filter(Boolean);
            const toDateKey = (iso: string) => {
                const [y, m, d] = iso.split('T')[0].split('-').map(Number);
                return `${y}-${m}-${d}`;
            };
            const keys = [...new Set(allDates.map(toDateKey))];
            setBookedLessonDates(keys);

            if (role === 'student') {
                const todayKey = new Date().toISOString().slice(0, 10);
                const { count } = await supabase
                    .from('bookings')
                    .select('id', { count: 'exact', head: true })
                    .eq('student_id', user.id)
                    .eq('status', 'pending')
                    .gte('lesson_date', todayKey);
                setPendingBookingsCount(count ?? 0);
            } else {
                setPendingBookingsCount(0);
            }
        } catch (e) {
            console.error('Failed to load booked lesson dates:', e);
        }
    };

    const loadUserStats = async () => {
        if (!user) return;

        try {
            // ensure we have a valid access token before making request
            await ensureValidSession();

            const { data, error } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                // if auth error persists-  sign out
                if (error.code === 'PGRST303' || error.message?.includes('JWT')) {
                    console.error('Authentication error, signing out...');
                    await supabase.auth.signOut();
                    navigate('/login');
                    return;
                }
                console.error('Error loading stats:', error);
            } else if (data) {
                setLongestStreak(data.longest_streak || 0);
            } else {
                setLongestStreak(0);
            }
        } catch (error) {
            console.error('Failed to ensure valid session:', error);
            await supabase.auth.signOut();
            navigate('/login');
        }
    };

    const loadMessages = async () => {
        if (!user || role !== 'teacher') return;

        setLoadingMessages(true);
        try {
            await ensureValidSession();

            // load messages where teacher is the recipient
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('teacher_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading messages:', error);
            } else if (data) {
                // get student information for each message
                const messagesWithStudents = await Promise.all(
                    data.map(async (message) => {
                        // get student profile info
                        const { data: studentData } = await supabase
                            .from('profiles')
                            .select('first_name, last_name, email')
                            .eq('id', message.student_id)
                            .single();

                        return {
                            ...message,
                            student_name: studentData 
                                ? `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() || studentData.email?.split('@')[0] || 'Ученик'
                                : 'Ученик',
                            student_email: studentData?.email || null
                        };
                    })
                );

                setMessages(messagesWithStudents);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const dziBelExamDate = new Date(2026, 4, 20);
    const today = new Date();
    const daysUntilExam = Math.ceil((dziBelExamDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        return { daysInMonth, startingDayOfWeek };
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const formatDateKey = (day: number) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return `${year}-${month + 1}-${day}`;
    };

    const eventsForDate = (dateKey: string) => eventsList.filter(e => e.date === dateKey);
    const hasEventOnDate = (dateKey: string) => eventsForDate(dateKey).length > 0;
    const hasBookedLessonOnDate = (dateKey: string) => bookedLessonDates.includes(dateKey);
    const hasDotOnDate = (dateKey: string) => hasBookedLessonOnDate(dateKey) || hasEventOnDate(dateKey);

    const handleDayClick = (day: number) => {
        const dateKey = formatDateKey(day);
        setSelectedDay(dateKey);
        const dayEvents = eventsForDate(dateKey);
        const first = dayEvents[0];
        setSelectedEventId(first?.id ?? null);
        setEventText(first?.event_text ?? "");
    };

    const handleSaveEvent = async () => {
        if (!selectedDay || !user) return;

        try {
            // ensure we have a valid access token before making request
            await ensureValidSession();

            if (eventText.trim()) {
                let error;
                if (selectedEventId) {
                    const result = await supabase
                        .from('calendar_events')
                        .update({ event_text: eventText })
                        .eq('id', selectedEventId)
                        .eq('user_id', user.id);
                    error = result.error;
                } else {
                    const result = await supabase
                        .from('calendar_events')
                        .insert({
                            user_id: user.id,
                            date: selectedDay!,
                            event_text: eventText
                        });
                    error = result.error;
                }

                if (error) {
                    console.error('Error saving event:', error);
                    alert('Failed to save event. Check console for details.');
                } else {
                    loadEvents();
                }
            } else {
                await handleDeleteEvent();
            }
            setSelectedDay(null);
            setSelectedEventId(null);
            setEventText("");
        } catch (error) {
            console.error('Failed to ensure valid session:', error);
            await supabase.auth.signOut();
            navigate('/login');
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedDay || !user) return;

        try {
            await ensureValidSession();

            if (selectedEventId) {
                const { error } = await supabase
                    .from('calendar_events')
                    .delete()
                    .eq('id', selectedEventId)
                    .eq('user_id', user.id);
                if (error) console.error('Error deleting event:', error);
                else loadEvents();
            } else {
                const { error } = await supabase
                    .from('calendar_events')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('date', selectedDay);
                if (error) console.error('Error deleting event:', error);
                else loadEvents();
            }
            setSelectedDay(null);
            setSelectedEventId(null);
            setEventText("");
        } catch (error) {
            console.error('Failed to ensure valid session:', error);
            await supabase.auth.signOut();
            navigate('/login');
        }
    };



    const getUpcomingEvents = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventsList
            .map(e => {
                const [y, m, d] = e.date.split('-').map(Number);
                return { id: e.id, date: new Date(y, m - 1, d), dateStr: e.date, event: e.event_text };
            })
            .filter(item => item.date >= today)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 8);
    };

    const getAllEvents = () => {
        return eventsList
            .map(e => {
                const [y, m, d] = e.date.split('-').map(Number);
                return { id: e.id, date: new Date(y, m - 1, d), dateStr: e.date, event: e.event_text };
            })
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 15);
    };


    const monthNames = ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];
    const dayNames = ["Нед", "Пон", "Вто", "Сря", "Чет", "Пет", "Съб"];


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

                        {/* calendar view */}
                        {activeMenu === 'calendar' && (
                            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
                                <div className="max-w-7xl w-full">


                                    {/* two column layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* calendar */}
                                        <div className="lg:col-span-2 bg-gradient-to-br from-white via-purple-50/20 to-white rounded-3xl p-10 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>

                                    {/* month navigation */}
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

                                    {/* day names */}
                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                        {dayNames.map(day => (
                                            <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2 uppercase tracking-wide">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* calendar grid */}
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
                                                            ? 'bg-purple-900 text-white shadow-sm'
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {day}
                                                    {hasDot && (
                                                        <div className="absolute bottom-1.5">
                                                            <span className={`w-2 h-2 rounded-full block ${isToday ? 'bg-white/90' : 'bg-purple-600'}`} aria-hidden />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* legend and add button */}
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

                                        {/* upcoming events column */}
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
                                                                            {date.toLocaleDateString('bg-BG', { month: 'short' })}
                                                                        </span>
                                                                        <span className="text-sm font-bold leading-none mt-0.5">{date.getDate()}</span>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-bold text-purple-700 mb-1 uppercase">
                                                                            {date.toLocaleDateString('bg-BG', { weekday: 'short' })}
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
                        )}

                        {/* events view */}
                        {activeMenu === 'events' && (
                            <div className="space-y-8">
                                <div className="mb-10">
                                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Събития</h2>
                                    <p className="text-base font-semibold text-slate-600">Прегледайте всички ваши събития</p>
                                </div>
                                <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                                    <div className="flex items-center justify-between mb-6 relative">
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Всички събития</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {getAllEvents().length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-normal text-slate-500">Няма събития. Добавете ново събитие от календара.</p>
                                            </div>
                                        ) : (
                                            getAllEvents().map(({ id, date, dateStr, event }) => (
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

                        {/* messages view - only for teachers */}
                        {activeMenu === 'messages' && role === 'teacher' && (
                            <div className="space-y-8">
                                <div className="mb-10">
                                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Съобщения</h2>
                                    <p className="text-base font-semibold text-slate-600">Прегледайте съобщенията от ученици</p>
                                </div>
                                <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                                    <div className="flex items-center justify-between mb-6 relative">
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                            Всички съобщения ({messages.length})
                                        </h3>
                                        <button
                                            onClick={loadMessages}
                                            disabled={loadingMessages}
                                            className="px-4 py-2 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <svg 
                                                className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Обнови
                                        </button>
                                    </div>
                                    <div className="space-y-3 relative">
                                        {loadingMessages ? (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 border-4 border-purple-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-sm font-semibold text-slate-700">Зареждане на съобщения...</p>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-200/40">
                                                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-normal text-slate-500">Няма получени съобщения</p>
                                            </div>
                                        ) : (
                                            messages.map((message) => {
                                                const messageDate = new Date(message.created_at);
                                                const isRead = message.read_at !== null;
                                                
                                                const markAsRead = async () => {
                                                    if (isRead || !user) return;
                                                    
                                                    try {
                                                        await ensureValidSession();
                                                        const { error } = await supabase
                                                            .from('messages')
                                                            .update({ read_at: new Date().toISOString() })
                                                            .eq('id', message.id);
                                                        
                                                        if (!error) {
                                                            // Update local state
                                                            setMessages(prev => 
                                                                prev.map(msg => 
                                                                    msg.id === message.id 
                                                                        ? { ...msg, read_at: new Date().toISOString() }
                                                                        : msg
                                                                )
                                                            );
                                                        }
                                                    } catch (error) {
                                                        console.error('Error marking message as read:', error);
                                                    }
                                                };
                                                
                                                return (
                                                    <div
                                                        key={message.id}
                                                        onClick={markAsRead}
                                                        className={`group bg-gradient-to-br ${isRead ? 'from-slate-50/60 to-white' : 'from-purple-50/80 to-white'} hover:from-purple-100/70 hover:to-white border-2 ${isRead ? 'border-slate-200/60' : 'border-purple-300/60'} rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-purple-400/70 relative overflow-hidden cursor-pointer`}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-200/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                        <div className="flex items-start gap-4 relative z-10">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center text-white text-lg font-bold shadow-md">
                                                                    {message.student_name.charAt(0).toUpperCase()}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div>
                                                                        <p className="text-base font-bold text-slate-900">
                                                                            {message.student_name}
                                                                        </p>
                                                                        {message.student_email && (
                                                                            <p className="text-xs font-medium text-slate-500">
                                                                                {message.student_email}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {!isRead && (
                                                                            <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
                                                                        )}
                                                                        <span className="text-xs font-medium text-slate-500">
                                                                            {messageDate.toLocaleDateString('bg-BG', { 
                                                                                day: 'numeric', 
                                                                                month: 'short', 
                                                                                year: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                    {message.message}
                                                                </p>
                                                                {!isRead && (
                                                                    <p className="text-xs font-semibold text-purple-600 mt-2">
                                                                        Кликнете, за да маркирате като прочетено
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* settings view */}
                        {activeMenu === 'settings' && (
                            <div className="space-y-8">
                                <div className="mb-10">
                                    <h2 className="text-5xl font-bold text-slate-800 tracking-tight mb-3 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Настройки</h2>
                                    <p className="text-lg text-slate-600 font-bold">Персонализирайте вашите настройки</p>
                                </div>
                                <div className="bg-white rounded-3xl p-12 shadow-lg shadow-slate-900/5 border border-purple-900/20 text-center">
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
                        )}
                    </div>
                </main>

                {/* event modal */}
                {selectedDay && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-300 border border-purple-900/20">
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                                        {selectedEventId || eventsForDate(selectedDay).length > 0 ? 'Редактирай събитие' : 'Ново събитие'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setSelectedDay(null);
                                            setSelectedEventId(null);
                                            setEventText("");
                                        }}
                                        className="p-2 hover:bg-slate-50 rounded-xl transition-all duration-300 hover:scale-110"
                                    >
                                        <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm text-slate-500 bg-gradient-to-r from-slate-50 to-purple-900/10 px-4 py-2.5 rounded-xl border border-purple-900/20">
                                    <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-semibold text-slate-700">{selectedDay}</span>
                                </div>
                            </div>
                            <textarea
                                value={eventText}
                                onChange={(e) => setEventText(e.target.value)}
                                placeholder="Напр: Урок, Консултация, Среща, Подготовка..."
                                className="w-full border-2 border-slate-200 focus:border-purple-900 rounded-2xl px-5 py-4 mb-6 h-36 text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all resize-none font-medium text-slate-700 placeholder-slate-400"
                                autoFocus
                            />
                            <div className="flex items-center justify-between gap-3">
                                {(selectedEventId || eventsForDate(selectedDay).length > 0) && (
                                    <button
                                        onClick={handleDeleteEvent}
                                        className="px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Изтрий
                                    </button>
                                )}
                                <div className="flex gap-3 ml-auto">
                                    <button
                                        onClick={() => {
                                            setSelectedDay(null);
                                            setSelectedEventId(null);
                                            setEventText("");
                                        }}
                                        className="px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
                                    >
                                        Откажи
                                    </button>
                                    <button
                                        onClick={handleSaveEvent}
                                        className="px-6 py-3 text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Запази
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                                <span className="text-xs font-bold text-purple-700">Серия</span>
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
                                            onClick={() => navigate('/profile#my-bookings')}
                                            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg transition-colors"
                                        >
                                            Виж в Профил
                                        </button>
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

                    {/* calendar view */}
                    {activeMenu === 'calendar' && (
                        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
                            <div className="max-w-7xl w-full">
                                {/* two column layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* calendar */}
                                    <div className="lg:col-span-2 bg-gradient-to-br from-white via-purple-50/20 to-white rounded-3xl p-10 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                                    {/* month nav */}
                                    <div className="flex items-center justify-center gap-8 mb-10 relative">
                                        <button 
                                            onClick={goToPreviousMonth}
                                            className="p-2.5 hover:bg-purple-50 rounded-xl transition-all duration-200"
                                        >
                                            <svg className="w-5 h-5 text-slate-600 hover:text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
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

                                    {/* day names */}
                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                        {dayNames.map(day => (
                                            <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2 uppercase tracking-wide">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* calendar grid */}
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
                                                            ? 'bg-purple-900 text-white shadow-sm'
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {day}
                                                    {hasDot && (
                                                        <div className="absolute bottom-1.5">
                                                            <span className={`w-2 h-2 rounded-full block ${isToday ? 'bg-white/90' : 'bg-purple-600'}`} aria-hidden />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* legend and add button */}
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

                                        {/* upcoming events column */}
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
                                                                            {date.toLocaleDateString('bg-BG', { month: 'short' })}
                                                                        </span>
                                                                        <span className="text-sm font-bold leading-none mt-0.5">{date.getDate()}</span>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-bold text-purple-700 mb-1 uppercase">
                                                                            {date.toLocaleDateString('bg-BG', { weekday: 'short' })}
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
                        )}




                    {/* events view */}
                    {activeMenu === 'events' && (
                        <div className="space-y-8">
                            <div className="mb-10">
                                <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Събития</h2>
                                <p className="text-base font-bold text-purple-700">Прегледайте всички ваши събития</p>
                            </div>
                            <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                                <div className="flex items-center justify-between mb-6 relative">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Всички събития</h3>
                                </div>
                                <div className="space-y-3">
                                    {getAllEvents().length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-normal text-slate-500">Няма събития. Добавете ново събитие от календара.</p>
                                        </div>
                                    ) : (
                                        getAllEvents().map(({ id, date, dateStr, event }) => (
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

                    {/* settings view */}
                    {activeMenu === 'settings' && (
                        <div className="space-y-8">
                            <div className="mb-10">
                                <h2 className="text-5xl font-bold text-slate-800 tracking-tight mb-3 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Настройки</h2>
                                <p className="text-lg text-slate-600 font-bold">Персонализирайте вашите настройки</p>
                            </div>
                            <div className="bg-white rounded-3xl p-12 shadow-lg shadow-slate-900/5 border border-purple-900/20 text-center">
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
                    )}
                </div>
            </main>

            {/* event modal */}
            {selectedDay && (

                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-300 border border-purple-900/20">
                        <div className="mb-6">

                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                                    {selectedEventId || eventsForDate(selectedDay).length > 0 ? 'Редактирай събитие' : 'Ново събитие'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setSelectedDay(null);
                                        setSelectedEventId(null);
                                        setEventText("");
                                    }}

                                    className="p-2 hover:bg-slate-50 rounded-xl transition-all duration-300 hover:scale-110"
                                >

                                    <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center gap-2.5 text-sm text-slate-500 bg-gradient-to-r from-slate-50 to-purple-900/10 px-4 py-2.5 rounded-xl border border-purple-900/20">
                                <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>

                                <span className="font-semibold text-slate-700">{selectedDay}</span>
                            </div>
                        </div>
                        <textarea
                            value={eventText}
                            onChange={(e) => setEventText(e.target.value)}
                            placeholder="Напр: Учене за матура, Преговор на материал, Решаване на тест..."

                            className="w-full border-2 border-slate-200 focus:border-purple-900 rounded-2xl px-5 py-4 mb-6 h-36 text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all resize-none font-medium text-slate-700 placeholder-slate-400"
                            autoFocus
                        />
                        <div className="flex items-center justify-between gap-3">
                            {(selectedEventId || eventsForDate(selectedDay).length > 0) && (
                                <button
                                    onClick={handleDeleteEvent}

                                    className="px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Изтрий
                                </button>
                            )}

                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={() => {
                                        setSelectedDay(null);
                                        setSelectedEventId(null);
                                        setEventText("");
                                    }}

                                    className="px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
                                >
                                    Откажи
                                </button>
                                <button
                                    onClick={handleSaveEvent}

                                    className="px-6 py-3 text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Запази
                                </button>
                            </div>
                        </div>
                    </div>
                    </div>
                )}
        </div>
    );

};