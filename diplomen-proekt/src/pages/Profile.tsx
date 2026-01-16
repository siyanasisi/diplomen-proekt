import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router-dom";

export const Profile = () => {
    const { user, role, signOut } = useAuth();
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

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || (role === 'teacher' ? 'Учител' : 'Студент');
    const memberSince = new Date(user.created_at).toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' });
    const roleLabel = role === 'student' ? 'Ученик' : role === 'teacher' ? 'Учител' : null;
    const userMetadata = user.user_metadata as any;
    const grade = userMetadata?.grade;
    const city = userMetadata?.city;
    const qualifications = userMetadata?.qualifications;

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#eef4f7' }}>
            {/* header with gradient */}
            <header className="relative overflow-hidden" style={{ backgroundColor: '#203b46' }}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#fb0473' }}></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#80cc33' }}></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-8">
                    <button
                        onClick={() => navigate("/home")}
                        className="text-white/80 hover:text-white flex items-center gap-2 mb-6 transition-colors text-sm font-medium group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Назад към начало</span>
                    </button>
                    <div className="flex items-center justify-between">
                        <h1 className="text-4xl font-bold text-white">Моят профил</h1>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <span className="text-xl">🔥</span>
                                <span className="text-lg font-bold text-white">{currentStreak}</span>
                                <span className="text-sm text-white/80">дни</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 -mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Card  */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl border" style={{ borderColor: '#dceaef' }}>
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                                <div className="relative">
                                    <div 
                                        className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl"
                                        style={{ 
                                            background: role === 'teacher' 
                                                ? 'linear-gradient(135deg, #fb0473 0%, #c9035c 100%)'
                                                : 'linear-gradient(135deg, #5094af 0%, #40768c 100%)'
                                        }}
                                    >
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#80cc33' }}>
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-bold" style={{ color: '#203b46' }}>{displayName}</h2>
                                        {roleLabel && (
                                            <span 
                                                className="px-3 py-1 text-xs font-bold rounded-full text-white"
                                                style={{ 
                                                    backgroundColor: role === 'teacher' ? '#fb0473' : '#5094af'
                                                }}
                                            >
                                                {roleLabel}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" style={{ color: '#5094af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm font-medium" style={{ color: '#40768c' }}>{user.email}</p>
                                        </div>
                                        {city && (
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4" style={{ color: '#5094af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <p className="text-sm" style={{ color: '#40768c' }}>
                                                    {city}
                                                    {role === 'student' && grade && ` • ${grade} клас`}
                                                </p>
                                            </div>
                                        )}
                                        {role === 'teacher' && qualifications && (
                                            <div className="flex items-start gap-2">
                                                <svg className="w-4 h-4 mt-0.5" style={{ color: '#5094af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                </svg>
                                                <p className="text-sm" style={{ color: '#40768c' }}>Квалификации: {qualifications}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" style={{ color: '#5094af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-xs" style={{ color: '#6c9370' }}>Член от {memberSince}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* stats grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-5 rounded-xl border-2 transition-all hover:scale-105" style={{ backgroundColor: '#f2faeb', borderColor: '#e6f5d6' }}>
                                    <div className="text-3xl mb-2">🔥</div>
                                    <div className="text-3xl font-bold mb-1" style={{ color: '#4d7a1f' }}>{currentStreak}</div>
                                    <div className="text-xs font-medium" style={{ color: '#66a329' }}>Текуща серия</div>
                                </div>
                                <div className="text-center p-5 rounded-xl border-2 transition-all hover:scale-105" style={{ backgroundColor: '#ffe6f1', borderColor: '#fecde3' }}>
                                    <div className="text-3xl mb-2">🏆</div>
                                    <div className="text-3xl font-bold mb-1" style={{ color: '#970245' }}>{longestStreak}</div>
                                    <div className="text-xs font-medium" style={{ color: '#c9035c' }}>Най-дълга серия</div>
                                </div>
                                <div className="text-center p-5 rounded-xl border-2 transition-all hover:scale-105" style={{ backgroundColor: '#eef4f7', borderColor: '#dceaef' }}>
                                    <div className="text-3xl mb-2">⭐</div>
                                    <div className="text-3xl font-bold mb-1" style={{ color: '#305969' }}>{earnedPoints}</div>
                                    <div className="text-xs font-medium" style={{ color: '#40768c' }}>Точки</div>
                                </div>
                                <div className="text-center p-5 rounded-xl border-2 transition-all hover:scale-105" style={{ backgroundColor: '#f0f4f1', borderColor: '#e2e9e2' }}>
                                    <div className="text-3xl mb-2">📝</div>
                                    <div className="text-3xl font-bold mb-1" style={{ color: '#415843' }}>{totalEvents}</div>
                                    <div className="text-xs font-medium" style={{ color: '#577559' }}>Събития</div>
                                </div>
                            </div>
                        </div>

                        {/* upcoming events */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl border" style={{ borderColor: '#dceaef' }}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-3" style={{ color: '#203b46' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ffe6f1' }}>
                                        <svg className="w-5 h-5" style={{ color: '#fb0473' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    Предстоящи събития
                                </h3>
                                <button
                                    onClick={() => navigate("/home")}
                                    className="text-sm font-semibold transition-colors flex items-center gap-1"
                                    style={{ color: '#5094af' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#40768c'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#5094af'}
                                >
                                    Виж всички
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {upcomingEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingEvents.map((event, index) => (
                                        <div 
                                            key={index} 
                                            className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] cursor-pointer"
                                            style={{ 
                                                backgroundColor: index % 2 === 0 ? '#f2faeb' : '#eef4f7',
                                                borderColor: index % 2 === 0 ? '#e6f5d6' : '#dceaef'
                                            }}
                                            onClick={() => navigate("/home")}
                                        >
                                            <div 
                                                className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shadow-lg"
                                                style={{ 
                                                    background: index % 2 === 0 
                                                        ? 'linear-gradient(135deg, #80cc33 0%, #66a329 100%)'
                                                        : 'linear-gradient(135deg, #5094af 0%, #40768c 100%)'
                                                }}
                                            >
                                                <div className="text-xs font-bold uppercase">{formatDate(event.date).split(' ')[1]}</div>
                                                <div className="text-2xl font-bold leading-none">{formatDate(event.date).split(' ')[0]}</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold mb-1" style={{ color: '#203b46' }}>{event.event_text}</p>
                                                <p className="text-xs" style={{ color: '#40768c' }}>{formatDate(event.date)}</p>
                                            </div>
                                            <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#5094af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f2faeb' }}>
                                        <svg className="w-8 h-8" style={{ color: '#80cc33' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium" style={{ color: '#40768c' }}>Няма предстоящи събития</p>
                                    <button
                                        onClick={() => navigate("/home")}
                                        className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
                                        style={{ backgroundColor: '#5094af' }}
                                    >
                                        Добави събитие
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* recent activity  */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl border" style={{ borderColor: '#dceaef' }}>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: '#203b46' }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f0f4f1' }}>
                                    <svg className="w-5 h-5" style={{ color: '#6c9370' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                Последна активност
                            </h3>

                            {recentActivity.length > 0 ? (
                                <div className="space-y-3">
                                    {recentActivity.map((event, index) => (
                                        <div 
                                            key={index} 
                                            className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.02]"
                                            style={{ 
                                                backgroundColor: '#f2faeb',
                                                borderColor: '#e6f5d6'
                                            }}
                                        >
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#80cc33' }}></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold mb-1" style={{ color: '#203b46' }}>{event.event_text}</p>
                                                <p className="text-xs" style={{ color: '#40768c' }}>{formatDate(event.date)}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f2faeb' }}>
                                                <svg className="w-5 h-5" style={{ color: '#80cc33' }} fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f0f4f1' }}>
                                        <svg className="w-8 h-8" style={{ color: '#6c9370' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium" style={{ color: '#40768c' }}>Все още няма активност</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* right column */}
                    <div className="space-y-6">
                        {/* quick actions */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl border" style={{ borderColor: '#dceaef' }}>
                            <h3 className="text-xl font-bold mb-6" style={{ color: '#203b46' }}>Бързи действия</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate("/home")}
                                    className="w-full px-5 py-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg"
                                    style={{ 
                                        background: 'linear-gradient(135deg, #5094af 0%, #40768c 100%)'
                                    }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Добави събитие
                                </button>
                                <button
                                    onClick={() => navigate("/home")}
                                    className="w-full px-5 py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all hover:scale-105 border-2"
                                    style={{ 
                                        backgroundColor: '#f2faeb',
                                        borderColor: '#e6f5d6',
                                        color: '#4d7a1f'
                                    }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Виж статистики
                                </button>
                            </div>
                        </div>

                        {/* account info  */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl border" style={{ borderColor: '#dceaef' }}>
                            <h3 className="text-xl font-bold mb-6" style={{ color: '#203b46' }}>Информация за акаунта</h3>
                            <div className="space-y-5">
                                <div className="p-4 rounded-xl" style={{ backgroundColor: '#eef4f7' }}>
                                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#40768c' }}>ИМЕЙЛ АДРЕС</label>
                                    <p className="text-sm font-semibold" style={{ color: '#203b46' }}>{user.email}</p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ backgroundColor: role === 'teacher' ? '#ffe6f1' : '#eef4f7' }}>
                                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#40768c' }}>РОЛЯ</label>
                                    {roleLabel ? (
                                        <span 
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full text-white"
                                            style={{ 
                                                backgroundColor: role === 'teacher' ? '#fb0473' : '#5094af'
                                            }}
                                        >
                                            {roleLabel}
                                        </span>
                                    ) : (
                                        <span className="text-sm" style={{ color: '#40768c' }}>Не е зададена</span>
                                    )}
                                </div>
                                {city && (
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f0f4f1' }}>
                                        <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#577559' }}>ГРАД</label>
                                        <p className="text-sm font-semibold" style={{ color: '#203b46' }}>
                                            {city}
                                            {role === 'student' && grade && ` • ${grade} клас`}
                                        </p>
                                    </div>
                                )}
                                {role === 'teacher' && qualifications && (
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f2faeb' }}>
                                        <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#66a329' }}>КВАЛИФИКАЦИИ</label>
                                        <p className="text-sm font-semibold" style={{ color: '#203b46' }}>{qualifications}</p>
                                    </div>
                                )}
                                <div className="p-4 rounded-xl" style={{ backgroundColor: '#f2faeb' }}>
                                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#66a329' }}>СТАТУС</label>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: '#80cc33' }}>
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Активен
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl" style={{ backgroundColor: '#eef4f7' }}>
                                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#40768c' }}>РЕГИСТРИРАН</label>
                                    <p className="text-sm font-semibold" style={{ color: '#203b46' }}>
                                        {new Date(user.created_at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* settings */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl border" style={{ borderColor: '#dceaef' }}>
                            <h3 className="text-xl font-bold mb-6" style={{ color: '#203b46' }}>Настройки</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-5 py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all hover:scale-105 border-2"
                                    style={{ 
                                        backgroundColor: '#f9ebeb',
                                        borderColor: '#f3d8d8',
                                        color: '#c43b3b'
                                    }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
