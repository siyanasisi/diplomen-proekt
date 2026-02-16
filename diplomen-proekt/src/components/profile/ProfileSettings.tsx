interface ProfileSettingsProps {
    onChangePassword: () => void;
    onSignOut: () => void;
    onDeleteAccount: () => void;
}

export function ProfileSettings({ onChangePassword, onSignOut, onDeleteAccount }: ProfileSettingsProps) {
    const items = [
        { label: "Смени парола", icon: "lock", onClick: onChangePassword, danger: false },
        { label: "Изход от профил", icon: "logout", onClick: onSignOut, danger: false },
        { label: "Изтрий акаунт", icon: "delete_outline", onClick: onDeleteAccount, danger: true },
    ];

    return (
        <section>
            <h3 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.75rem' }}>Настройки</h3>
            <div className="bg-white border border-slate-200 overflow-hidden divide-y divide-slate-100" style={{ borderRadius: '1rem' }}>
                {items.map((item) => (
                    <button
                        key={item.label}
                        onClick={item.onClick}
                        className={`w-full flex items-center transition-colors group ${item.danger ? "hover:bg-red-50" : "hover:bg-slate-50"}`}
                        style={{ padding: '1rem 1.25rem', gap: '1rem' }}
                    >
                        <div
                            className={`flex items-center justify-center shrink-0 transition-colors ${
                                item.danger
                                    ? "bg-red-50 text-red-600 group-hover:bg-red-100"
                                    : "bg-slate-50 text-slate-500 group-hover:bg-purple-50 group-hover:text-purple-700"
                            }`}
                            style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem' }}
                        >
                            <span className="material-icons" style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                        </div>
                        <span className={`flex-1 text-left ${item.danger ? "text-red-600" : "text-slate-700"}`} style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                            {item.label}
                        </span>
                        {!item.danger && (
                            <span className="material-icons text-slate-300 group-hover:text-purple-700 transition-colors" style={{ fontSize: '1.125rem' }}>chevron_right</span>
                        )}
                    </button>
                ))}
            </div>
        </section>
    );
}
