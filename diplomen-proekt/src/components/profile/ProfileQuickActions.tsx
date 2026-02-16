interface ProfileQuickActionsProps {
    role: string | null;
    onAddEvent: () => void;
    onViewStats: () => void;
}

export function ProfileQuickActions({ role, onAddEvent, onViewStats }: ProfileQuickActionsProps) {
    return (
        <section>
            <h3 className="text-xl font-bold mb-4 text-slate-800">Бързи действия</h3>
            <div className="space-y-3">
                <button
                    onClick={onAddEvent}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-purple-700 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-700/25"
                >
                    <span className="material-icons">add</span>
                    Добави събитие
                </button>
                {role === "student" && (
                    <button
                        onClick={onViewStats}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                    >
                        <span className="material-icons">analytics</span>
                        Виж статистики
                    </button>
                )}
            </div>
        </section>
    );
}
