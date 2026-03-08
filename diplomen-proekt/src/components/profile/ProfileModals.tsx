interface ProfileModalsProps {
    showChangePassword: boolean;
    setShowChangePassword: (v: boolean) => void;
    currentPassword: string;
    setCurrentPassword: (v: string) => void;
    newPassword: string;
    setNewPassword: (v: string) => void;
    confirmPassword: string;
    setConfirmPassword: (v: string) => void;
    passwordError: string;
    setPasswordError: (v: string) => void;
    changingPassword: boolean;
    validatePassword: (p: string) => string;
    handleChangePassword: () => void;
    closeChangePassword: () => void;

    showDeleteAccount: boolean;
    setShowDeleteAccount: (v: boolean) => void;
    deletePassword: string;
    setDeletePassword: (v: string) => void;
    deleteConfirmText: string;
    setDeleteConfirmText: (v: string) => void;
    deletingAccount: boolean;
    handleDeleteAccount: () => void;
    closeDeleteAccount: () => void;

    editMode: boolean;
    setEditMode: (v: boolean) => void;
    role: string | null;
    editedFirstName: string;
    setEditedFirstName: (v: string) => void;
    editedLastName: string;
    setEditedLastName: (v: string) => void;
    editedCity: string;
    setEditedCity: (v: string) => void;
    editedQualifications: string;
    setEditedQualifications: (v: string) => void;
    editedHourlyRate: string;
    setEditedHourlyRate: (v: string) => void;
    editedPriceNote: string;
    setEditedPriceNote: (v: string) => void;
    editedOffersOnline: boolean;
    setEditedOffersOnline: (v: boolean) => void;
    editedDescription: string;
    setEditedDescription: (v: string) => void;
    priceNegotiable: boolean;
    setPriceNegotiable: (v: boolean) => void;
    loadingUpdate: boolean;
    handleUpdateProfile: () => void;
}

const INPUT =
    "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/15";

const INPUT_ERR =
    "w-full px-3.5 py-2.5 bg-red-50/40 border border-red-200 rounded-lg text-[0.8125rem] font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-400/15";

const INPUT_RED =
    "w-full px-3.5 py-2.5 bg-slate-50 border border-red-200 rounded-lg text-[0.8125rem] font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-400/15";

const LABEL = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

function CloseBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
            aria-label="Затвори"
        >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group select-none">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${checked ? "bg-purple-600" : "bg-slate-200"}`}
            >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[1.375rem]" : "translate-x-1"}`} />
            </button>
            <span className="text-[0.8125rem] text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{label}</span>
        </label>
    );
}

