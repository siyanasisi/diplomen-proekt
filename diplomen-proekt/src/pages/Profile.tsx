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

    useEffect(() => {
        if (user) {
            loadUserData();
        } else {
            navigate("/login");
        }
    }, [user, navigate]);

    const loadUserData = async () => {
        if (!user) return;

        // load user stats
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

        // load  total events count
        const { count } = await supabase
            .from('calendar_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        setTotalEvents(count || 0);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    if (!user) return null;

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Студент";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                    <button
                        onClick={() => navigate("/home")}
                        className="text-slate-600 hover:text-slate-900 flex items-center gap-2 mb-2 transition-colors text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Назад към начало</span>
                    </button>
                    <h1 className="text-2xl font-semibold text-slate-900">Моят профил</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/* personal info card */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 mb-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-white text-2xl font-semibold">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-lg font-medium text-slate-900">{displayName}</p>
                            <p className="text-sm text-slate-600">{user.email}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Регистриран: {new Date(user.created_at).toLocaleDateString('bg-BG')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* stats grid  */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">🔥</span>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">{currentStreak}</div>
                                <div className="text-xs text-slate-600">Текуща серия</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">🏆</span>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">{longestStreak}</div>
                                <div className="text-xs text-slate-600">Най-дълга серия</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">⭐</span>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">{earnedPoints}</div>
                                <div className="text-xs text-slate-600">Общо точки</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">📝</span>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">{totalEvents}</div>
                                <div className="text-xs text-slate-600">Общо събития</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* settings card */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Настройки</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Имейл адрес</label>
                            <input
                                type="email"
                                value={user.email || ""}
                                disabled
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <button
                                onClick={handleSignOut}
                                className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                            >
                                Изход
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
