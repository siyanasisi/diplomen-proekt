import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { supabase, ensureValidSession } from "../supabase-client";
import { useNavigate } from "react-router-dom";
import type { StudyPlan as StudyPlanType } from "../lib/topics";
import type { KnowledgeLevel } from "../lib/topics";
import { normalizeExamSubject, hasPlanContent } from "../lib/topics";
import { rescheduleMissedDay } from "../lib/studyPlanGenerator";

export const Home = () => {

    const { user, role } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<{ [key: string]: string }>({});
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [eventText, setEventText] = useState("");
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [activeMenu, setActiveMenu] = useState<'dashboard' | 'study-plan' | 'calendar' | 'events' | 'settings'>('dashboard');
    const [studyPlans, setStudyPlans] = useState<StudyPlanType[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const plansWithId = studyPlans.filter((p): p is StudyPlanType & { id: string } => p.id != null && p.id !== '');
    const studyPlan = plansWithId.find(p => p.id === selectedPlanId) ?? plansWithId[0] ?? null;
    const effectivePlanId = studyPlan?.id ?? (plansWithId[0]?.id ?? '');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    // Load events from Supabase when user changes
    useEffect(() => {
        if (user) {
            loadEvents();
            loadUserStats();
            if (role === 'student') {
                loadStudyPlans();
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
                .eq('user_id', user.id);

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
                const eventsMap: { [key: string]: string } = {};
                data.forEach(event => {
                    eventsMap[event.date] = event.event_text;
                });
                setEvents(eventsMap);
            }
        } catch (error) {
            console.error('Failed to ensure valid session:', error);
            await supabase.auth.signOut();
            navigate('/login');
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
                setCurrentStreak(data.current_streak || 0);
                setLongestStreak(data.longest_streak || 0);
            } else {
                setCurrentStreak(0);
                setLongestStreak(0);
            }
        } catch (error) {
            console.error('Failed to ensure valid session:', error);
            await supabase.auth.signOut();
            navigate('/login');
        }
    };

    const loadStudyPlans = async () => {
        if (!user) return;

        try {
            await ensureValidSession();

            const { data, error } = await supabase
                .from('study_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading study plans:', error);
                return;
            }

            if (data && data.length > 0) {
                const transformed: StudyPlanType[] = data.map((row: { id: string; user_id: string; preferences: { exam_subject?: string; exam_date: string; study_days_per_week: number; topics_per_day: number; bel_level: string; literature_level: string }; plan: StudyPlanType['plan']; created_at?: string; updated_at?: string }) => ({
                    id: row.id,
                    user_id: row.user_id,
                    preferences: {
                        examSubject: normalizeExamSubject(row.preferences.exam_subject),
                        examDate: new Date(row.preferences.exam_date),
                        studyDaysPerWeek: row.preferences.study_days_per_week,
                        topicsPerDay: row.preferences.topics_per_day,
                        belLevel: row.preferences.bel_level as KnowledgeLevel,
                        literatureLevel: row.preferences.literature_level as KnowledgeLevel,
                    },
                    plan: row.plan,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                }));
                setStudyPlans(transformed);
                const savedId = typeof window !== 'undefined' ? sessionStorage.getItem('homeSelectedPlanId') : null;
                const firstId = transformed[0].id!;
                const idToSelect: string = savedId && transformed.some(p => p.id === savedId) ? savedId : firstId;
                setSelectedPlanId(idToSelect);
                if (typeof window !== 'undefined') sessionStorage.setItem('homeSelectedPlanId', idToSelect);
            } else {
                setStudyPlans([]);
                setSelectedPlanId(null);
            }
        } catch (error) {
            console.error('Failed to load study plans:', error);
        }
    };

    const today = new Date();

    const getTodayDateKey = () => {
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTodayStudyTasks = () => {
        if (!studyPlan) return null;
        const todayKey = getTodayDateKey();
        return studyPlan.plan.find(day => day.date === todayKey);
    };

    const getUpcomingStudyTopics = () => {
        if (!studyPlan) return [];
        const todayKey = getTodayDateKey();
        const todayDate = new Date(todayKey);
        const upcoming: Array<{ date: string; studyDay: StudyPlanType['plan'][0] }> = [];
        
        for (let i = 1; i <= 5; i++) {
            const nextDate = new Date(todayDate);
            nextDate.setDate(todayDate.getDate() + i);
            const year = nextDate.getFullYear();
            const month = String(nextDate.getMonth() + 1).padStart(2, '0');
            const day = String(nextDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            
            const studyDay = studyPlan.plan.find(d => d.date === dateKey);
            if (studyDay && studyDay.topics.length > 0 && !studyDay.completed && !studyDay.missed) {
                upcoming.push({ date: dateKey, studyDay });
                if (upcoming.length >= 5) break;
            }
        }
        return upcoming;
    };

    const getStudyPlanProgress = () => {
        if (!studyPlan) return null;
        const totalDays = studyPlan.plan.length;
        const completedDays = studyPlan.plan.filter(d => d.completed).length;
        const missedDays = studyPlan.plan.filter(d => d.missed).length;
        const totalTopics = studyPlan.plan.reduce((sum, day) => sum + day.topics.length, 0);
        const completedTopics = studyPlan.plan
            .filter(d => d.completed)
            .reduce((sum, day) => sum + day.topics.length, 0);
        
        return {
            totalDays,
            completedDays,
            missedDays,
            totalTopics,
            completedTopics,
            completionPercentage: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
            topicsCompletionPercentage: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
        };
    };

    const studyPlanHasContent = studyPlan && hasPlanContent(studyPlan.preferences.examSubject) && studyPlan.plan.length > 0;

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
        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${year}-${monthStr}-${dayStr}`;
    };

    const handleDayClick = (day: number) => {
        const dateKey = formatDateKey(day);
        setSelectedDay(dateKey);
        setEventText(events[dateKey] || "");
    };

    const handleSaveEvent = async () => {
        if (!selectedDay || !user) return;

        try {
            // ensure we have a valid access token before making request
            await ensureValidSession();

            if (eventText.trim()) {
                // check if event already exists
                const { data: existingEvent } = await supabase
                    .from('calendar_events')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('date', selectedDay)
                    .single();

                let error;
                if (existingEvent) {
                    // update existing event
                    const result = await supabase
                        .from('calendar_events')
                        .update({ event_text: eventText })
                        .eq('user_id', user.id)
                        .eq('date', selectedDay);
                    error = result.error;
                } else {
                    // insert new event
                    const result = await supabase
                        .from('calendar_events')
                        .insert({ 
                            user_id: user.id, 
                            date: selectedDay, 
                            event_text: eventText 
                        });
                    error = result.error;
                }

                if (error) {
                    console.error('Error saving event:', error);
                    alert('Failed to save event. Check console for details.');
                } else {
                    setEvents({ ...events, [selectedDay]: eventText });
                }
            } else {
                // delete event if text is empty
                await handleDeleteEvent();
            }
            setSelectedDay(null);
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
            // ensure we have a valid access token before making request
            await ensureValidSession();

            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('user_id', user.id)
                .eq('date', selectedDay);

            if (error) {
                console.error('Error deleting event:', error);
            } else {
                const newEvents = { ...events };
                delete newEvents[selectedDay];
                setEvents(newEvents);
                setSelectedDay(null);
                setEventText("");
            }
        } catch (error) {
            console.error('Failed to ensure valid session:', error);
            await supabase.auth.signOut();
            navigate('/login');
        }
    };

    const handleMarkStudyDayCompleted = async (date: string) => {
        if (!user || !studyPlan) return;

        try {
            await ensureValidSession();

            const updatedPlan = {
                ...studyPlan,
                plan: studyPlan.plan.map(d =>
                    d.date === date ? { ...d, completed: !d.completed, missed: false } : d
                ),
            };

            const { error } = await supabase
                .from('study_plans')
                .update({
                    plan: updatedPlan.plan,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .eq('id', studyPlan.id);

            if (error) {
                console.error('Error updating study plan:', error);
                alert('Възникна грешка при актуализирането на плана.');
            } else {
                setStudyPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
            }
        } catch (error) {
            console.error('Failed to mark day as completed:', error);
            alert('Възникна грешка. Моля, опитайте отново.');
        }
    };

    const handleMarkStudyDayMissed = async (date: string) => {
        if (!user || !studyPlan) return;

        // find the day to check its current state
        const dayToMark = studyPlan.plan.find(d => d.date === date);
        if (!dayToMark) return;

        // don't allow marking completed days as missed
        if (dayToMark.completed) {
            alert('Не можете да маркирате завършен ден като пропускан.');
            return;
        }

        // don't allow marking already missed days 
        if (dayToMark.missed) {
            alert('Този ден вече е маркиран като пропускан.');
            return;
        }

        if (!confirm('Сигурни ли сте, че искате да маркирате този ден като пропускан? Темите ще бъдат пренасрочени автоматично.')) {
            return;
        }

        try {
            await ensureValidSession();

            const updatedPlan = rescheduleMissedDay(studyPlan, date);

            // verify that the rescheduling worked
            const missedDay = updatedPlan.plan.find(d => d.date === date);
            if (!missedDay || !missedDay.missed) {
                alert('Възникна грешка при маркирането на деня като пропускан.');
                return;
            }

            const { error } = await supabase
                .from('study_plans')
                .update({
                    plan: updatedPlan.plan,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .eq('id', studyPlan.id);

            if (error) {
                console.error('Error updating study plan:', error);
                alert('Възникна грешка при актуализирането на плана.');
            } else {
                setStudyPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
            }
        } catch (error) {
            console.error('Failed to mark day as missed:', error);
            alert('Възникна грешка. Моля, опитайте отново.');
        }
    };



    const getUpcomingEvents = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const regularEvents = Object.entries(events)
            .map(([date, event]) => {
                const [year, month, day] = date.split('-').map(Number);
                const eventDate = new Date(year, month - 1, day);
                eventDate.setHours(0, 0, 0, 0);
                return { date: eventDate, dateStr: date, event, type: 'event' as const };
            })
            .filter(item => item.date >= today);

        // get study plan topics as events
        const studyPlanEvents: Array<{ date: Date; dateStr: string; event: string; type: 'study' }> = [];
        if (studyPlan) {
            studyPlan.plan.forEach(studyDay => {
                if (studyDay.topics.length > 0 && !studyDay.completed && !studyDay.missed) {
                    const [year, month, day] = studyDay.date.split('-').map(Number);
                    const studyDate = new Date(year, month - 1, day);
                    studyDate.setHours(0, 0, 0, 0);
                    
                    if (studyDate >= today) {
                        const topicsText = studyDay.topics.map(t => `${t.subject}: ${t.name}`).join(', ');
                        studyPlanEvents.push({
                            date: studyDate,
                            dateStr: studyDay.date,
                            event: `📚 ${topicsText}`,
                            type: 'study'
                        });
                    }
                }
            });
        }

        // combine and sort all events
        const allEvents = [...regularEvents, ...studyPlanEvents]
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 10);

        return allEvents;
    };

    const getAllEvents = () => {
        const regularEvents = Object.entries(events)
            .map(([date, event]) => {
                const [year, month, day] = date.split('-').map(Number);
                return { date: new Date(year, month - 1, day), dateStr: date, event, type: 'event' as const };
            });

        const studyPlanEvents: Array<{ date: Date; dateStr: string; event: string; type: 'study' }> = [];
        if (studyPlan) {
            studyPlan.plan.forEach(studyDay => {
                if (studyDay.topics.length > 0) {
                    const [year, month, day] = studyDay.date.split('-').map(Number);
                    const studyDate = new Date(year, month - 1, day);
                    const topicsText = studyDay.topics.map(t => `${t.subject}: ${t.name}`).join(', ');
                    const statusIcon = studyDay.completed ? '✓' : studyDay.missed ? '✗' : '📚';
                    studyPlanEvents.push({
                        date: studyDate,
                        dateStr: studyDay.date,
                        event: `${statusIcon} ${topicsText}`,
                        type: 'study'
                    });
                }
            });
        }

        const allEvents = [...regularEvents, ...studyPlanEvents]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 10);

        return allEvents;
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
    ];



    // teacher dashboard 
    if (role === 'teacher') {
    return (

            <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 flex overflow-hidden overflow-x-hidden relative">
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
                            <div className="space-y-2.5 relative">
                                <div className="flex items-center justify-between py-2.5 px-3.5 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                                    <span className="text-xs font-bold text-purple-700">Общо събития</span>
                                    <span className="text-base font-black text-purple-900 tabular-nums">{Object.keys(events).length}</span>
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
                                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-7 shadow-xl shadow-slate-900/10 border border-slate-200/80 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
                                        <div className="relative flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wider">Общо събития</p>
                                                <p className="text-4xl font-black text-slate-900 tracking-tight tabular-nums">{Object.keys(events).length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upcoming events card */}
                                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-7 shadow-xl shadow-slate-900/10 border border-slate-200/80 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
                                        <div className="relative flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wider">Предстоящи</p>
                                                <p className="text-4xl font-black text-slate-900 tracking-tight tabular-nums">{getUpcomingEvents().length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-7 shadow-xl shadow-slate-900/10 border border-slate-200/80 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
                                    <h3 className="text-xl font-black text-slate-900 mb-5 tracking-tight relative">Бързи действия</h3>
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
                                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-7 shadow-xl shadow-slate-900/10 border border-slate-200/80 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
                                    <div className="flex items-center justify-between mb-6 relative">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Последни събития</h3>
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
                                            getAllEvents().slice(0, 5).map(({ date, dateStr, event, type }) => {
                                                const isStudyPlan = type === 'study';
                                                return (
                                                <div 
                                                    key={dateStr} 
                                                    className={`group ${isStudyPlan ? 'bg-blue-50 hover:bg-blue-100 border-blue-200/60 hover:border-blue-300/60' : 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 hover:border-slate-300/60'} border rounded-xl p-4.5 transition-all duration-300 cursor-pointer hover:shadow-sm`}
                                                    onClick={() => {
                                                        setActiveMenu('calendar');
                                                        setSelectedDay(dateStr);
                                                        setEventText(event);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-semibold shadow-sm ${isStudyPlan ? 'bg-blue-900' : 'bg-purple-900'}`}>
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
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* calendar view */}
                        {activeMenu === 'calendar' && (
                            <div className="flex items-start justify-center min-h-[calc(100vh-200px)] py-8 sm:py-12 overflow-y-auto overflow-x-hidden w-full">
                                <div className="max-w-7xl w-full overflow-x-hidden">
                                    {/* Избор на план по предмет (когато има повече от един) */}
                                    {(role as string) === 'student' && plansWithId.length > 1 && (
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
                                    {/* Study Plan Stats - Only for students with study plan */}
                                    {(role as string) === 'student' && studyPlan && !studyPlanHasContent && (
                                        <div className="mb-8 p-6 sm:p-8 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                                            <p className="text-amber-900 font-bold text-lg sm:text-xl">
                                                За предмет „{studyPlan.preferences.examSubject}" все още няма готово съдържание.
                                            </p>
                                            <p className="text-amber-800 text-sm sm:text-base mt-2 leading-relaxed">
                                                Ще активираме плана, когато има теми за учене. До тогава можеш да използваш календара и останалите функции.
                                            </p>
                                        </div>
                                    )}
                                    {(role as string) === 'student' && studyPlan && studyPlanHasContent && (
                                        <div className="mb-8">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-purple-200/60 shadow-lg shadow-purple-100/10 hover:shadow-xl hover:shadow-purple-200/20 transition-all duration-300">
                                                    <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Дни до изпита</div>
                                                    <div className="text-3xl font-black text-slate-900 tabular-nums">
                                                        {Math.ceil((studyPlan.preferences.examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                                                    </div>
                                                </div>
                                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-purple-200/60 shadow-lg shadow-purple-100/10 hover:shadow-xl hover:shadow-purple-200/20 transition-all duration-300">
                                                    <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Учебни дни</div>
                                                    <div className="text-3xl font-black text-slate-900 tabular-nums">
                                                        {studyPlan.plan.filter(d => !d.completed && !d.missed).length}
                                                    </div>
                                                </div>
                                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-emerald-200/60 shadow-lg shadow-emerald-100/10 hover:shadow-xl hover:shadow-emerald-200/20 transition-all duration-300">
                                                    <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Завършени</div>
                                                    <div className="text-3xl font-black text-emerald-600 tabular-nums">
                                                        {studyPlan.plan.filter(d => d.completed).length}
                                                    </div>
                                                </div>
                                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-purple-200/60 shadow-lg shadow-purple-100/10 hover:shadow-xl hover:shadow-purple-200/20 transition-all duration-300">
                                                    <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Теми на ден</div>
                                                    <div className="text-3xl font-black text-slate-900 tabular-nums">
                                                        {studyPlan.preferences.topicsPerDay}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Reminder note */}
                                            <div className="mt-6 p-5 bg-blue-50 border border-blue-200/60 rounded-2xl">
                                                <div className="flex items-start gap-3">
                                                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-sm text-blue-900 font-medium leading-relaxed">
                                                        <strong className="font-bold">Напомняне:</strong> Всяка тема включва учене и преговор, затова няма отделни дни само за преговор.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* two column layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* calendar */}
                                        <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-900/10 border border-slate-200/80 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
                                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-3xl -z-10"></div>

                                    {/* month navigation */}
                                    <div className="flex items-center justify-center gap-8 mb-10">
                                        <button 
                                            onClick={goToPreviousMonth}
                                            className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 border border-slate-200/60 hover:border-purple-300/80 hover:shadow-md"
                                        >
                                            <svg className="w-5 h-5 text-slate-700 hover:text-purple-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                        </h3>
                                        <button 
                                            onClick={goToNextMonth}
                                            className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 border border-slate-200/60 hover:border-purple-300/80 hover:shadow-md"
                                        >
                                            <svg className="w-5 h-5 text-slate-700 hover:text-purple-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* day names */}
                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                        {dayNames.map(day => (
                                            <div key={day} className="text-center text-xs font-black text-slate-600 py-2 uppercase tracking-wider">
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
                                            const hasEvent = events[dateKey];
                                            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                                            
                                            // check if this day has study plan topics
                                            const studyDay = studyPlan?.plan.find(d => d.date === dateKey);
                                            const hasStudyTopics = studyDay && studyDay.topics.length > 0;
                                            
                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => handleDayClick(day)}
                                                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all duration-300 p-1 hover:scale-105 active:scale-95 ${
                                                        isToday
                                                            ? 'bg-gradient-to-br from-purple-700 to-purple-900 text-white shadow-lg shadow-purple-500/30'
                                                            : studyDay?.completed
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md border border-emerald-200/60'
                                                            : studyDay?.missed
                                                            ? 'bg-red-50 text-red-700 hover:bg-red-100 hover:shadow-md border border-red-200/60'
                                                            : hasStudyTopics
                                                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md border border-blue-200/60'
                                                            : 'text-slate-700 hover:bg-slate-100 hover:shadow-sm border border-transparent hover:border-slate-200/60'
                                                    }`}
                                                >
                                                    <span>{day}</span>
                                                    {hasEvent && !isToday && (
                                                        <div className="absolute bottom-1.5 right-1.5">
                                                            <span className="w-1.5 h-1.5 bg-purple-900 rounded-full block"></span>
                                                        </div>
                                                    )}
                                                    {hasStudyTopics && (
                                                        <div className="absolute bottom-1 left-1 flex gap-0.5 items-center">
                                                            {studyDay.topics.slice(0, 2).map((topic, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`w-1 h-1 rounded-full ${
                                                                        topic.subject === 'Български език' ? 'bg-purple-600' : 'bg-amber-500'
                                                                    }`}
                                                                    title={topic.name}
                                                                />
                                                            ))}
                                                            {studyDay.topics.length > 2 && (
                                                                <span className="text-[8px] leading-none">+{studyDay.topics.length - 2}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {studyDay?.completed && (
                                                        <div className="absolute top-1 right-1 text-xs">✓</div>
                                                    )}
                                                    {studyDay?.missed && (
                                                        <div className="absolute top-1 right-1 text-xs">✗</div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* legend and add button */}
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
                                            {studyPlan && (role as string) === 'student' && (
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
                                                        getUpcomingEvents().map(({ date, dateStr, event, type }) => {
                                                            const isStudyPlan = type === 'study';
                                                            return (
                                                            <div 
                                                                key={dateStr} 
                                                                className={`group ${isStudyPlan ? 'bg-white/60 backdrop-blur-sm hover:bg-white/80 border border-blue-200/60 hover:border-blue-300/80' : 'bg-white/60 backdrop-blur-sm hover:bg-white/80 border border-purple-200/60 hover:border-purple-300/80'} rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]`}
                                                                onClick={() => {
                                                                    setSelectedDay(dateStr);
                                                                    setEventText(event);
                                                                }}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`flex-shrink-0 w-12 h-12 ${isStudyPlan ? 'bg-gradient-to-br from-blue-600 to-blue-500' : 'bg-gradient-to-br from-purple-600 to-purple-500'} rounded-xl flex flex-col items-center justify-center text-white shadow-lg`}>
                                                                        <span className="text-[10px] font-bold uppercase leading-tight">
                                                                            {date.toLocaleDateString('bg-BG', { month: 'short' })}
                                                                        </span>
                                                                        <span className="text-base font-black leading-none mt-0.5">{date.getDate()}</span>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-xs font-bold ${isStudyPlan ? 'text-blue-700' : 'text-purple-700'} mb-1.5 uppercase tracking-wider`}>
                                                                            {date.toLocaleDateString('bg-BG', { weekday: 'short' })}
                                                                        </p>
                                                                        <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
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
                        )}

                        {/* events view */}
                        {activeMenu === 'events' && (
                            <div className="space-y-8">
                                <div className="mb-10">
                                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">Събития</h2>
                                    <p className="text-base sm:text-lg font-semibold text-slate-600">Прегледайте всички ваши събития</p>
                                </div>
                                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-900/10 border border-slate-200/80 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
                                    <div className="flex items-center justify-between mb-8 relative">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Всички събития</h3>
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
                                            getAllEvents().map(({ date, dateStr, event }) => (
                                                <div 
                                                    key={dateStr} 
                                                    className="group bg-white/60 backdrop-blur-sm hover:bg-white/80 border border-slate-200/60 rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-slate-300/80 hover:scale-[1.02]"
                                                    onClick={() => {
                                                        setActiveMenu('calendar');
                                                        setSelectedDay(dateStr);
                                                        setEventText(event);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-lg bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600">
                                                            <span className="uppercase leading-tight">
                                                                {date.toLocaleDateString('bg-BG', { month: 'short' })}
                                                            </span>
                                                            <span className="text-lg font-black leading-none mt-0.5">{date.getDate()}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                                                                {date.toLocaleDateString('bg-BG', { weekday: 'long' })}
                                                            </p>
                                                            <p className="text-base font-semibold text-slate-900 line-clamp-1">
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
                                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">Настройки</h2>
                                    <p className="text-base sm:text-lg text-slate-600 font-semibold">Персонализирайте вашите настройки</p>
                                </div>
                                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 sm:p-16 shadow-xl shadow-slate-900/10 border border-slate-200/80 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">Функционалността скоро ще бъде достъпна</h3>
                                    <p className="text-lg text-slate-600 font-medium">Работим по добавянето на настройки</p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* event modal */}
                {selectedDay && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-lg w-full shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-300 border border-slate-200/80 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-100/20 via-pink-100/15 to-transparent rounded-full blur-3xl -z-10"></div>
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {events[selectedDay] ? 'Редактирай събитие' : 'Ново събитие'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setSelectedDay(null);
                                            setEventText("");
                                        }}
                                        className="p-2 hover:bg-slate-50 rounded-xl transition-all duration-300 hover:scale-110"
                                    >
                                        <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 px-5 py-3 rounded-xl border border-slate-200/60">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-bold text-slate-900">{selectedDay}</span>
                                </div>
                            </div>
                            <textarea
                                value={eventText}
                                onChange={(e) => setEventText(e.target.value)}
                                placeholder="Напр: Урок, Консултация, Среща, Подготовка..."
                                className="w-full border-2 border-slate-200 focus:border-purple-500 rounded-2xl px-5 py-4 mb-6 h-36 text-base focus:ring-4 focus:ring-purple-500/10 outline-none transition-all resize-none font-medium text-slate-700 placeholder-slate-400 hover:border-slate-300"
                                autoFocus
                            />
                            <div className="flex items-center justify-between gap-3">
                                {events[selectedDay] && (
                                    <button
                                        onClick={handleDeleteEvent}
                                        className="px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 flex items-center gap-2 hover:scale-105 border border-red-200/60 hover:border-red-300/80"
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
                                            setEventText("");
                                        }}
                                        className="px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-300 border border-slate-200/60 hover:border-slate-300/80"
                                    >
                                        Откажи
                                    </button>
                                    <button
                                        onClick={handleSaveEvent}
                                        className="px-6 py-3 text-sm font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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
        <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-purple-100/20 flex overflow-hidden overflow-x-hidden relative">
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
                <div className="flex-shrink-0 p-4 border-t border-purple-200/50">
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-purple-200/60 shadow-lg shadow-purple-100/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent rounded-2xl -z-10"></div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-2xl -z-10"></div>
                        <div className="flex items-center gap-2 mb-3 relative">
                            <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Бърза статистика</p>
                        </div>
                        <div className="space-y-2.5 relative">
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                                <span className="text-xs font-bold text-purple-700">Серия</span>
                                <span className="text-base font-black text-purple-900 tabular-nums">{longestStreak} дни</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                                <span className="text-xs font-bold text-purple-700">Събития</span>
                                <span className="text-base font-black text-purple-900 tabular-nums">{Object.keys(events).length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* main content area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
                <div className="max-w-[1600px] mx-auto px-10 sm:px-12 lg:px-16 py-12 w-full">
                    {/* dashboard view */}
                    {activeMenu === 'dashboard' && (
                        <div className="py-8 sm:py-12 md:py-16 w-full overflow-x-hidden">
                            {/* welcome header */}
                            <div className="mb-16 sm:mb-20 animate-in slide-in-from-top duration-700 delay-100 w-full">
                                <div className="flex items-center gap-8 mb-8 w-full min-w-0">
                                    <div className="flex items-center gap-8 sm:gap-10 flex-1 min-w-0">
                                        <div className="relative">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-br from-purple-100/90 via-violet-50/80 to-purple-50/70 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-purple-200/30 ring-1 ring-purple-200/40">
                                                <span className="text-3xl sm:text-4xl">
                                                    {(() => {
                                                        const hour = new Date().getHours();
                                                        if (hour < 12) return '🌅';
                                                        if (hour < 18) return '☀️';
                                                        return '🌙';
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="absolute -inset-1 bg-gradient-to-br from-purple-200/20 to-violet-100/10 rounded-3xl blur-xl -z-10"></div>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-3 bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 bg-clip-text text-transparent">
                                                {(() => {
                                                    const hour = new Date().getHours();
                                                    const name = user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : '';
                                                    if (hour < 12) return `Добро утро${name ? `, ${name}` : ''}!`;
                                                    if (hour < 18) return `Добър ден${name ? `, ${name}` : ''}!`;
                                                    return `Добър вечер${name ? `, ${name}` : ''}!`;
                                                })()}
                                            </h2>
                                            <p className="text-base sm:text-lg font-semibold text-slate-500 leading-relaxed">
                                                Преглед на днешната активност и напредък
                                            </p>
                                            </div>
                                        </div>

                                    {/* streak display */}
                                    {role === 'student' && (
                                        <div className="relative inline-flex items-center gap-4 px-7 py-5 bg-white/80 backdrop-blur-md rounded-3xl border border-purple-200/50 shadow-lg shadow-purple-200/20 flex-shrink-0 hover:shadow-xl hover:shadow-purple-300/30 transition-all duration-300 hover:scale-105 ml-auto mr-8 lg:mr-12">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-violet-50/30 rounded-3xl blur-sm -z-10"></div>
                                            <div className="text-4xl animate-pulse drop-shadow-lg">🔥</div>
                                            <div className="flex flex-col">
                                                <span className="text-3xl font-black text-purple-900 tabular-nums">{currentStreak}</span>
                                                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">ДНИ СЕРИИ</span>
                                            </div>
                                        </div>
                                    )}
                                        </div>
                                    </div>

                            <div className="h-6 sm:h-8 md:h-10"></div>

                            {/* main grid layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 xl:gap-20 w-full overflow-x-hidden">
                                {/* left column */}
                                <div className="lg:col-span-2 space-y-16 sm:space-y-18 lg:space-y-20 w-full min-w-0 overflow-x-hidden">
                                {/* Избор на план по предмет (когато има повече от един) */}
                                {role === 'student' && plansWithId.length > 1 && (
                                    <div>
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
                                {/* карта за създаване/добавяне на учебен план */}
                                {role === 'student' && (
                                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-14 sm:p-16 lg:p-24 shadow-2xl shadow-purple-200/20 relative overflow-visible animate-in slide-in-from-left duration-700 delay-200 hover:shadow-3xl hover:shadow-purple-300/30 transition-all duration-500 group border border-purple-200/60">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-violet-50/20 to-transparent rounded-3xl -z-10"></div>
                                        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-purple-100/20 via-violet-100/15 to-transparent rounded-full blur-3xl -z-10"></div>
                                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-50/15 to-transparent rounded-full blur-3xl -z-10"></div>
                                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-14">
                                            <div className="flex-1 space-y-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br from-purple-500 via-purple-400 to-violet-500 ring-2 ring-purple-200/50 group-hover:ring-purple-300/60 transition-all duration-500">
                                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            </div>
                                                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
                                                        {studyPlans.length > 0 ? 'Добави план по друг предмет' : 'Създай своя персонален учебен план'}
                                                    </h3>
                                        </div>
                                                <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                                                    {studyPlans.length > 0 ? 'Създай учебен план по още един матурен предмет.' : 'Отговори на няколко кратки въпроса и ще създадем учебен план, съобразен с твоето време, ниво и цел за матурата.'}
                                                </p>
                                                {studyPlans.length === 0 && (
                                                <div className="inline-flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-purple-50/80 to-violet-50/60 rounded-2xl border border-purple-100/60 shadow-sm">
                                                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-xs sm:text-sm text-purple-700 font-semibold leading-relaxed">
                                                        Всяка тема включва учене и преговор, затова няма отделни дни само за преговор.
                                                    </p>
                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-8 sm:mt-0">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/study-plan/intro')}
                                                    className="relative px-8 py-5 sm:px-10 sm:py-6 rounded-2xl font-bold text-base sm:text-lg transition-all duration-500 ease-out flex items-center justify-center gap-3 shadow-lg shadow-purple-300/40 hover:shadow-xl hover:shadow-purple-400/50 hover:scale-[1.03] hover:-translate-y-1 bg-gradient-to-r from-purple-500 via-purple-400 to-violet-500 hover:from-purple-400 hover:via-purple-300 hover:to-violet-400 text-white whitespace-nowrap overflow-hidden group/btn flex-shrink-0 cursor-pointer"
                                                >
                                                    <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" aria-hidden="true" />
                                                    <svg className="w-6 h-6 relative z-10 group-hover/btn:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="relative z-10">Направи ми план</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* plan exists, no content for this subject */}
                                {role === 'student' && studyPlan && !studyPlanHasContent && (
                                    <div className="p-6 sm:p-8 bg-amber-50 border-2 border-amber-200 rounded-3xl">
                                        <p className="text-amber-900 font-bold text-lg sm:text-xl">За предмет „{studyPlan.preferences.examSubject}" все още няма готово съдържание.</p>
                                        <p className="text-amber-800 text-sm sm:text-base mt-2 leading-relaxed">Ще активираме плана, когато има теми за учене. До тогава можеш да използваш календара и останалите функции.</p>
                                    </div>
                                )}

                                {/* todays study tasks widget */}
                                {role === 'student' && studyPlanHasContent && getTodayStudyTasks() && getTodayStudyTasks()!.topics.length > 0 && (
                                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-14 sm:p-16 lg:p-24 shadow-2xl shadow-purple-200/20 relative overflow-visible animate-in slide-in-from-bottom duration-700 delay-300 hover:shadow-3xl hover:shadow-purple-300/30 transition-all duration-500 group border border-purple-100/60">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-violet-50/20 to-transparent rounded-3xl -z-10"></div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/20 via-violet-100/15 to-transparent rounded-full blur-3xl -z-10"></div>
                                        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-purple-100/15 to-transparent rounded-full blur-3xl -z-10"></div>
                                        <div className="relative space-y-12">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-7">
                                                    <div className="relative">
                                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br from-purple-500 via-purple-400 to-violet-500 transition-all duration-500 group-hover:scale-105 ring-2 ring-purple-200/40">
                                                            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            </div>
                                                    <div>
                                                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-5">
                                                            Днешни учебни задачи
                                                        </h3>
                                                        <p className="text-sm sm:text-base lg:text-lg text-slate-600 font-semibold leading-relaxed">
                                                            {new Date().toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                {getTodayStudyTasks()?.completed ? (
                                                    <span className="px-7 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-50/80 text-emerald-700 rounded-2xl font-black text-sm shadow-sm ring-1 ring-emerald-200/50">
                                                        ✓ Завършено
                                                    </span>
                                                ) : getTodayStudyTasks()?.missed ? (
                                                    <span className="px-7 py-3.5 bg-gradient-to-r from-red-50 to-red-50/80 text-red-700 rounded-2xl font-black text-sm shadow-sm ring-1 ring-red-200/50">
                                                        ✗ Пропуснато
                                                    </span>
                                                ) : (
                                                    <span className="px-7 py-3.5 bg-gradient-to-r from-purple-50 to-violet-50/80 text-purple-700 rounded-2xl font-black text-sm shadow-sm ring-1 ring-purple-200/50">
                                                        ⏳ В процес
                                                    </span>
                                                )}
                                        </div>
                                        
                                            <div className="space-y-12">
                                                {getTodayStudyTasks()!.topics.map((topic, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`px-10 py-8 lg:px-12 lg:py-10 rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer relative overflow-visible group/topic backdrop-blur-sm ${
                                                            topic.subject === 'Български език'
                                                                ? 'bg-white/60 hover:bg-white/80 border border-purple-200/60 hover:border-purple-300/80 shadow-lg shadow-purple-200/10 hover:shadow-purple-300/20'
                                                                : 'bg-white/60 hover:bg-white/80 border border-amber-200/60 hover:border-amber-300/80 shadow-lg shadow-amber-200/10 hover:shadow-amber-300/20'
                                                        }`}
                                                        style={{ animationDelay: `${idx * 100}ms` }}
                                                    >
                                                        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${
                                                            topic.subject === 'Български език'
                                                                ? 'from-purple-50/30 to-transparent'
                                                                : 'from-amber-50/30 to-transparent'
                                                        } -z-10`}></div>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover/topic:translate-x-[100%] transition-transform duration-1000 rounded-3xl"></div>
                                                        <div className="relative flex items-start justify-between gap-6 w-full">
                                                            <div className="flex-1 min-w-0 space-y-4 w-full">
                                                                <span className={`inline-block text-xs font-black px-5 py-3 rounded-2xl shadow-sm whitespace-nowrap ${
                                                                    topic.subject === 'Български език'
                                                                        ? 'bg-gradient-to-r from-purple-100 to-purple-200/80 text-purple-700 ring-1 ring-purple-200/50'
                                                                        : 'bg-gradient-to-r from-amber-100 to-amber-200/80 text-amber-700 ring-1 ring-amber-200/50'
                                                                }`}>
                                                                    {topic.subject}
                                                                </span>
                                                                <p className="text-base sm:text-lg lg:text-xl font-black text-slate-900 leading-relaxed break-words overflow-wrap-anywhere w-full">
                                                                    {topic.name}
                                                                </p>
                                                            </div>
                                                            {getTodayStudyTasks()?.completed && (
                                                                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                                            )}
                                            </div>
                                        </div>
                                                ))}
                                    </div>

                                            {!getTodayStudyTasks()?.completed && !getTodayStudyTasks()?.missed && (
                                                <div className="pt-16 animate-in fade-in duration-500 delay-500">
                                                    <button
                                                        onClick={() => {
                                                            setActiveMenu('calendar');
                                                        }}
                                                        className="relative w-full px-12 py-7 sm:px-14 sm:py-8 rounded-3xl font-black text-base sm:text-lg lg:text-xl transition-all duration-500 ease-out shadow-lg shadow-purple-300/30 hover:shadow-purple-300/40 hover:-translate-y-2 hover:scale-[1.03] active:scale-100 bg-gradient-to-r from-purple-500 via-purple-400 to-violet-500 hover:from-purple-400 hover:via-purple-300 hover:to-violet-400 text-white whitespace-nowrap ring-2 ring-purple-200/50 hover:ring-purple-300/70 overflow-hidden group/btn flex items-center justify-center gap-5"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                                                        <svg className="w-7 h-7 sm:w-8 sm:h-8 relative z-10 group-hover/btn:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        <span className="relative z-10">Започни учене сега</span>
                                                        <svg className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 group-hover/btn:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            </div>
                                        </div>
                                )}

                                {role === 'student' && studyPlan && getTodayStudyTasks() && getTodayStudyTasks()!.topics.length > 0 && getUpcomingStudyTopics().length > 0 && (
                                    <div className="h-12 sm:h-16 md:h-20"></div>
                                )}

                                {/* upcoming study topics */}
                                {role === 'student' && studyPlan && getUpcomingStudyTopics().length > 0 && (
                                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-14 sm:p-16 lg:p-24 shadow-xl shadow-slate-900/10 relative overflow-visible animate-in slide-in-from-right duration-700 delay-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 border border-slate-200/80 group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 to-transparent rounded-3xl -z-10"></div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
                                        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
                                        <div className="relative space-y-14">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-7">
                                                    <div className="relative">
                                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl bg-gradient-to-br from-purple-500 via-purple-400 to-violet-500 ring-2 ring-purple-200/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                                                        Предстоящи теми
                                                    </h3>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setActiveMenu('calendar');
                                                    }}
                                                    className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-all duration-300 hover:scale-110 flex items-center gap-2 group/link"
                                                >
                                                    <span>Виж всички</span>
                                                    <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                    </div>

                                            <div className="space-y-10">
                                                {getUpcomingStudyTopics().slice(0, 3).map(({ date, studyDay }) => {
                                                    const [year, month, day] = date.split('-').map(Number);
                                                    const studyDate = new Date(year, month - 1, day);
                                                    const tomorrow = new Date(today);
                                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                                    tomorrow.setHours(0, 0, 0, 0);
                                                    studyDate.setHours(0, 0, 0, 0);
                                                    const isTomorrow = studyDate.getTime() === tomorrow.getTime();
                                                    
                                                    return (
                                                        <button
                                                            key={date}
                                                            onClick={() => {
                                                                setActiveMenu('calendar');
                                                            }}
                                                            className="block w-full text-left p-12 lg:p-14 rounded-3xl bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-200/30 group/item relative overflow-visible border border-slate-200/80 hover:border-purple-300/80 shadow-xl shadow-slate-900/10 overflow-wrap-anywhere"
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 to-transparent rounded-3xl -z-10"></div>
                                                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-100/20 via-pink-100/15 to-transparent rounded-full blur-3xl -z-10"></div>
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover/item:translate-x-[100%] transition-transform duration-1000 rounded-3xl"></div>
                                                            <div className="relative flex items-start justify-between gap-8 mb-10">
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                                                        {isTomorrow ? 'Утре' : (() => {
                                                                            const dayNames = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];
                                                                            const monthNames = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'];
                                                                            const weekday = dayNames[studyDate.getDay()];
                                                                            const day = studyDate.getDate();
                                                                            const month = monthNames[studyDate.getMonth()];
                                                                            return `${weekday.toUpperCase()}, ${day} ${month.toUpperCase()}`;
                                                                        })()}
                                                                    </p>
                                                                    <p className="text-sm font-bold text-slate-600">
                                                                        {studyDay.topics.length} {studyDay.topics.length === 1 ? 'тема' : 'теми'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-1.5 items-center">
                                                                    {studyDay.topics.slice(0, 3).map((topic, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                                                                                topic.subject === 'Български език' ? 'bg-purple-600' : 'bg-amber-500'
                                                                            }`}
                                                                            title={topic.name}
                                                                        />
                                                                    ))}
                                                                    {studyDay.topics.length > 3 && (
                                                                        <span className="text-xs text-slate-500 ml-1 font-bold">+{studyDay.topics.length - 3}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-6">
                                                                {studyDay.topics.slice(0, 2).map((topic, idx) => (
                                                                    <div key={idx} className="flex items-start gap-6 w-full">
                                                                        <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1.5 shadow-sm ${
                                                                            topic.subject === 'Български език' ? 'bg-purple-500' : 'bg-amber-500'
                                                                        }`}></span>
                                                                        <p className="text-base lg:text-lg font-semibold text-slate-800 leading-relaxed break-words flex-1 min-w-0 overflow-wrap-anywhere">
                                                                            <span className={`font-black ${
                                                                                topic.subject === 'Български език' ? 'text-purple-600' : 'text-amber-600'
                                                                            }`}>
                                                                                {topic.subject}:
                                                                            </span> {topic.name}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                                {studyDay.topics.length > 2 && (
                                                                    <p className="text-sm text-slate-500 pl-10 leading-relaxed font-bold">
                                                                        +{studyDay.topics.length - 2} още {studyDay.topics.length - 2 === 1 ? 'тема' : 'теми'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>

                                {/* right sidebar */}
                                <div className="lg:col-span-1 space-y-20 lg:space-y-24 w-full min-w-0 overflow-x-hidden">
                                    {/* study progress card – само когато има съдържание */}
                                    {studyPlanHasContent && getStudyPlanProgress() && (
                                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-12 lg:p-14 shadow-2xl shadow-emerald-200/20 relative overflow-visible animate-in slide-in-from-right duration-700 delay-300 hover:shadow-3xl hover:shadow-emerald-300/30 transition-all duration-500 border border-emerald-200/60 hover:border-emerald-300/80 group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-emerald-50/20 to-transparent rounded-3xl -z-10"></div>
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-200/30 via-emerald-100/20 to-transparent rounded-full blur-3xl animate-pulse -z-10"></div>
                                            <div className="relative space-y-16">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg ring-2 ring-emerald-200/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-900 bg-clip-text text-transparent">
                                                        Напредък в ученето
                                                    </h3>
                                                </div>
                                                <div>
                                                    <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-10 lg:p-12 border border-emerald-200/60 shadow-lg shadow-emerald-100/10 hover:shadow-xl hover:shadow-emerald-200/20 transition-all duration-300">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 to-transparent rounded-3xl -z-10"></div>
                                                        <div className="relative flex items-center justify-between mb-10">
                                                            <span className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Общ напредък</span>
                                                            <span className="text-3xl lg:text-4xl font-black text-emerald-900 tabular-nums">{getStudyPlanProgress()!.completionPercentage}%</span>
                                                        </div>
                                                        <div className="w-full h-5 bg-emerald-100/50 rounded-full overflow-hidden shadow-inner border border-emerald-200/30">
                                                            <div 
                                                                className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 shadow-lg relative overflow-hidden"
                                                                style={{ width: `${getStudyPlanProgress()!.completionPercentage}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                                            </div>
                                            </div>
                                        </div>
                                        
                                                    <div className="h-6 sm:h-8 md:h-10"></div>

                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-blue-200/60 shadow-lg shadow-blue-100/10 hover:shadow-xl hover:shadow-blue-200/20 hover:scale-[1.02] transition-all duration-300 group/stat relative overflow-visible">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-transparent rounded-3xl -z-10"></div>
                                                            <div style={{ transform: 'translateX(1rem)' }}>
                                                                <p className="text-xs font-bold text-blue-700 mb-8 uppercase tracking-wider leading-tight">Завършени теми</p>
                                                                <p className="text-3xl lg:text-4xl font-black text-blue-900 mb-6 tabular-nums group-hover/stat:scale-110 transition-transform duration-300 leading-none">{getStudyPlanProgress()!.completedTopics}</p>
                                                                <p className="text-sm text-blue-600/80 font-medium leading-relaxed">от {getStudyPlanProgress()!.totalTopics}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-purple-200/60 shadow-lg shadow-purple-100/10 hover:shadow-xl hover:shadow-purple-200/20 hover:scale-[1.02] transition-all duration-300 group/stat relative overflow-visible">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-transparent rounded-3xl -z-10"></div>
                                                            <div style={{ transform: 'translateX(1rem)' }}>
                                                                <p className="text-xs font-bold text-purple-700 mb-8 uppercase tracking-wider leading-tight">Дни</p>
                                                                <p className="text-3xl lg:text-4xl font-black text-purple-900 mb-6 tabular-nums group-hover/stat:scale-110 transition-transform duration-300 leading-none">{getStudyPlanProgress()!.completedDays}</p>
                                                                <p className="text-sm text-purple-600/80 font-medium leading-relaxed">от {getStudyPlanProgress()!.totalDays}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="h-6 sm:h-8 md:h-10"></div>

                                                    {/* streak card */}
                                                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-orange-200/60 shadow-lg shadow-orange-100/10 hover:shadow-xl hover:shadow-orange-200/20 hover:scale-[1.02] transition-all duration-300 group/stat relative overflow-visible">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/40 to-transparent rounded-3xl -z-10"></div>
                                                        <div style={{ transform: 'translateX(1rem)' }}>
                                                            <p className="text-xs font-bold text-orange-700 mb-8 uppercase tracking-wider leading-tight">Серия</p>
                                                            <p className="text-3xl lg:text-4xl font-black text-orange-900 mb-6 tabular-nums group-hover/stat:scale-110 transition-transform duration-300 leading-none">{longestStreak}</p>
                                                            <p className="text-sm text-orange-600/80 font-medium leading-relaxed">{longestStreak === 1 ? 'ден' : 'дни'} подред</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {studyPlanHasContent && getStudyPlanProgress() && (
                                        <div className="h-6 sm:h-8 md:h-10"></div>
                                    )}

                                    {/* quick actions */}
                                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-12 lg:p-14 shadow-2xl shadow-purple-200/20 relative overflow-visible animate-in slide-in-from-right duration-700 delay-400 hover:shadow-3xl hover:shadow-purple-300/30 transition-all duration-500 border border-purple-200/60 hover:border-purple-300/80 group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-violet-50/20 to-transparent rounded-3xl -z-10"></div>
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200/20 via-violet-100/15 to-transparent rounded-full blur-3xl animate-pulse -z-10"></div>
                                        <div className="relative space-y-16">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-400 to-violet-500 flex items-center justify-center shadow-lg ring-2 ring-purple-200/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                                <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                                    Бързи действия
                                                </h3>
                                            </div>
                                            <div className="pt-8">
                                                <button 
                                                    onClick={() => {
                                                        setActiveMenu('calendar');
                                                        handleDayClick(new Date().getDate());
                                                    }}
                                                    className="w-full px-8 py-5 bg-gradient-to-r from-purple-500 via-purple-400 to-violet-500 hover:from-purple-400 hover:via-purple-300 hover:to-violet-400 text-white rounded-2xl font-bold transition-all duration-500 flex items-center justify-center gap-3 text-base shadow-lg shadow-purple-300/40 hover:shadow-xl hover:shadow-purple-400/50 hover:scale-[1.03] hover:-translate-y-1 relative overflow-hidden group/btn"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                                                    <svg className="w-6 h-6 relative z-10 group-hover/btn:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    <span className="relative z-10">Добави събитие</span>
                                                </button>
                                        </div>
                                    </div>
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
                                            const hasEvent = events[dateKey];
                                            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                                            
                                            const studyDay = studyPlan?.plan.find(d => d.date === dateKey);
                                            const hasStudyTopics = studyDay && studyDay.topics.length > 0;
                                            
                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => handleDayClick(day)}
                                                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 p-1 ${
                                                        isToday
                                                            ? 'bg-purple-900 text-white shadow-sm'
                                                            : studyDay?.completed
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : studyDay?.missed
                                                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                            : hasStudyTopics
                                                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span>{day}</span>
                                                    {hasEvent && !isToday && (
                                                        <div className="absolute bottom-1.5 right-1.5">
                                                            <span className="w-1.5 h-1.5 bg-purple-900 rounded-full block"></span>
                                                        </div>
                                                    )}
                                                    {hasStudyTopics && (
                                                        <div className="absolute bottom-1 left-1 flex gap-0.5 items-center">
                                                            {studyDay.topics.slice(0, 2).map((topic, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`w-1 h-1 rounded-full ${
                                                                        topic.subject === 'Български език' ? 'bg-purple-600' : 'bg-amber-500'
                                                                    }`}
                                                                    title={topic.name}
                                                                />
                                                            ))}
                                                            {studyDay.topics.length > 2 && (
                                                                <span className="text-[8px] leading-none">+{studyDay.topics.length - 2}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {studyDay?.completed && (
                                                        <div className="absolute top-1 right-1 text-xs">✓</div>
                                                    )}
                                                    {studyDay?.missed && (
                                                        <div className="absolute top-1 right-1 text-xs">✗</div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* legend and add button */}
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
                                            {studyPlan && (role as string) === 'student' && (
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
                                                        getUpcomingEvents().map(({ date, dateStr, event, type }) => {
                                                            const isStudyPlan = type === 'study';
                                                            return (
                                                            <div 
                                                                key={dateStr} 
                                                                className={`group ${isStudyPlan ? 'bg-white/60 backdrop-blur-sm hover:bg-white/80 border border-blue-200/60 hover:border-blue-300/80' : 'bg-white/60 backdrop-blur-sm hover:bg-white/80 border border-purple-200/60 hover:border-purple-300/80'} rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]`}
                                                                onClick={() => {
                                                                    setSelectedDay(dateStr);
                                                                    setEventText(event);
                                                                }}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`flex-shrink-0 w-12 h-12 ${isStudyPlan ? 'bg-gradient-to-br from-blue-600 to-blue-500' : 'bg-gradient-to-br from-purple-600 to-purple-500'} rounded-xl flex flex-col items-center justify-center text-white shadow-lg`}>
                                                                        <span className="text-[10px] font-bold uppercase leading-tight">
                                                                            {date.toLocaleDateString('bg-BG', { month: 'short' })}
                                                                        </span>
                                                                        <span className="text-base font-black leading-none mt-0.5">{date.getDate()}</span>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-xs font-bold ${isStudyPlan ? 'text-blue-700' : 'text-purple-700'} mb-1.5 uppercase tracking-wider`}>
                                                                            {date.toLocaleDateString('bg-BG', { weekday: 'short' })}
                                                                        </p>
                                                                        <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
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
                                        getAllEvents().map(({ date, dateStr, event }) => (
                                            <div 
                                                key={dateStr} 
                                                className="group bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl p-4.5 transition-all duration-300 cursor-pointer hover:shadow-sm hover:border-slate-300/60"
                                                onClick={() => {
                                                    setActiveMenu('calendar');
                                                    setSelectedDay(dateStr);
                                                    setEventText(event);
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
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
            {selectedDay && (() => {
                const studyDay = studyPlan?.plan.find(d => d.date === selectedDay);
                const hasStudyTopics = studyDay && studyDay.topics.length > 0;
                const hasEvent = events[selectedDay];

                return (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 overflow-y-auto">
                        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-300 border border-purple-900/20 my-8">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                                        {hasEvent ? 'Редактирай събитие' : hasStudyTopics ? 'Учебни теми' : 'Ново събитие'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setSelectedDay(null);
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

                            {/* study plan topics */}
                            {hasStudyTopics && studyDay && (
                                <div className="mb-6 space-y-4">
                                    <div className="space-y-3">
                                        {studyDay.topics.map((topic, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-xl border-2 ${
                                                    topic.subject === 'Български език'
                                                        ? 'border-purple-200 bg-purple-50'
                                                        : 'border-amber-200 bg-amber-50'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                            topic.subject === 'Български език'
                                                                ? 'bg-purple-200 text-purple-700'
                                                                : 'bg-amber-200 text-amber-700'
                                                        }`}>
                                                            {topic.subject}
                                                        </span>
                                                        <h4 className="mt-2 font-semibold text-slate-900">{topic.name}</h4>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Включва учене и преговор
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* study plan actions */}
                                    {role === 'student' && (
                                        <div className="flex gap-3 pt-2 border-t border-slate-200">
                                            {!studyDay.missed && (
                                                <button
                                                    onClick={() => {
                                                        handleMarkStudyDayMissed(selectedDay);
                                                        setSelectedDay(null);
                                                    }}
                                                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm"
                                                >
                                                    Маркирай като пропуснат
                                                </button>
                                            )}
                                            {!studyDay.missed && (
                                                <button
                                                    onClick={() => {
                                                        handleMarkStudyDayCompleted(selectedDay);
                                                        setSelectedDay(null);
                                                    }}
                                                    className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-colors text-sm ${
                                                        studyDay.completed
                                                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                    }`}
                                                >
                                                    {studyDay.completed ? 'Маркирай като незавършен' : 'Завърши деня'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* regular event */}
                            {hasEvent && (
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Събитие</label>
                        <textarea
                            value={eventText}
                            onChange={(e) => setEventText(e.target.value)}
                            placeholder="Напр: Учене за матура, Преговор на материал, Решаване на тест..."
                                        className="w-full border-2 border-slate-200 focus:border-purple-900 rounded-2xl px-5 py-4 h-36 text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all resize-none font-medium text-slate-700 placeholder-slate-400"
                                        autoFocus={!hasStudyTopics}
                                    />
                                </div>
                            )}

                            {/* add event */}
                            {!hasEvent && (
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Добави събитие</label>
                                    <textarea
                                        value={eventText}
                                        onChange={(e) => setEventText(e.target.value)}
                                        placeholder="Напр: Учене за матура, Преговор на материал, Решаване на тест..."
                                        className="w-full border-2 border-slate-200 focus:border-purple-900 rounded-2xl px-5 py-4 h-36 text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all resize-none font-medium text-slate-700 placeholder-slate-400"
                                        autoFocus={!hasStudyTopics}
                                    />
                                </div>
                            )}

                        <div className="flex items-center justify-between gap-3">
                                {hasEvent && (
                                <button
                                    onClick={handleDeleteEvent}
                                    className="px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                        Изтрий събитие
                                </button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={() => {
                                        setSelectedDay(null);
                                        setEventText("");
                                    }}
                                    className="px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
                                >
                                        Затвори
                                </button>
                                    {hasEvent && (
                                <button
                                    onClick={handleSaveEvent}
                                    className="px-6 py-3 text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Запази
                                </button>
                                    )}
                                    {!hasEvent && eventText.trim() && (
                                        <button
                                            onClick={handleSaveEvent}
                                            className="px-6 py-3 text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Запази
                                        </button>
                                    )}
                            </div>
                        </div>
                    </div>
                    </div>
                );
            })()}
        </div>
    );

};