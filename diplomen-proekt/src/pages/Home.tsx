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
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-rose-900 via-rose-700 to-rose-900 bg-clip-text text-transparent">
                Добре дошъл!
            </h1>
            
            {/* info */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 shadow-lg rounded-xl p-6 mb-8 border border-rose-100">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800">{user?.email}</h2>
                        <p className="text-gray-600">
                            <span className="inline-block bg-rose-100 text-rose-900 px-3 py-1 rounded-full text-sm font-medium mt-1">
                                {user?.user_metadata?.role || 'Потребител'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* dzi bel*/}
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 shadow-lg rounded-xl p-6 mb-8 border-2 border-amber-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">📚</div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">ДЗИ БЕЛ</h3>
                            <p className="text-gray-600">Дата на изпита: 20.05.2026</p>
                        </div>
                    </div>
                    <div className="text-center bg-white/70 px-6 py-4 rounded-xl border border-amber-200">
                        <div className="text-4xl font-bold text-rose-700">{daysUntilExam}</div>
                        <div className="text-sm text-gray-600 font-medium">оставащи дни</div>
                    </div>
                </div>
            </div>

            {/* streak section */}
            <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-pink-50 shadow-lg rounded-xl p-6 mb-8 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">🔥</div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Streak на учене</h3>
                            <p className="text-gray-600">Продължавай да учиш всеки ден!</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center bg-white/70 px-6 py-4 rounded-xl border border-purple-200">
                            <div className="text-4xl font-bold text-purple-700">{currentStreak}</div>
                            <div className="text-sm text-gray-600 font-medium">текущ streak</div>
                        </div>
                        <div className="text-center bg-white/70 px-6 py-4 rounded-xl border border-purple-200">
                            <div className="text-4xl font-bold text-rose-700">{longestStreak}</div>
                            <div className="text-sm text-gray-600 font-medium">най-дълъг streak</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* points */}
            <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 shadow-lg rounded-xl p-6 mb-8 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">⭐</div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Точки от учене</h3>
                            <p className="text-gray-600">Събирай точки за всяко завършено упражнение!</p>
                        </div>
                    </div>
                    <div className="text-center bg-white/70 px-8 py-5 rounded-xl border border-blue-200">
                        <div className="text-5xl font-bold text-blue-700">{earnedPoints}</div>
                        <div className="text-sm text-gray-600 font-medium">общо точки</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* calendar */}
                <div className="lg:col-span-2 bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Календар</h2>
                        <button 
                            onClick={goToToday}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
                        >
                            Днес
                        </button>
                    </div>
                    
                    {/* month nav */}
                    <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
                        <button 
                            onClick={goToPreviousMonth}
                            className="px-4 py-2 bg-white hover:bg-gray-100 rounded-lg shadow-sm transition font-medium"
                        >
                            ← Предишен
                        </button>
                        <h3 className="text-xl font-bold text-gray-800">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <button 
                            onClick={goToNextMonth}
                            className="px-4 py-2 bg-white hover:bg-gray-100 rounded-lg shadow-sm transition font-medium"
                        >
                            Следващ →
                        </button>
                    </div>

                    {/* calendar grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {/* day headers */}
                        {dayNames.map(day => (
                            <div key={day} className="text-center font-bold py-3 text-gray-700 text-sm">
                                {day}
                            </div>
                        ))}
                        
                        {/* empty cells before first day */}
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
                                    className={`aspect-square border-2 rounded-xl flex flex-col items-center justify-center hover:shadow-lg transition-all transform hover:scale-105 ${
                                        isDziExamDate
                                            ? 'border-amber-500 bg-gradient-to-br from-amber-100 to-orange-100 font-bold ring-2 ring-amber-300'
                                            : isToday 
                                                ? 'border-rose-500 bg-gradient-to-br from-rose-100 to-rose-200 font-bold' 
                                                : 'border-gray-200 hover:border-rose-300'
                                    } ${hasEvent && !isDziExamDate ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400' : isDziExamDate ? '' : 'bg-white'}`}
                                >
                                    <span className={`text-sm font-semibold ${isDziExamDate ? 'text-amber-700' : isToday ? 'text-rose-700' : 'text-gray-700'}`}>
                                        {day}
                                    </span>
                                    {isDziExamDate && (
                                        <span className="text-xl leading-none">📚</span>
                                    )}
                                    {hasEvent && !isDziExamDate && (
                                        <span className="text-xl text-green-600 leading-none">●</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* upcoming events sidebar */}
                <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📅</span>
                        Предстоящи събития
                    </h3>
                    
                    <div className="space-y-3">
                        {getUpcomingEvents().length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-4xl mb-2">📭</p>
                                <p className="text-sm">Няма предстоящи събития</p>
                            </div>
                        ) : (
                            getUpcomingEvents().map(({ date, dateStr, event }) => (
                                <div 
                                    key={dateStr} 
                                    className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-100 hover:shadow-md transition cursor-pointer"
                                    onClick={() => {
                                        setSelectedDay(dateStr);
                                        setEventText(event);
                                    }}
                                >
                                    <div className="font-semibold text-rose-700 text-sm mb-1">
                                        {date.toLocaleDateString('bg-BG', { 
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-gray-700 text-sm line-clamp-2">{event}</div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-100">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-rose-700">
                                    {Object.keys(events).length}
                                </div>
                                <div className="text-sm text-rose-600 font-medium">
                                    Общо събития
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* event modal */}
            {selectedDay && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl transform transition-all">
                        <h3 className="text-2xl font-bold mb-6 text-gray-800">
                            📝 Събитие за {selectedDay}
                        </h3>
                        <textarea
                            value={eventText}
                            onChange={(e) => setEventText(e.target.value)}
                            placeholder="Опишете събитието..."
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 h-32 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition"
                        />
                        <div className="flex justify-end gap-3">
                            {events[selectedDay] && (
                                <button
                                    onClick={handleDeleteEvent}
                                    className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
                                >
                                    🗑️ Изтрий
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setSelectedDay(null);
                                    setEventText("");
                                }}
                                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
                            >
                                Откажи
                            </button>
                            <button
                                onClick={handleSaveEvent}
                                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-600 hover:from-rose-700 hover:to-rose-700 text-white rounded-lg font-medium transition shadow-lg"
                            >
                                ✓ Запази
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};