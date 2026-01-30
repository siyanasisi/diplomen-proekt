import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase, ensureValidSession } from "../supabase-client";

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navLinks = [
        { 
            to: "/home", 
            label: "Начало", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        { 
            to: "/calendar", 
            label: "Календар", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        { 
            to: "/study", 
            label: "Учене", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            )
        },
        { 
            to: "/find-teacher", 
            label: "Намери учител", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM17 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ];

    const isActive = (path: string) => location.pathname === path;
    const { signOut, user, role, loading } = useAuth();
    const userMetadata = user?.user_metadata as any;
    const fullName = userMetadata?.full_name || (userMetadata?.first_name && userMetadata?.last_name ? `${userMetadata.first_name} ${userMetadata.last_name}` : null);
    const displayName = fullName || user?.email?.split('@')[0] || (role === 'teacher' ? 'Учител' : 'Студент');
    const roleLabel = role === 'student' ? 'Ученик' : role === 'teacher' ? 'Учител' : null;
    const avatarUrl = userMetadata?.avatar_url || null;

    // load unread messages count
    const loadUnreadMessagesCount = async () => {
        if (!user || !role) return;
        
        try {
            await ensureValidSession();
            
            const { data, error } = await supabase
                .from("messages")
                .select("*");

            if (error) {
                console.error("Error loading unread messages (navbar):", error);
                return;
            }

            if (!data || data.length === 0) {
                setUnreadMessagesCount(0);
                return;
            }

            const unreadCount = data.filter((msg: any) => {
                if (!msg.read_at) {
                    if (role === "student") {
                        return msg.student_id === user.id && msg.is_from_student === false;
                    } else {
                        return msg.teacher_id === user.id && msg.is_from_student === true;
                    }
                }
                return false;
            }).length;

            setUnreadMessagesCount(unreadCount);
        } catch (error) {
            console.error("Failed to load unread messages count (navbar):", error);
        }
    };

    // initial load + reload when user and role changes
    useEffect(() => {
        if (user && role) {
            loadUnreadMessagesCount();
        }
    }, [user, role]);

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
                () => {
                    loadUnreadMessagesCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, role]);

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
        <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 shadow-sm shadow-slate-900/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link 
                        to={user ? "/home" : "/"} 
                        className="flex items-center gap-2.5 group"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:shadow-xl group-hover:shadow-slate-900/30 transition-all duration-300 group-hover:scale-105">
                                <span className="text-white text-lg font-bold">М</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                        </div>
                        <span className="text-xl font-bold text-slate-900 hidden sm:block tracking-tight">
                            Матура<span className="text-rose-600">+</span>
                        </span>
                    </Link>

                    {/* desktop navigation */}
                    {!loading && user && (
                        <div className="hidden md:flex items-center gap-1.5">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                                        isActive(link.to)
                                            ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20 scale-105'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95'
                                    }`}
                                >
                                    <span className={isActive(link.to) ? 'text-white' : 'text-slate-500'}>{link.icon}</span>
                                    <span>{link.label}</span>
                                    {isActive(link.to) && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                                    )}
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
                                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-500/30 hover:shadow-lg hover:shadow-rose-500/40 transition-all duration-200 hover:scale-105 active:scale-100"
                                >
                                    Регистрация
                                </Link>
                            </>
                        )}
                        {!loading && user && (
                            <>
                                <Link
                                    to="/chat"
                                    className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200 active:scale-95"
                                >
                                    <svg className="w-6 h-6 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    {unreadMessagesCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-rose-500/40">
                                            {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                                        </span>
                                    )}
                                </Link>
                                <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100/80 transition-all duration-200 active:scale-95"
                                >
                                    <div className="relative">
                                        {avatarUrl ? (
                                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md ring-2 ring-white">
                                                <img 
                                                    src={avatarUrl} 
                                                    alt={displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md">
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900 max-w-[140px] truncate">
                                        {displayName}
                                    </span>
                                    <svg 
                                        className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* dropdown menu */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/80 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                                            <p className="text-sm font-bold text-slate-900">{displayName}</p>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                                            {roleLabel && (
                                                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                                    {roleLabel}
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors group"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <div className="w-8 h-8 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors">
                                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            Моят профил
                                        </Link>
                                        <Link
                                            to="/settings"
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors group"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <div className="w-8 h-8 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors">
                                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            Настройки
                                        </Link>
                                        <div className="border-t border-slate-100 mt-1 pt-1">
                                            <button
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    signOut();
                                                }}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors group"
                                            >
                                                <div className="w-8 h-8 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                </div>
                                                Изход
                                            </button>
                                        </div>
                                    </div>
                                )}
                                </div>
                            </>
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
                                                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg'
                                                    : 'text-slate-700 hover:bg-slate-100 active:scale-95'
                                            }`}
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <span className={isActive(link.to) ? 'text-white' : 'text-slate-500'}>{link.icon}</span>
                                            <span>{link.label}</span>
                                        </Link>
                                    ))}
                                </div>
                                
                                <div className="pt-4 border-t border-slate-200 space-y-1.5">
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors active:scale-95"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {avatarUrl ? (
                                            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md ring-2 ring-white">
                                                <img 
                                                    src={avatarUrl} 
                                                    alt={displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-9 h-9 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold">{displayName}</p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            signOut();
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors active:scale-95"
                                    >
                                        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        </div>
                                        <span>Изход</span>
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