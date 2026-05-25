import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBrandLinkTarget } from "../hooks/useBrandLinkTarget";
import { supabase, ensureValidSession } from "../supabase-client";
import { AvatarImage } from "./AvatarImage";

type NavUserMetadata = {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
};

type NavbarMessageRow = {
    id: string;
    student_id: string;
    teacher_id: string;
    is_from_student: boolean;
    read_by_student_at: string | null;
    read_by_teacher_at: string | null;
};

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [hasStudyPlan, setHasStudyPlan] = useState<boolean | null>(null);
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string) => location.pathname === path;
    const { signOut, user, role, loading, currentUserProfile } = useAuth();
    const brandLinkTarget = useBrandLinkTarget();

    const studentNavLinks = [
        { to: "/home", label: "Начало", materialIcon: "home" },
        { to: "/home?tab=calendar", label: "Календар", materialIcon: "calendar_today" },
        { to: "/study", label: "Учене", materialIcon: "school" },
    ];

    const teacherNavLinks = [
        { to: "/home", label: "Начало", materialIcon: "home" },
        { to: "/study", label: "Учене", materialIcon: "school" },
        { to: "/find-teacher", label: "Намери учител", materialIcon: "person_search" },
    ];

    const navLinks = role === 'student' ? studentNavLinks : teacherNavLinks;
    const userMetadata = user?.user_metadata as NavUserMetadata | undefined;
    const fullName = (currentUserProfile?.first_name != null || currentUserProfile?.last_name != null)
        ? `${currentUserProfile?.first_name ?? ""} ${currentUserProfile?.last_name ?? ""}`.trim()
        : userMetadata?.full_name || (userMetadata?.first_name && userMetadata?.last_name ? `${userMetadata.first_name} ${userMetadata.last_name}` : null);
    const displayName = fullName || user?.email?.split('@')[0] || (role === 'teacher' ? 'Учител' : 'Ученик');
    const roleLabel = role === 'student' ? 'Ученик' : role === 'teacher' ? 'Учител' : null;
    const avatarUrl = currentUserProfile?.avatar_url ?? userMetadata?.avatar_url ?? null;

     useEffect(() => {
        const checkStudyPlan = async () => {
            if (role === 'student' && user) {
                try {
                    await ensureValidSession();
                    const { data, error } = await supabase
                        .from('study_plans')
                        .select('id')
                        .eq('user_id', user.id)
                        .limit(1)
                        .maybeSingle();

                    if (error) {
                        console.error('Error checking study plan:', error);
                        setHasStudyPlan(false);
                    } else {
                        setHasStudyPlan(!!data);
                    }
                } catch (error) {
                    console.error('Failed to check study plan:', error);
                    setHasStudyPlan(false);
                }
            } else {
                setHasStudyPlan(null);
            }
        };

        checkStudyPlan();
    }, [user, role, location.pathname]);
    const loadUnreadMessagesCount = useCallback(async () => {
        if (!user || !role) return;
        try {
            await ensureValidSession();
            const { data, error } = await supabase
                .from("messages")
                .select("id, student_id, teacher_id, is_from_student, read_by_student_at, read_by_teacher_at");

            if (error) {
                console.error("Error loading unread messages (navbar):", error);
                return;
            }

            if (!data || data.length === 0) {
                setUnreadMessagesCount(0);
                return;
            }

            const unreadCount = (data as NavbarMessageRow[]).filter((msg) => {
                if (role === "student") {
                    return msg.student_id === user.id && msg.is_from_student === false && !msg.read_by_student_at;
                }
                return msg.teacher_id === user.id && msg.is_from_student === true && !msg.read_by_teacher_at;
            }).length;

            setUnreadMessagesCount(unreadCount);
        } catch (error) {
            console.error("Failed to load unread messages count (navbar):", error);
        }
    }, [user, role]);

    // initial load + reload when user and role changes
    useEffect(() => {
        if (user && role) loadUnreadMessagesCount();
    }, [user, role, loadUnreadMessagesCount]);

    useEffect(() => {
        const onUnreadUpdated = () => {
            loadUnreadMessagesCount();
            setTimeout(() => loadUnreadMessagesCount(), 300);
        };
        window.addEventListener("chat-unread-updated", onUnreadUpdated);
        return () => window.removeEventListener("chat-unread-updated", onUnreadUpdated);
    }, [loadUnreadMessagesCount]);

    useEffect(() => {
        if (!user || !role) return;

        const channel = supabase
            .channel(`navbar-unread-messages-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                () => loadUnreadMessagesCount()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, role, loadUnreadMessagesCount]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    // Close mobile menu when route changes
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 h-16">
            <div className="h-full px-6">
                <div className="flex justify-between items-center h-16">
                    {/* logo + search */}
                    <div className="flex items-center gap-8">
                        <Link 
                            to={brandLinkTarget} 
                            className="flex items-center gap-2 group"
                        >
                            <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#7C3AED]/20 group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                                M
                            </div>
                            <span className="text-xl font-bold text-slate-900 hidden sm:block tracking-tight">
                                Матура<span className="text-[#7C3AED]">+</span>
                            </span>
                        </Link>
                        {!loading && user && role === 'student' && (
                            <Link 
                                to="/find-teacher"
                                className="hidden md:flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full border border-transparent hover:border-[#7C3AED]/30 transition-all"
                            >
                                <span className="material-icons-round text-[#7C3AED] text-sm">person_search</span>
                                <span className="text-sm text-slate-400 w-64">Намери учител...</span>
                            </Link>
                        )}
                    </div>

                    {/* desktop navigation */}
                    {!loading && user && (
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`hover:text-[#7C3AED] transition-colors flex items-center gap-1 ${
                                        isActive(link.to) ? 'text-[#7C3AED] font-semibold' : ''
                                    }`}
                                >
                                    <span className="material-icons-round text-[20px]">{link.materialIcon}</span>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* desktop auth  */}
                    <div className="hidden md:flex items-center gap-3">
                        {!loading && !user && (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                                >
                                    Вход
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                                >
                                    Регистрация
                                </Link>
                            </>
                        )}
                        {!loading && user && (
                            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                                <Link
                                    to="/chat"
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors relative"
                                    aria-label="Съобщения"
                                    title="Съобщения"
                                >
                                    <svg
                                        className="w-6 h-6 text-slate-700"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden
                                    >
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                    {unreadMessagesCount > 0 && (
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                    )}
                                </Link>
                                <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2.5 cursor-pointer group rounded-xl hover:bg-slate-50 transition-colors"
                                    style={{ padding: "0.375rem 0.625rem" }}
                                    aria-expanded={dropdownOpen}
                                    aria-haspopup="menu"
                                >
                                    <div className="relative shrink-0">
                                        <AvatarImage
                                            url={avatarUrl}
                                            fallback={
                                                <div className="w-9 h-9 bg-purple-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                            }
                                            className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-200"
                                            imgClassName="w-full h-full object-cover"
                                            alt={displayName}
                                        />
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" aria-hidden />
                                    </div>
                                    <div className="hidden lg:block text-left min-w-0">
                                        <p className="text-sm font-bold text-slate-900 leading-none truncate max-w-[10rem]">
                                            {displayName}
                                        </p>
                                        {roleLabel && (
                                            <p className="text-[10px] text-purple-700 uppercase font-bold tracking-wider mt-1">
                                                {roleLabel}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`material-icons-round text-slate-400 group-hover:text-purple-700 transition-all shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
                                        style={{ fontSize: "1.25rem" }}
                                    >
                                        expand_more
                                    </span>
                                </button>

                                {dropdownOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 mt-2 w-72 bg-white shadow-xl border border-slate-200 overflow-hidden z-50"
                                        style={{ borderRadius: "1rem" }}
                                    >
                                        <div
                                            className="border-b border-slate-100 bg-slate-50"
                                            style={{ padding: "1rem 1.125rem" }}
                                        >
                                            <p className="text-slate-900 truncate" style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
                                                {displayName}
                                            </p>
                                            <p className="text-slate-500 truncate" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                                                {user.email}
                                            </p>
                                            {roleLabel && (
                                                <span
                                                    className="inline-flex items-center mt-2 bg-purple-50 text-purple-700 border border-purple-100"
                                                    style={{
                                                        padding: "0.125rem 0.5rem",
                                                        borderRadius: "0.375rem",
                                                        fontSize: "0.6875rem",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {roleLabel}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ padding: "0.375rem" }}>
                                            <Link
                                                to="/profile"
                                                role="menuitem"
                                                className="flex items-center w-full text-slate-700 hover:bg-slate-50 transition-colors group rounded-lg"
                                                style={{ gap: "0.75rem", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600 }}
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <span
                                                    className="flex items-center justify-center bg-white border border-slate-100 text-slate-600 group-hover:border-slate-200 shrink-0"
                                                    style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem" }}
                                                >
                                                    <span className="material-icons" style={{ fontSize: "1.125rem" }}>person</span>
                                                </span>
                                                Моят профил
                                            </Link>
                                            <Link
                                                to="/settings"
                                                role="menuitem"
                                                className="flex items-center w-full text-slate-700 hover:bg-slate-50 transition-colors group rounded-lg"
                                                style={{ gap: "0.75rem", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600 }}
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <span
                                                    className="flex items-center justify-center bg-white border border-slate-100 text-slate-600 group-hover:border-slate-200 shrink-0"
                                                    style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem" }}
                                                >
                                                    <span className="material-icons" style={{ fontSize: "1.125rem" }}>settings</span>
                                                </span>
                                                Настройки
                                            </Link>
                                        </div>

                                        <div className="border-t border-slate-100" style={{ padding: "0.375rem" }}>
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    signOut();
                                                }}
                                                className="flex items-center w-full text-red-600 hover:bg-red-50 transition-colors group rounded-lg"
                                                style={{ gap: "0.75rem", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600 }}
                                            >
                                                <span
                                                    className="flex items-center justify-center bg-red-50 border border-red-100 text-red-600 group-hover:bg-red-100 shrink-0"
                                                    style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem" }}
                                                >
                                                    <span className="material-icons" style={{ fontSize: "1.125rem" }}>logout</span>
                                                </span>
                                                Изход
                                            </button>
                                        </div>
                                    </div>
                                )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* mobile menu button */}
                    <div className="md:hidden flex items-center gap-2">
                        {!loading && !user && (
                            <>
                                <Link
                                    to="/login"
                                    className="px-3 py-2 text-sm font-semibold text-slate-700"
                                >
                                    Вход
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold rounded-lg"
                                >
                                    Рег.
                                </Link>
                            </>
                        )}
                        {role === 'student' && hasStudyPlan === false && (
                                        <Link
                                            to="/study-plan/intro"
                                            className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-purple-500 via-purple-400 to-violet-500 hover:from-purple-400 hover:via-purple-300 hover:to-violet-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 active:scale-95"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Направи ми план</span>
                                        </Link>
                                    )}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 active:scale-95"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {menuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* mobile nav */}
                {menuOpen && !loading && (
                    <div className="md:hidden border-t border-slate-200/80 py-4 animate-in slide-in-from-top duration-200">
                        {user ? (
                            <>
                                <div className="space-y-1.5 mb-4">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                                isActive(link.to)
                                                    ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30'
                                                    : 'text-slate-700 hover:text-[#7C3AED] hover:bg-purple-50 active:scale-95'
                                            }`}
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <span className={`material-icons-round text-[20px] ${isActive(link.to) ? 'text-white' : 'text-inherit'}`}>{link.materialIcon}</span>
                                            <span>{link.label}</span>
                                        </Link>
                                    ))}
                                </div>
                                
                                <div className="pt-4 border-t border-slate-200 space-y-1.5">
                                    <div
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
                                    >
                                        <AvatarImage
                                            url={avatarUrl}
                                            fallback={
                                                <div className="w-9 h-9 bg-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                            }
                                            className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-200 shrink-0"
                                            imgClassName="w-full h-full object-cover"
                                            alt={displayName}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate">{displayName}</p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                            {roleLabel && (
                                                <span className="inline-flex mt-1 bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                    {roleLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <span className="material-icons text-slate-600" style={{ fontSize: "1.25rem" }}>person</span>
                                        Моят профил
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <span className="material-icons text-slate-600" style={{ fontSize: "1.25rem" }}>settings</span>
                                        Настройки
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            signOut();
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <span className="material-icons text-red-600" style={{ fontSize: "1.25rem" }}>logout</span>
                                        Изход
                                    </button>
                                </div>
                            </>
                        ) : !user && (
                            <div className="text-center py-4">
                                <p className="text-sm text-slate-600 mb-4">Влезте в акаунта си за достъп</p>
                                <div className="flex flex-col gap-2">
                                    <Link
                                        to="/login"
                                        className="px-4 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Вход
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-4 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold rounded-xl hover:from-rose-600 hover:to-rose-700 transition-colors"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Регистрация
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};