interface ProfileSettingsProps {
    onChangePassword: () => void;
    onSignOut: () => void;
    onDeleteAccount: () => void;
}

export function ProfileSettings({ onChangePassword, onSignOut, onDeleteAccount }: ProfileSettingsProps) {
    return (
        <section>
            <h3 className="text-xl font-bold mb-4 text-slate-800 px-1">Настройки</h3>
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                    <button
                        onClick={onChangePassword}
                        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-[#6D28D9]/10 group-hover:text-[#6D28D9] transition-colors">
                                <span className="material-icons">lock</span>
                            </div>
                            <span className="font-bold text-slate-700">Смени парола</span>
                        </div>
                        <span className="material-icons text-slate-300">chevron_right</span>
                    </button>
                    <button
                        onClick={onSignOut}
                        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-[#6D28D9]/10 group-hover:text-[#6D28D9] transition-colors">
                                <span className="material-icons">logout</span>
                            </div>
                            <span className="font-bold text-slate-700">Изход от профил</span>
                        </div>
                        <span className="material-icons text-slate-300">chevron_right</span>
                    </button>
                    <button
                        onClick={onDeleteAccount}
                        className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <span className="material-icons">delete_outline</span>
                            </div>
                            <span className="font-bold text-red-600">Изтрий акаунт</span>
                        </div>
                    </button>
                </div>
            </div>
        </section>
    );
}