export function ProfileModals(props: ProfileModalsProps) {
    const {
        showChangePassword,
        currentPassword,
        setCurrentPassword,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        passwordError,
        setPasswordError,
        changingPassword,
        validatePassword,
        handleChangePassword,
        closeChangePassword,
        showDeleteAccount,
        deletePassword,
        setDeletePassword,
        deleteConfirmText,
        setDeleteConfirmText,
        deletingAccount,
        handleDeleteAccount,
        closeDeleteAccount,
        editMode,
        setEditMode,
        role,
        editedFirstName,
        setEditedFirstName,
        editedLastName,
        setEditedLastName,
        editedCity,
        setEditedCity,
        editedQualifications,
        setEditedQualifications,
        editedHourlyRate,
        setEditedHourlyRate,
        editedPriceNote,
        setEditedPriceNote,
        editedOffersOnline,
        setEditedOffersOnline,
        editedDescription,
        setEditedDescription,
        priceNegotiable,
        setPriceNegotiable,
        loadingUpdate,
        handleUpdateProfile,
    } = props;

    return (
        <>
            {/* ── Change password ── */}
            {showChangePassword && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="profile-modal-card bg-white rounded-2xl max-w-md w-full flex flex-col">
                        {/* header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                                    <span className="material-icons text-purple-600" style={{ fontSize: "1.125rem" }}>lock</span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 font-display">Смени парола</h3>
                            </div>
                            <CloseBtn onClick={closeChangePassword} disabled={changingPassword} />
                        </div>

                        <form
                            onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}
                            className="px-6 py-5 space-y-4"
                        >
                            {passwordError && (
                                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100">
                                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                    <p className="text-xs font-medium text-red-700 leading-relaxed">{passwordError}</p>
                                </div>
                            )}

                            <div>
                                <label className={LABEL}>Текуща парола</label>
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={INPUT} placeholder="Въведете текущата парола" required disabled={changingPassword} />
                            </div>

                            <div>
                                <label className={LABEL}>Нова парола</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(e.target.value ? validatePassword(e.target.value) : ""); }}
                                    className={passwordError && newPassword ? INPUT_ERR : INPUT}
                                    placeholder="Мин. 8 символа, главна буква, цифра, спец. символ"
                                    required disabled={changingPassword} minLength={8}
                                />
                                {!passwordError && newPassword && (
                                    <p className="mt-1.5 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        Отговаря на изискванията
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={LABEL}>Потвърди нова парола</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (e.target.value && e.target.value !== newPassword) setPasswordError("Паролите не съвпадат");
                                        else setPasswordError(validatePassword(newPassword));
                                    }}
                                    className={passwordError && confirmPassword && confirmPassword !== newPassword ? INPUT_ERR : INPUT}
                                    placeholder="Повтори новата парола"
                                    required disabled={changingPassword} minLength={8}
                                />
                                {confirmPassword && confirmPassword === newPassword && !passwordError && (
                                    <p className="mt-1.5 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        Паролите съвпадат
                                    </p>
                                )}
                            </div>
                        </form>

                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button type="button" onClick={closeChangePassword} disabled={changingPassword} className="flex-1 px-4 py-2.5 text-[0.8125rem] font-semibold text-slate-600 hover:bg-white rounded-xl border border-slate-200 transition-all disabled:opacity-50">
                                Откажи
                            </button>
                            <button type="button" onClick={handleChangePassword} disabled={changingPassword} className="flex-[1.5] px-4 py-2.5 text-[0.8125rem] font-semibold booking-btn-primary text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                                {changingPassword ? "Запазване..." : "Смени парола"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete account ── */}
            {showDeleteAccount && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="profile-modal-card bg-white rounded-2xl max-w-md w-full flex flex-col">
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                                    <span className="material-icons text-red-600" style={{ fontSize: "1.125rem" }}>delete_outline</span>
                                </div>
                                <h3 className="text-base font-bold text-red-700 font-display">Изтрий акаунт</h3>
                            </div>
                            <CloseBtn onClick={closeDeleteAccount} disabled={deletingAccount} />
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="p-3.5 rounded-lg bg-red-50 border border-red-100 space-y-2">
                                <p className="text-xs font-bold text-red-800">Внимание: Това действие е необратимо!</p>
                                <ul className="text-[11px] text-red-700/90 space-y-0.5 list-disc list-inside leading-relaxed">
                                    <li>Всички ваши събития ще бъдат изтрити</li>
                                    <li>Всички статистики ще бъдат загубени</li>
                                    <li>Профилната ви снимка ще бъде премахната</li>
                                    <li>Няма да можете да възстановите акаунта си</li>
                                </ul>
                            </div>

                            <div>
                                <label className={LABEL}>Потвърди с парола</label>
                                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className={INPUT_RED} placeholder="Въведете паролата си" required disabled={deletingAccount} />
                            </div>

                            <div>
                                <label className={LABEL}>
                                    Напишете <span className="text-red-600 normal-case">ИЗТРИЙ</span> за потвърждение
                                </label>
                                <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className={`${INPUT_RED} uppercase`} placeholder="ИЗТРИЙ" required disabled={deletingAccount} />
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button type="button" onClick={closeDeleteAccount} disabled={deletingAccount} className="flex-1 px-4 py-2.5 text-[0.8125rem] font-semibold text-slate-600 hover:bg-white rounded-xl border border-slate-200 transition-all disabled:opacity-50">
                                Откажи
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deletingAccount || deleteConfirmText !== "ИЗТРИЙ" || !deletePassword}
                                className="flex-[1.5] px-4 py-2.5 text-[0.8125rem] font-semibold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed delete-btn-primary"
                            >
                                {deletingAccount ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Изтриване...
                                    </span>
                                ) : "Изтрий завинаги"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit profile ── */}
            {editMode && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="profile-modal-card bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                        {/* header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                                    <span className="material-icons text-purple-600" style={{ fontSize: "1.125rem" }}>edit</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 font-display">Редактирай профил</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Променете вашите лични данни</p>
                                </div>
                            </div>
                            <CloseBtn onClick={() => setEditMode(false)} />
                        </div>

                        {/* body */}
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}
                            className="flex-1 min-h-0 overflow-y-auto"
                        >
                            {/* section: personal info */}
                            <div className="px-6 pt-5 pb-4 space-y-3.5">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-icons text-slate-400" style={{ fontSize: "1rem" }}>person</span>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Лична информация</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL}>Име</label>
                                        <input type="text" value={editedFirstName} onChange={(e) => setEditedFirstName(e.target.value)} className={INPUT} placeholder="Име" required />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Фамилия</label>
                                        <input type="text" value={editedLastName} onChange={(e) => setEditedLastName(e.target.value)} className={INPUT} placeholder="Фамилия" required />
                                    </div>
                                </div>

                                <div>
                                    <label className={LABEL}>Град</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-slate-400" style={{ fontSize: "1rem" }}>location_on</span>
                                        <input type="text" value={editedCity} onChange={(e) => setEditedCity(e.target.value)} className={`${INPUT} pl-9`} placeholder="напр. София" />
                                    </div>
                                </div>
                            </div>

                            {/* section: teacher qualifications & bio */}
                            {role === "teacher" && (
                                <div className="px-6 py-4 border-t border-slate-100 space-y-3.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-icons text-slate-400" style={{ fontSize: "1rem" }}>school</span>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Преподаване</p>
                                    </div>

                                    <div>
                                        <label className={LABEL}>Квалификации</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-slate-400" style={{ fontSize: "1rem" }}>workspace_premium</span>
                                            <input type="text" value={editedQualifications} onChange={(e) => setEditedQualifications(e.target.value)} className={`${INPUT} pl-9`} placeholder="Математика, Физика..." />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={LABEL}>Биография / Описание</label>
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            rows={4}
                                            className={`${INPUT} resize-y`}
                                            placeholder="Кратко представяне за учениците: опит, подход, за какво преподавате..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* section: price & online */}
                            {role === "teacher" && (
                                <div className="px-6 py-4 border-t border-slate-100 space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-icons text-slate-400" style={{ fontSize: "1rem" }}>payments</span>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Цена и онлайн уроци</p>
                                    </div>

                                    <Toggle checked={priceNegotiable} onChange={(v) => { setPriceNegotiable(v); if (v) setEditedHourlyRate(""); }} label="По договаряне" />

                                    {!priceNegotiable && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={LABEL}>Цена за час</label>
                                                <div className="relative">
                                                    <input type="number" min="0" step="0.01" value={editedHourlyRate} onChange={(e) => setEditedHourlyRate(e.target.value)} className={`${INPUT} pr-10`} placeholder="25" />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">лв.</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={LABEL}>Бележка (по избор)</label>
                                                <input type="text" value={editedPriceNote} onChange={(e) => setEditedPriceNote(e.target.value)} className={INPUT} placeholder="напр. пакет отстъпка" />
                                            </div>
                                        </div>
                                    )}

                                    <Toggle checked={editedOffersOnline} onChange={setEditedOffersOnline} label="Предлагам онлайн уроци" />
                                </div>
                            )}
                        </form>

                        {/* footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
                            <button type="button" onClick={() => setEditMode(false)} className="flex-1 px-4 py-2.5 text-[0.8125rem] font-semibold text-slate-600 hover:bg-white rounded-xl border border-slate-200 transition-all">
                                Откажи
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateProfile}
                                disabled={loadingUpdate}
                                className="flex-[1.5] px-4 py-2.5 text-[0.8125rem] font-semibold booking-btn-primary text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {loadingUpdate && <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {loadingUpdate ? "Запазване..." : "Запази промените"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
