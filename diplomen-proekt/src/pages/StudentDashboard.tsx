import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router-dom";

export const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<{ [key: string]: string }>({});
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [eventText, setEventText] = useState("");
    const [longestStreak, setLongestStreak] = useState(0);

    // redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    // load events from supabase when user changes
    useEffect(() => {
        if (user) {
            loadEvents();
            loadUserStats();
        }
    }, [user]);

    const loadEvents = async () => {
        if (!user) return;
        
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error loading events:', error);
        } else if (data) {
            const eventsMap: { [key: string]: string } = {};
            data.forEach(event => {
                eventsMap[event.date] = event.event_text;
            });
            setEvents(eventsMap);
        }
    };

    const loadUserStats = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error loading stats:', error);
        } else if (data) {
            setLongestStreak(data.longest_streak || 0);
        } else {
            // No stats row exists - use default
            setLongestStreak(0);
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

    const isExamDate = (day: number) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return year === 2026 && month === 4 && day === 20; 
    };

    const handleDayClick = (day: number) => {
        const dateKey = formatDateKey(day);
        setSelectedDay(dateKey);
        setEventText(events[dateKey] || "");
    };

    const handleSaveEvent = async () => {
        if (!selectedDay || !user) return;

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
    };

    const handleDeleteEvent = async () => {
        if (!selectedDay || !user) return;

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
    };

    const getUpcomingEvents = () => {
        const today = new Date();
        return Object.entries(events)
            .map(([date, event]) => {
                const [year, month, day] = date.split('-').map(Number);
                return { date: new Date(year, month - 1, day), dateStr: date, event };
            })
            .filter(item => item.date >= today)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5);
    };

    const monthNames = ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];
    const dayNames = ["Нед", "Пон", "Вто", "Сря", "Чет", "Пет", "Съб"];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
                {/* hero section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl mb-6 md:mb-8">
                    {/* background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                    </div>
                    
                    <div className="relative p-6 md:p-10">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            {/* left: Exam Info */}
                            <div className="flex-1 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                                    <span className="text-2xl">📚</span>
                                    <span className="text-white font-medium">ДЗИ БЕЛ 2026</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
                                    Твоят изпит наближава
                                </h2>
                                <p className="text-slate-300 text-lg mb-6">
                                    20 май 2026 • {daysUntilExam} дни остават
                                </p>
                                
                                {/* progress bar */}
                                <div className="max-w-md mx-auto lg:mx-0">
                                    <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                                        <span>Напредък</span>
                                        <span className="font-semibold">{Math.min(100, Math.round(((365 - daysUntilExam) / 365) * 100))}%</span>
                                    </div>
                                    <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div 
                                            className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full transition-all duration-1000 shadow-lg"
                                            style={{ width: `${Math.min(100, ((365 - daysUntilExam) / 365) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* countdown */}
                            <div className="relative">
                                <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
                                    <div className="relative text-center">
                                        <div className="text-8xl md:text-9xl font-black text-white mb-4 tabular-nums tracking-tight leading-none">
                                            {daysUntilExam}
                                        </div>
                                        <div className="text-xl font-semibold text-slate-200 uppercase tracking-wider">
                                            ДНИ
                                        </div>
                                    </div>
                                </div>
                                {/* glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-3xl blur-2xl -z-10"></div>
                            </div>
                        </div>

                        {/* quick actions    */}
                        <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                            <button 
                                onClick={() => handleDayClick(new Date().getDate())}
                                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Добави събитие
                            </button>
                            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold transition-all hover:scale-105 border border-white/20 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                План за учене
                            </button>
                            <button 
                                onClick={goToToday}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold transition-all hover:scale-105 border border-white/20 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Към днес
                            </button>
                        </div>
                    </div>
                </div>

                {/* two-column layout*/}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* left column */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-200/60">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Календар</h2>
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-3 text-xs mr-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 bg-slate-900 rounded"></div>
                                        <span className="text-slate-600">Днес</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 bg-amber-500 rounded"></div>
                                        <span className="text-slate-600">Изпит</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 border-2 border-emerald-500 rounded relative">
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"></div>
                                        </div>
                                        <span className="text-slate-600">Събития</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* month navigation */}
                        <div className="flex items-center justify-between mb-8">
                            <button 
                                onClick={goToPreviousMonth}
                                className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors group"
                            >
                                <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h3 className="text-lg font-bold text-slate-900">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <button 
                                onClick={goToNextMonth}
                                className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors group"
                            >
                                <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* calendar grid */}
                        <div className="grid grid-cols-7 gap-2">
                            {/* day headers  */}
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-sm font-semibold text-slate-600 py-3">
                                    {day}
                                </div>
                            ))}
                            
                            {/* empty cells */}
                            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                                <div key={`empty-${index}`} className="aspect-square"></div>
                            ))}
                            
                            {/* days */}
                            {Array.from({ length: daysInMonth }).map((_, index) => {
                                const day = index + 1;
                                const dateKey = formatDateKey(day);
                                const hasEvent = events[dateKey];
                                const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                                const isDziExamDate = isExamDate(day);
                                
                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDayClick(day)}
                                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all ${
                                            isToday
                                                ? 'bg-slate-900 text-white shadow-lg scale-105 hover:scale-110'
                                                : isDziExamDate
                                                    ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg hover:scale-105'
                                                    : hasEvent
                                                        ? 'bg-emerald-50 text-slate-900 border-2 border-emerald-500 hover:bg-emerald-100 hover:scale-105'
                                                        : 'text-slate-700 hover:bg-slate-100 hover:scale-105'
                                        }`}
                                    >
                                        <span className={isToday ? 'text-lg' : ''}>{day}</span>
                                        {hasEvent && !isToday && !isDziExamDate && (
                                            <div className="absolute bottom-1.5 flex gap-0.5">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                            </div>
                                        )}
                                        {isDziExamDate && (
                                            <span className="text-[10px] font-medium mt-0.5">изпит</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* right column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* upcoming events card */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Предстоящи събития
                                </h3>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                    {getUpcomingEvents().length}
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                {getUpcomingEvents().length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 mb-1">Няма предстоящи събития</p>
                                        <p className="text-xs text-slate-500 mb-4">Кликни на ден в календара за да добавиш</p>
                                        <button 
                                            onClick={() => handleDayClick(new Date().getDate())}
                                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Добави събитие
                                        </button>
                                    </div>
                                ) : (
                                    getUpcomingEvents().map(({ date, dateStr, event }) => (
                                        <div 
                                            key={dateStr} 
                                            className="group relative bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-4 transition-all cursor-pointer hover:shadow-md"
                                            onClick={() => {
                                                setSelectedDay(dateStr);
                                                setEventText(event);
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex flex-col items-center justify-center text-white shadow-md">
                                                    <span className="text-xs font-medium uppercase">
                                                        {date.toLocaleDateString('bg-BG', { month: 'short' })}
                                                    </span>
                                                    <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-500 mb-1">
                                                        {date.toLocaleDateString('bg-BG', { weekday: 'long' })}
                                                    </p>
                                                    <p className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-slate-700">
                                                        {event}
                                                    </p>
                                                </div>
                                                <svg className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* stats card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg text-white">
                            <h3 className="text-lg font-bold mb-4">Твоята статистика</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                            <span className="text-xl">🏆</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-300">Най-дълга серия</p>
                                            <p className="text-xl font-bold">{longestStreak} дни</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-px bg-white/10"></div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                            <span className="text-xl">📅</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-300">Общо събития</p>
                                            <p className="text-xl font-bold">{Object.keys(events).length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* event modal */}
            {selectedDay && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {events[selectedDay] ? 'Редактирай събитие' : 'Ново събитие'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setSelectedDay(null);
                                        setEventText("");
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">{selectedDay}</span>
                            </div>
                        </div>
                        <textarea
                            value={eventText}
                            onChange={(e) => setEventText(e.target.value)}
                            placeholder="Напр: Учене за матура, Преговор на материал, Решаване на тест..."
                            className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-xl px-4 py-3 mb-6 h-32 text-sm focus:ring-4 focus:ring-slate-900/10 outline-none transition resize-none"
                            autoFocus
                        />
                        <div className="flex items-center justify-between gap-3">
                            {events[selectedDay] && (
                                <button
                                    onClick={handleDeleteEvent}
                                    className="px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Изтрий
                                </button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <button
                                    onClick={() => {
                                        setSelectedDay(null);
                                        setEventText("");
                                    }}
                                    className="px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Откажи
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    className="px-6 py-3 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
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