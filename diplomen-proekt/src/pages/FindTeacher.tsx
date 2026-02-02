import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AvatarImage } from "../components/AvatarImage";
import type { Teacher } from "../types/teacher";

type SortOption = "rating" | "name" | "online_first";

export const FindTeacher = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const showToast = useToast();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedRating, setSelectedRating] = useState<number>(0);
    const [isOnlineOnly, setIsOnlineOnly] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<SortOption>("rating");

    const subjects = [
        "Български език и литература",
        "Математика",
        "Английски език",
        "История",
        "География",
        "Биология",
        "Химия",
        "Физика",
        "Информатика",
        "Философия",
        "Икономика",
        "Право"
    ];

    useEffect(() => {
        loadTeachers();
    }, [user?.id]);

    const loadTeachers = async () => {
        try {
            // try to ensure session if user is logged in, but don't fail if not
            if (user) {
                await ensureValidSession();
            }

            let blockedUserIds = new Set<string>();
            if (user) {
                const { data: blockedData } = await supabase
                    .from('blocked_users')
                    .select('blocked_id')
                    .eq('blocker_id', user.id);
                if (blockedData) {
                    blockedUserIds = new Set(blockedData.map((r: { blocked_id: string }) => r.blocked_id));
                }
            }
            
            // fetch teachers from teacher_profiles table
            const { data, error } = await supabase
                .from('teacher_profiles')
                .select('*')
                .order('rating', { ascending: false }); 

            if (error) {
                console.error('Error loading teachers:', error);
                showToast('Списъкът с учители не можа да се зареди. Моля, опитайте отново по-късно.');
            } else if (data) {
                const list = user
                    ? data.filter((t: Teacher) => !blockedUserIds.has(t.user_id))
                    : data;
                setTeachers(list);
                setFilteredTeachers(list);
            } else {
                console.log('No teachers found in database');
            }
        } catch (error) {
            console.error('Failed to load teachers:', error);
            showToast('Списъкът с учители не можа да се зареди. Моля, опитайте отново по-късно.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...teachers];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(teacher =>
                teacher.full_name.toLowerCase().includes(query) ||
                teacher.subject.toLowerCase().includes(query) ||
                teacher.description.toLowerCase().includes(query)
            );
        }

        if (selectedSubject) {
            filtered = filtered.filter(teacher => teacher.subject === selectedSubject);
        }

        if (selectedCity) {
            if (selectedCity === "Онлайн") {
                filtered = filtered.filter(teacher => teacher.is_online);
            } else {
                filtered = filtered.filter(teacher => teacher.city === selectedCity);
            }
        }

        if (isOnlineOnly) {
            filtered = filtered.filter(teacher => teacher.is_online);
        }

        
        if (selectedRating > 0) {
            filtered = filtered.filter(teacher => teacher.rating >= selectedRating);
        }

        setFilteredTeachers(filtered);
    }, [searchQuery, selectedSubject, selectedCity, selectedRating, isOnlineOnly, teachers]);

    const sortedTeachers = useMemo(() => {
        const list = [...filteredTeachers];
        if (sortBy === "rating") {
            list.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === "name") {
            list.sort((a, b) => a.full_name.localeCompare(b.full_name, "bg"));
        } else if (sortBy === "online_first") {
            list.sort((a, b) => (a.is_online === b.is_online ? 0 : a.is_online ? -1 : 1));
        }
        return list;
    }, [filteredTeachers, sortBy]);

    const getUniqueCities = () => {
        const cities = teachers
            .filter(t => t.city)
            .map(t => t.city!)
            .filter((value, index, self) => self.indexOf(value) === index);
        return cities;
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <svg
                key={i}
                className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 border-2 border-purple-500/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-slate-700">Зареждане...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3 bg-gradient-to-r from-slate-900 via-purple-700 to-slate-900 bg-clip-text text-transparent">
                        Намери учител
                    </h1>
                    <p className="text-lg font-semibold text-slate-600">
                        Открийте идеалния учител за вашата подготовка
                    </p>
                </div>

                {/* filters and search */}
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-slate-900/5 border border-slate-200/80 mb-8">
                    {/* search */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Търсене
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Търсете по име или предмет..."
                                className="w-full px-4 py-3 pl-12 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
                            />
                            <svg
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* filters grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* subject filter */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Предмет
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-slate-700 font-medium bg-white"
                            >
                                <option value="">Всички предмети</option>
                                {subjects.map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* city filter */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Град / Онлайн
                            </label>
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-slate-700 font-medium bg-white"
                            >
                                <option value="">Всички локации</option>
                                <option value="Онлайн">Онлайн</option>
                                {getUniqueCities().map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* rating filter */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Минимален рейтинг
                            </label>
                            <select
                                value={selectedRating}
                                onChange={(e) => setSelectedRating(Number(e.target.value))}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-slate-700 font-medium bg-white"
                            >
                                <option value="0">Всички рейтинги</option>
                                <option value="4">4+ звезди</option>
                                <option value="4.5">4.5+ звезди</option>
                                <option value="5">5 звезди</option>
                            </select>
                        </div>

                        {/* online only */}
                        <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isOnlineOnly}
                                    onChange={(e) => setIsOnlineOnly(e.target.checked)}
                                    className="w-5 h-5 text-purple-600 border-2 border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                                />
                                <span className="text-sm font-semibold text-slate-700">
                                    Само онлайн
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* clear filters */}
                    {(selectedSubject || selectedCity || selectedRating > 0 || isOnlineOnly || searchQuery) && (
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedSubject("");
                                setSelectedCity("");
                                setSelectedRating(0);
                                setIsOnlineOnly(false);
                            }}
                            className="mt-4 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                        >
                            Изчисти филтрите
                        </button>
                    )}
                </div>

                {/* results count, sort and refresh */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-600">
                        Намерени: <span className="text-purple-700 font-bold">{filteredTeachers.length}</span> учители
                        {teachers.length > 0 && filteredTeachers.length !== teachers.length && (
                            <span className="text-slate-500 ml-2">
                                (от общо {teachers.length})
                            </span>
                        )}
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label htmlFor="sort-teachers" className="text-sm font-semibold text-slate-600 whitespace-nowrap">
                                Сортирай по:
                            </label>
                            <select
                                id="sort-teachers"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-slate-700 font-medium bg-white text-sm"
                            >
                                <option value="rating">Рейтинг</option>
                                <option value="name">Име</option>
                                <option value="online_first">Онлайн първо</option>
                            </select>
                        </div>
                        <button
                        onClick={() => {
                            setLoading(true);
                            loadTeachers();
                        }}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg 
                            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Обнови
                        </button>
                    </div>
                </div>

                {/* teachers grid */}
                {loading ? (
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-12 shadow-lg shadow-slate-900/5 border border-slate-200/80 text-center">
<div className="w-14 h-14 border-2 border-purple-500/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-slate-700">Зареждане на учители...</p>
                    </div>
                ) : filteredTeachers.length === 0 && teachers.length === 0 ? (
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-12 shadow-lg shadow-slate-900/5 border border-slate-200/80 text-center">
                        <div className="chat-empty-icon-wrap w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Няма учители в базата данни</h3>
                        <p className="text-slate-600 mb-4">Все още няма регистрирани учители в системата.</p>
                        <p className="text-sm text-slate-500">Учителите трябва да създадат профил, за да се покажат тук.</p>
                    </div>
                ) : filteredTeachers.length === 0 ? (
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-12 shadow-lg shadow-slate-900/5 border border-slate-200/80 text-center">
                        <div className="chat-empty-icon-wrap w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Няма намерени учители</h3>
                        <p className="text-slate-600 mb-4">Опитайте да промените филтрите си</p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedSubject("");
                                setSelectedCity("");
                                setSelectedRating(0);
                                setIsOnlineOnly(false);
                            }}
                            className="px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-500/25 transition-colors"
                        >
                            Изчисти филтрите
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedTeachers.map((teacher) => (
                            <div
                                key={teacher.id}
                                className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-slate-900/5 border border-slate-200/80 hover:shadow-xl hover:border-purple-200/60 hover:scale-[1.01] transition-all duration-300"
                            >
                                {/* profile picture and name */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="flex-shrink-0">
                                        <AvatarImage
                                            url={teacher.profile_picture}
                                            fallback={
                                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-purple-500/20">
                                                    {teacher.full_name.charAt(0).toUpperCase()}
                                                </div>
                                            }
                                            className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200/80"
                                            imgClassName="w-full h-full object-cover"
                                            alt={teacher.full_name}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">
                                            {teacher.full_name}
                                        </h3>
                                        <p className="text-sm font-semibold text-purple-700 mb-2">
                                            {teacher.subject}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {renderStars(Math.round(teacher.rating))}
                                            <span className="text-sm font-semibold text-slate-600 ml-1">
                                                {teacher.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* description */}
                                <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                                    {teacher.description}
                                </p>

                                {/* location/online badge */}
                                <div className="flex items-center gap-2 mb-4">
                                    {teacher.is_online && (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                            Онлайн
                                        </span>
                                    )}
                                    {teacher.city && (
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                            {teacher.city}
                                        </span>
                                    )}
                                </div>

                                {/* view profile button */}
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            navigate('/login');
                                        } else {
                                            navigate(`/teacher/${teacher.id}`);
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-100"
                                >
                                    Виж профил
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
