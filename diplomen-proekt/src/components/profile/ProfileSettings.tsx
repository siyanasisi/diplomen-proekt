interface ProfileSettingsProps {
    onChangePassword: () => void;
    onSignOut: () => void;
    onDeleteAccount: () => void;
    variant?: "default" | "teacher";
}

export function ProfileSettings({ onChangePassword, onSignOut, onDeleteAccount, variant = "default" }: ProfileSettingsProps) {
    const isTeacher = variant === "teacher";

    if (isTeacher) {
        return (
            <section className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2">Настройки</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                    <button
                        onClick={onChangePassword}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#6D28D9] group-hover:text-white transition-colors">
                                <span className="material-icons text-lg">vpn_key</span>
                            </div>
                            <span className="font-bold text-sm">Смени парола</span>
                        </div>
                        <span className="material-icons text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                    <button
                        onClick={onSignOut}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#6D28D9] group-hover:text-white transition-colors">
                                <span className="material-icons text-lg">logout</span>
                            </div>
                            <span className="font-bold text-sm">Изход от профил</span>
                        </div>
                        <span className="material-icons text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                    <button
                        onClick={onDeleteAccount}
                        className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 transition-colors group rounded-b-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                <span className="material-icons text-lg">delete_forever</span>
                            </div>
                            <span className="font-bold text-sm text-red-600">Изтрий акаунт</span>
                        </div>
                        <span className="material-icons text-red-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                </div>
            </section>
        );
    }

    return (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-10 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                    Настройки
                </h3>
                <div className="space-y-5">
                    <button
                        onClick={onChangePassword}
                        className="w-full px-8 py-5 bg-gradient-to-br from-white via-slate-50 to-white hover:from-purple-50 hover:via-purple-100/50 hover:to-purple-50 text-slate-700 hover:text-purple-900 rounded-2xl font-bold transition-all duration-700 flex items-center justify-center gap-3 text-base border-2 border-slate-200/60 hover:border-purple-300/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20 group/btn"
                    >
                        <svg
                            className="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                        </svg>
                        Смени парола
                    </button>
                    <button
                        onClick={onSignOut}
                        className="w-full px-8 py-5 bg-gradient-to-br from-white via-slate-50 to-white hover:from-slate-100 hover:via-slate-50 hover:to-slate-100 text-slate-700 rounded-2xl font-bold transition-all duration-700 flex items-center justify-center gap-3 text-base border-2 border-slate-200/60 hover:border-slate-300/60 hover:-translate-y-2 hover:shadow-2xl group/btn"
                    >
                        <svg
                            className="w-6 h-6 group-hover/btn:-translate-x-1 transition-transform duration-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        Изход от профил
                    </button>
                </div>

                <div className="mt-10 pt-10 border-t-2 border-gradient-to-r from-transparent via-red-200/40 to-transparent">
                    <button
                        onClick={onDeleteAccount}
                        className="w-full px-8 py-5 rounded-2xl font-black text-sm text-white transition-all duration-700 flex items-center justify-center gap-3 shadow-2xl hover:shadow-red-900/40 hover:scale-110 bg-gradient-to-r from-red-600 via-red-700 via-red-800 to-red-600 hover:from-red-700 hover:via-red-900 hover:to-red-700 group/btn relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                        <svg
                            className="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-500 relative z-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                        <span className="relative z-10">Изтрий акаунт</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
