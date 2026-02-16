interface ProfileQuickActionsProps {
    role: string | null;
    onAddEvent: () => void;
    onViewStats: () => void;
}

export function ProfileQuickActions({ role, onAddEvent, onViewStats }: ProfileQuickActionsProps) {
    return (
        <section>
            <h3 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '1rem' }}>Бързи действия</h3>
            <div className="flex flex-col" style={{ gap: '0.75rem' }}>
                <button
                    onClick={onAddEvent}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center transition-colors"
                    style={{ gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}
                >
                    <span className="material-icons" style={{ fontSize: '1.25rem' }}>add_circle</span>
                    Добави събитие
                </button>
                {role === "student" && (
                    <button
                        onClick={onViewStats}
                        className="w-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors"
                        style={{ gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}
                    >
                        <span className="material-icons" style={{ fontSize: '1.25rem' }}>analytics</span>
                        Виж статистики
                    </button>
                )}
            </div>
        </section>
    );
}
