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
            <h3 className="text-slate-900" style={{ fontSize: "1.0625rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                Акаунт и сигурност
            </h3>
            <div
                className="bg-white border border-slate-200 overflow-hidden"
                style={{ borderRadius: "1rem" }}
            >
                <div style={{ padding: "0.375rem" }}>
                    {items.map((item, index) => (
                        <div key={item.label}>
                            {index > 0 && item.danger && (
                                <div className="border-t border-slate-100 mx-2" />
                            )}
                            <button
                                type="button"
                                onClick={item.onClick}
                                className={`w-full flex items-center rounded-lg transition-colors group ${
                                    item.danger ? "hover:bg-red-50" : "hover:bg-slate-50"
                                }`}
                                style={{ gap: "0.75rem", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600 }}
                            >
                                <span
                                    className={`flex items-center justify-center shrink-0 border ${
                                        item.danger
                                            ? "bg-red-50 border-red-100 text-red-600 group-hover:bg-red-100"
                                            : "bg-white border-slate-100 text-slate-600 group-hover:border-slate-200"
                                    }`}
                                    style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem" }}
                                >
                                    <span className="material-icons" style={{ fontSize: "1.125rem" }}>
                                        {item.icon}
                                    </span>
                                </span>
                                <span className={`flex-1 text-left ${item.danger ? "text-red-600" : "text-slate-700"}`}>
                                    {item.label}
                                </span>
                                {!item.danger && (
                                    <span
                                        className="material-icons text-slate-300 group-hover:text-purple-700 transition-colors shrink-0"
                                        style={{ fontSize: "1.125rem" }}
                                    >
                                        chevron_right
                                    </span>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
