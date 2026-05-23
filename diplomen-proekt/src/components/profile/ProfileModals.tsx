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

const INPUT_RED =
    "w-full px-3.5 py-2.5 bg-slate-50 border border-red-200 rounded-lg text-[0.8125rem] font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-400/15";

const LABEL = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";


const MODAL_LABEL = "block text-slate-700 text-[0.8125rem] font-semibold mb-1.5";
const MODAL_INPUT =
    "w-full border border-slate-200 focus:border-purple-500 text-slate-700 placeholder-slate-400 outline-none text-sm font-medium";
const MODAL_TEXTAREA = `${MODAL_INPUT} resize-y`;

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
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto"
                    style={{ padding: "1.5rem" }}
                    onClick={() => !changingPassword && closeChangePassword()}
                >
                    <div
                        className="bg-white w-full shadow-xl"
                        style={{ maxWidth: "36rem", borderRadius: "1rem", margin: "2rem 0" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleChangePassword();
                            }}
                            style={{ padding: "2rem" }}
                        >
                            <div style={{ marginBottom: "1.5rem" }}>
                                <div
                                    className="flex items-center justify-between"
                                    style={{ marginBottom: "0.75rem" }}
                                >
                                    <h3
                                        className="text-slate-900"
                                        style={{
                                            fontSize: "1.25rem",
                                            fontWeight: 700,
                                            letterSpacing: "-0.01em",
                                        }}
                                    >
                                        Смени парола
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={closeChangePassword}
                                        disabled={changingPassword}
                                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40"
                                        style={{ padding: "0.375rem", borderRadius: "0.5rem" }}
                                        aria-label="Затвори"
                                    >
                                        <span className="material-icons" style={{ fontSize: "1.25rem" }}>
                                            close
                                        </span>
                                    </button>
                                </div>
                                <div
                                    className="flex items-center bg-slate-50 border border-slate-100"
                                    style={{
                                        gap: "0.5rem",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "0.5rem",
                                    }}
                                >
                                    <span
                                        className="material-icons text-purple-700"
                                        style={{ fontSize: "1rem" }}
                                    >
                                        lock
                                    </span>
                                    <span
                                        className="text-slate-700"
                                        style={{ fontSize: "0.875rem", fontWeight: 600 }}
                                    >
                                        Сигурност на акаунта
                                    </span>
                                </div>
                            </div>

                            {passwordError && (
                                <div
                                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 text-red-900 text-sm font-medium"
                                    style={{ padding: "0.75rem 0.875rem", marginBottom: "1rem" }}
                                    role="alert"
                                >
                                    <span
                                        className="material-icons shrink-0 text-red-600"
                                        style={{ fontSize: "1.125rem" }}
                                    >
                                        error_outline
                                    </span>
                                    <p className="leading-relaxed">{passwordError}</p>
                                </div>
                            )}

                            <div style={{ marginBottom: "0.75rem" }}>
                                <label className={MODAL_LABEL}>Текуща парола</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className={MODAL_INPUT}
                                    style={{ borderRadius: "0.625rem", padding: "0.75rem 0.875rem" }}
                                    placeholder="Въведете текущата парола"
                                    required
                                    disabled={changingPassword}
                                />
                            </div>

                            <div style={{ marginBottom: "0.75rem" }}>
                                <label className={MODAL_LABEL}>Нова парола</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setPasswordError(
                                            e.target.value ? validatePassword(e.target.value) : ""
                                        );
                                    }}
                                    className={`${MODAL_INPUT} ${
                                        passwordError && newPassword
                                            ? "border-red-300 focus:border-red-500"
                                            : ""
                                    }`}
                                    style={{ borderRadius: "0.625rem", padding: "0.75rem 0.875rem" }}
                                    placeholder="Мин. 8 символа, главна буква, цифра, спец. символ"
                                    required
                                    disabled={changingPassword}
                                    minLength={8}
                                />
                                {!passwordError && newPassword && (
                                    <p
                                        className="mt-1.5 text-emerald-600 flex items-center gap-1"
                                        style={{ fontSize: "0.6875rem", fontWeight: 600 }}
                                    >
                                        <span className="material-icons" style={{ fontSize: "0.875rem" }}>
                                            check_circle
                                        </span>
                                        Отговаря на изискванията
                                    </p>
                                )}
                            </div>

                            <div style={{ marginBottom: "1.5rem" }}>
                                <label className={MODAL_LABEL}>Потвърди нова парола</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (e.target.value && e.target.value !== newPassword) {
                                            setPasswordError("Паролите не съвпадат");
                                        } else {
                                            setPasswordError(validatePassword(newPassword));
                                        }
                                    }}
                                    className={`${MODAL_INPUT} ${
                                        passwordError &&
                                        confirmPassword &&
                                        confirmPassword !== newPassword
                                            ? "border-red-300 focus:border-red-500"
                                            : ""
                                    }`}
                                    style={{ borderRadius: "0.625rem", padding: "0.75rem 0.875rem" }}
                                    placeholder="Повтори новата парола"
                                    required
                                    disabled={changingPassword}
                                    minLength={8}
                                />
                                {confirmPassword &&
                                    confirmPassword === newPassword &&
                                    !passwordError && (
                                        <p
                                            className="mt-1.5 text-emerald-600 flex items-center gap-1"
                                            style={{ fontSize: "0.6875rem", fontWeight: 600 }}
                                        >
                                            <span
                                                className="material-icons"
                                                style={{ fontSize: "0.875rem" }}
                                            >
                                                check_circle
                                            </span>
                                            Паролите съвпадат
                                        </p>
                                    )}
                            </div>

                            <div className="flex items-center justify-end" style={{ gap: "0.5rem" }}>
                                <button
                                    type="button"
                                    onClick={closeChangePassword}
                                    disabled={changingPassword}
                                    className="text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                                    style={{
                                        padding: "0.5rem 1rem",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    Затвори
                                </button>
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        padding: "0.5rem 1rem",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                        gap: "0.375rem",
                                    }}
                                >
                                    {changingPassword ? (
                                        <span
                                            className="inline-block border-2 border-white border-t-transparent rounded-full animate-spin"
                                            style={{ width: "1rem", height: "1rem" }}
                                            aria-hidden
                                        />
                                    ) : (
                                        <span className="material-icons" style={{ fontSize: "1rem" }}>
                                            check
                                        </span>
                                    )}
                                    {changingPassword ? "Запазване..." : "Смени парола"}
                                </button>
                            </div>
                        </form>
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
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto"
                    style={{ padding: "1.5rem" }}
                    onClick={() => !loadingUpdate && setEditMode(false)}
                >
                    <div
                        className="bg-white w-full shadow-xl max-h-[min(90vh,calc(100vh-3rem))] flex flex-col overflow-hidden"
                        style={{ maxWidth: "36rem", borderRadius: "1rem", margin: "2rem 0" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateProfile();
                            }}
                            className="flex flex-col flex-1 min-h-0 overflow-y-auto"
                            style={{ padding: "2rem" }}
                        >
                            <div style={{ marginBottom: "1.5rem" }}>
                                <div
                                    className="flex items-center justify-between"
                                    style={{ marginBottom: "0.75rem" }}
                                >
                                    <h3
                                        className="text-slate-900"
                                        style={{
                                            fontSize: "1.25rem",
                                            fontWeight: 700,
                                            letterSpacing: "-0.01em",
                                        }}
                                    >
                                        Редактирай профил
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setEditMode(false)}
                                        disabled={loadingUpdate}
                                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40"
                                        style={{ padding: "0.375rem", borderRadius: "0.5rem" }}
                                        aria-label="Затвори"
                                    >
                                        <span className="material-icons" style={{ fontSize: "1.25rem" }}>
                                            close
                                        </span>
                                    </button>
                                </div>
                                <div
                                    className="flex items-center bg-slate-50 border border-slate-100"
                                    style={{
                                        gap: "0.5rem",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "0.5rem",
                                    }}
                                >
                                    <span
                                        className="material-icons text-purple-700"
                                        style={{ fontSize: "1rem" }}
                                    >
                                        {role === "teacher" ? "school" : "person"}
                                    </span>
                                    <span
                                        className="text-slate-700"
                                        style={{ fontSize: "0.875rem", fontWeight: 600 }}
                                    >
                                        {role === "teacher" ? "Учител" : "Ученик"}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginBottom: "1.5rem" }}>
                                <p
                                    className="text-slate-500"
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        marginBottom: "0.75rem",
                                    }}
                                >
                                    Лична информация
                                </p>
                                <div className="grid grid-cols-2 gap-3" style={{ marginBottom: "0.75rem" }}>
                                    <div>
                                        <label className={MODAL_LABEL}>Име</label>
                                        <input
                                            type="text"
                                            value={editedFirstName}
                                            onChange={(e) => setEditedFirstName(e.target.value)}
                                            className={MODAL_INPUT}
                                            style={{ borderRadius: "0.625rem", padding: "0.75rem 0.875rem" }}
                                            placeholder="Име"
                                            required
                                            disabled={loadingUpdate}
                                        />
                                    </div>
                                    <div>
                                        <label className={MODAL_LABEL}>Фамилия</label>
                                        <input
                                            type="text"
                                            value={editedLastName}
                                            onChange={(e) => setEditedLastName(e.target.value)}
                                            className={MODAL_INPUT}
                                            style={{ borderRadius: "0.625rem", padding: "0.75rem 0.875rem" }}
                                            placeholder="Фамилия"
                                            required
                                            disabled={loadingUpdate}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={MODAL_LABEL}>Град</label>
                                    <input
                                        type="text"
                                        value={editedCity}
                                        onChange={(e) => setEditedCity(e.target.value)}
                                        className={MODAL_INPUT}
                                        style={{ borderRadius: "0.625rem", padding: "0.75rem 0.875rem" }}
                                        placeholder="напр. София"
                                        disabled={loadingUpdate}
                                    />
                                </div>
                            </div>

                            {role === "teacher" && (
                                <div style={{ marginBottom: "1.5rem" }}>
                                    <p
                                        className="text-slate-500"
                                        style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            marginBottom: "0.75rem",
                                        }}
                                    >
                                        Преподаване
                                    </p>
                                    <div style={{ marginBottom: "0.75rem" }}>
                                        <label className={MODAL_LABEL}>Квалификации</label>
                                        <input
                                            type="text"
                                            value={editedQualifications}
                                            onChange={(e) => setEditedQualifications(e.target.value)}
                                            className={MODAL_INPUT}
                                            style={{ borderRadius: "0.625rem", padding: "0.75rem 0.875rem" }}
                                            placeholder="Математика, Физика..."
                                            disabled={loadingUpdate}
                                        />
                                    </div>
                                    <div>
                                        <label className={MODAL_LABEL}>Биография / описание</label>
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            className={MODAL_TEXTAREA}
                                            style={{
                                                borderRadius: "0.625rem",
                                                padding: "0.875rem",
                                                minHeight: "6.5rem",
                                            }}
                                            placeholder="Кратко представяне за учениците..."
                                            disabled={loadingUpdate}
                                        />
                                    </div>
                                </div>
                            )}

                            {role === "teacher" && (
                                <div style={{ marginBottom: "1.5rem" }}>
                                    <p
                                        className="text-slate-500"
                                        style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            marginBottom: "0.75rem",
                                        }}
                                    >
                                        Цена и онлайн уроци
                                    </p>
                                    <div
                                        className="flex flex-col border border-slate-100 bg-slate-50/80"
                                        style={{
                                            gap: "0.875rem",
                                            padding: "0.875rem",
                                            borderRadius: "0.75rem",
                                            marginBottom: "0.75rem",
                                        }}
                                    >
                                        <Toggle
                                            checked={priceNegotiable}
                                            onChange={(v) => {
                                                setPriceNegotiable(v);
                                                if (v) setEditedHourlyRate("");
                                            }}
                                            label="По договаряне"
                                        />
                                        <Toggle
                                            checked={editedOffersOnline}
                                            onChange={setEditedOffersOnline}
                                            label="Предлагам онлайн уроци"
                                        />
                                    </div>
                                    {!priceNegotiable && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={MODAL_LABEL}>Цена за час</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editedHourlyRate}
                                                        onChange={(e) => setEditedHourlyRate(e.target.value)}
                                                        className={`${MODAL_INPUT} pr-10`}
                                                        style={{
                                                            borderRadius: "0.625rem",
                                                            padding: "0.75rem 0.875rem",
                                                        }}
                                                        placeholder="25"
                                                        disabled={loadingUpdate}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                        лв.
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={MODAL_LABEL}>Бележка</label>
                                                <input
                                                    type="text"
                                                    value={editedPriceNote}
                                                    onChange={(e) => setEditedPriceNote(e.target.value)}
                                                    className={MODAL_INPUT}
                                                    style={{
                                                        borderRadius: "0.625rem",
                                                        padding: "0.75rem 0.875rem",
                                                    }}
                                                    placeholder="по избор"
                                                    disabled={loadingUpdate}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end" style={{ gap: "0.5rem" }}>
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    disabled={loadingUpdate}
                                    className="text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                                    style={{
                                        padding: "0.5rem 1rem",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    Затвори
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingUpdate}
                                    className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        padding: "0.5rem 1rem",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                        gap: "0.375rem",
                                    }}
                                >
                                    {loadingUpdate ? (
                                        <span
                                            className="inline-block border-2 border-white border-t-transparent rounded-full animate-spin"
                                            style={{ width: "1rem", height: "1rem" }}
                                            aria-hidden
                                        />
                                    ) : (
                                        <span className="material-icons" style={{ fontSize: "1rem" }}>
                                            check
                                        </span>
                                    )}
                                    {loadingUpdate ? "Запазване..." : "Запази"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
