import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../supabase-client";

export const Home = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<{ [key: string]: string }>({});
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [eventText, setEventText] = useState("");
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [loading, setLoading] = useState(true);


    // Load events from Supabase when user changes
    useEffect(() => {
        if (user) {
            loadEvents();
            loadUserStats();
        }
    }, [user]);

    const loadEvents = async () => {
        if (!user) return;
        
        setLoading(true);
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
        setLoading(false);
    };

    const loadUserStats = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error loading stats:', error);
        } else if (data) {
            setCurrentStreak(data.current_streak || 0);
            setLongestStreak(data.longest_streak || 0);
            setEarnedPoints(data.earned_points || 0);
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
        <div className="min-h-screen bg-slate-50">
            {/*   header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white text-base font-semibold">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                                <p className="text-xs text-slate-500">{user?.user_metadata?.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                                <span className="text-base">🔥</span>
                                <span className="text-sm font-bold text-slate-900">{currentStreak}</span>
                                <span className="text-xs text-slate-600">дни</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                                <span className="text-base">⭐</span>
                                <span className="text-sm font-bold text-slate-900">{earnedPoints}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/*еxam цountdown */}
                <div className="bg-white border border-slate-200 rounded-lg p-8 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-4xl">📚</span>
                                <div>
                                    <h1 className="text-xl font-semibold text-slate-900">ДЗИ БЕЛ 2026</h1>
                                    <p className="text-sm text-slate-600">20 май 2026</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-6xl font-bold text-slate-900 mb-2 tabular-nums">{daysUntilExam}</div>
                            <div className="text-sm font-medium text-slate-600">дни до изпита</div>
                            <div className="mt-4 w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-rose-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, ((365 - daysUntilExam) / 365) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* calendar */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-900">Календар</h2>
                            <button 
                                onClick={goToToday}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
                            >
                                Днес
                            </button>
                        </div>
                        
                        {/* month navigation */}
                        <div className="flex items-center justify-between mb-6">
                            <button 
                                onClick={goToPreviousMonth}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                            >
                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h3 className="text-base font-semibold text-slate-900">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <button 
                                onClick={goToNextMonth}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                            >
                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* calendar grid */}
                        <div className="grid grid-cols-7 gap-2">
                            {/* day headers  */}
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-xs font-medium text-slate-600 py-2">
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
                                        className={`relative aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:border-slate-300 ${
                                            isToday
                                                ? 'bg-slate-900 text-white font-semibold shadow-sm'
                                                : isDziExamDate
                                                    ? 'bg-amber-500 text-white font-semibold'
                                                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {day}
                                        {hasEvent && !isToday && !isDziExamDate && (
                                            <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* events sidebar  */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900 mb-4">
                            Предстоящи събития
                        </h3>
                        
                        <div className="space-y-3">
                            {getUpcomingEvents().length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="text-3xl mb-2 block">📅</span>
                                    <p className="text-xs text-slate-500">Няма предстоящи събития</p>
                                </div>
                            ) : (
                                getUpcomingEvents().map(({ date, dateStr, event }) => (
                                    <div 
                                        key={dateStr} 
                                        className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer"
                                        onClick={() => {
                                            setSelectedDay(dateStr);
                                            setEventText(event);
                                        }}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-emerald-700">{date.getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-600 mb-1">
                                                    {date.toLocaleDateString('bg-BG', { month: 'long', day: 'numeric' })}
                                                </p>
                                                <p className="text-sm text-slate-900 line-clamp-2">{event}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* event modal */}
            {selectedDay && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                                Събитие
                            </h3>
                            <p className="text-xs text-slate-500">{selectedDay}</p>
                        </div>
                        <textarea
                            value={eventText}
                            onChange={(e) => setEventText(e.target.value)}
                            placeholder="Добави описание..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 h-24 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition resize-none"
                        />
                        <div className="flex justify-end gap-2">
                            {events[selectedDay] && (
                                <button
                                    onClick={handleDeleteEvent}
                                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                    Изтрий
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setSelectedDay(null);
                                    setEventText("");
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Откажи
                            </button>
                            <button
                                onClick={handleSaveEvent}
                                className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
                            >
                                Запази
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};