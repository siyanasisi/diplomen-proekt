import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router-dom";

export const Profile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            loadUserData();
        } else {
            navigate("/login");
        }
    }, [user, navigate]);

    const loadUserData = async () => {
        if (!user) return;

        // Load user stats
        const { data: statsData } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (statsData) {
            setCurrentStreak(statsData.current_streak || 0);
            setLongestStreak(statsData.longest_streak || 0);
            setEarnedPoints(statsData.earned_points || 0);
        }

        // Load events
        const { data: eventsData, count } = await supabase
            .from('calendar_events')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('date', { ascending: true });

        setTotalEvents(count || 0);

        if (eventsData) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get upcoming events
            const upcoming = eventsData
                .filter(event => {
                    const [year, month, day] = event.date.split('-').map(Number);
                    const eventDate = new Date(year, month - 1, day);
                    return eventDate >= today;
                })
                .slice(0, 3);

            setUpcomingEvents(upcoming);

            // Get recent activity
            const recent = eventsData
                .filter(event => {
                    const [year, month, day] = event.date.split('-').map(Number);
                    const eventDate = new Date(year, month - 1, day);
                    return eventDate < today;
                })
                .slice(-3)
                .reverse();

            setRecentActivity(recent);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
    };

    if (!user) return null;

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Студент";
    const memberSince = new Date(user.created_at).toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                    <button
                        onClick={() => navigate("/home")}
                        className="text-slate-600 hover:text-slate-900 flex items-center gap-2 mb-3 transition-colors text-sm font-medium group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Назад към начало</span>
                    </button>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-slate-900">Моят профил</h1>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                                <span className="text-base">🔥</span>
                                <span className="text-sm font-bold text-slate-900">{currentStreak}</span>
                                <span className="text-xs text-slate-600">дни</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
                                        <p className="text-sm text-slate-600">{user.email}</p>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Член от {memberSince}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* stats grid */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="text-3xl mb-1">🔥</div>
                                    <div className="text-2xl font-bold text-slate-900">{currentStreak}</div>
                                    <div className="text-xs text-slate-600 mt-1">Текуща серия</div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="text-3xl mb-1">🏆</div>
                                    <div className="text-2xl font-bold text-slate-900">{longestStreak}</div>
                                    <div className="text-xs text-slate-600 mt-1">Най-дълга серия</div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="text-3xl mb-1">⭐</div>
                                    <div className="text-2xl font-bold text-slate-900">{earnedPoints}</div>
                                    <div className="text-xs text-slate-600 mt-1">Точки</div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="text-3xl mb-1">📝</div>
                                    <div className="text-2xl font-bold text-slate-900">{totalEvents}</div>
                                    <div className="text-xs text-slate-600 mt-1">Събития</div>
                                </div>
                            </div>
                        </div>

                        {/* upcoming events */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Предстоящи събития
                                </h3>
                                <button
                                    onClick={() => navigate("/home")}
                                    className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
                                >
                                    Виж всички →
                                </button>
                            </div>

                            {upcomingEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingEvents.map((event, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white">
                                                <div className="text-xs font-medium">{formatDate(event.date).split(' ')[1]}</div>
                                                <div className="text-lg font-bold">{formatDate(event.date).split(' ')[0]}</div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900">{event.event_text}</p>
                                                <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm">Няма предстоящи събития</p>
                                </div>
                            )}
                        </div>

                        {/* recent activity */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Последна активност
                            </h3>

                            {recentActivity.length > 0 ? (
                                <div className="space-y-3">
                                    {recentActivity.map((event, index) => (
                                        <div key={index} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900">{event.event_text}</p>
                                                <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                                            </div>
                                            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm">Все още няма активност</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* right column */}
                    <div className="space-y-6">
                        {/* quick actions */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Бързи действия</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => navigate("/home")}
                                    className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Добави събитие
                                </button>
                                <button
                                    onClick={() => navigate("/home")}
                                    className="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-medium text-sm flex items-center justify-center gap-2 border border-slate-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Виж статистики
                                </button>
                            </div>
                        </div>

                        {/* account info */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Информация за акаунта</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">ИМЕЙЛ АДРЕС</label>
                                    <p className="text-sm text-slate-900 font-medium">{user.email}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">СТАТУС</label>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Активен
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">РЕГИСТРИРАН</label>
                                    <p className="text-sm text-slate-900 font-medium">
                                        {new Date(user.created_at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* settings */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Настройки</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-center gap-2 border border-red-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Изход от профил
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
