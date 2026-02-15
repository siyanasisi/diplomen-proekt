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

export function ProfileModals(props: ProfileModalsProps) {
    const {
        showChangePassword,
        setShowChangePassword,
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
        setShowDeleteAccount,
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
            {/* Change password modal */}
            {showChangePassword && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-10 max-w-lg w-full shadow-2xl shadow-purple-900/30 animate-in zoom-in-95 duration-500 border-2 border-purple-200/60 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-purple-50/20 pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                    Смени парола
                                </h3>
                                <button
                                    onClick={closeChangePassword}
                                    className="p-2.5 rounded-2xl hover:bg-slate-100 transition-all duration-300 hover:scale-110 hover:rotate-90 border-2 border-transparent hover:border-slate-200/60"
                                >
                                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleChangePassword();
                                }}
                                className="space-y-5"
                            >
                                {passwordError && (
                                    <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
                                        <p className="text-sm font-semibold text-red-700">{passwordError}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Текуща парола</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                        placeholder="Въведете текущата парола"
                                        required
                                        disabled={changingPassword}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Нова парола</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            setPasswordError(e.target.value ? validatePassword(e.target.value) : "");
                                        }}
                                        className={`w-full px-5 py-4 border-2 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 ${
                                            passwordError && newPassword ? "border-red-200 focus:border-red-300" : "border-slate-200 focus:border-purple-900"
                                        }`}
                                        placeholder="Минимум 8 символа, главна буква, малка буква, цифра, специален символ"
                                        required
                                        disabled={changingPassword}
                                        minLength={8}
                                    />
                                    {!passwordError && newPassword && (
                                        <p className="mt-2 text-xs text-emerald-600">✓ Паролата отговаря на изискванията</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Потвърди нова парола</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (e.target.value && e.target.value !== newPassword) {
                                                setPasswordError("Паролите не съвпадат");
                                            } else if (e.target.value && e.target.value === newPassword) {
                                                setPasswordError(validatePassword(newPassword));
                                            } else {
                                                setPasswordError(validatePassword(newPassword));
                                            }
                                        }}
                                        className={`w-full px-5 py-4 border-2 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 ${
                                            passwordError && confirmPassword && confirmPassword !== newPassword
                                                ? "border-red-200 focus:border-red-300"
                                                : "border-slate-200 focus:border-purple-900"
                                        }`}
                                        placeholder="Повтори новата парола"
                                        required
                                        disabled={changingPassword}
                                        minLength={8}
                                    />
                                    {confirmPassword && confirmPassword === newPassword && !passwordError && (
                                        <p className="mt-2 text-xs text-emerald-600">✓ Паролите съвпадат</p>
                                    )}
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeChangePassword}
                                        className="flex-1 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
                                        disabled={changingPassword}
                                    >
                                        Откажи
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        className="flex-1 px-6 py-3 text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {changingPassword ? "Запазване..." : "Смени парола"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete account modal */}
            {showDeleteAccount && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-10 max-w-lg w-full shadow-2xl shadow-red-900/30 animate-in zoom-in-95 duration-500 border-2 border-red-200/60 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-transparent to-red-50/20 pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-black text-red-900 tracking-tight">Изтрий акаунт</h3>
                                <button
                                    onClick={closeDeleteAccount}
                                    className="p-2.5 rounded-2xl hover:bg-slate-100 transition-all duration-300 hover:scale-110 hover:rotate-90 border-2 border-transparent hover:border-slate-200/60"
                                    disabled={deletingAccount}
                                >
                                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200">
                                    <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Внимание: Това действие е необратимо!</p>
                                    <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                                        <li>Всички ваши събития ще бъдат изтрити</li>
                                        <li>Всички статистики ще бъдат загубени</li>
                                        <li>Профилната ви снимка ще бъде премахната</li>
                                        <li>Няма да можете да възстановите акаунта си</li>
                                    </ul>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Потвърди с парола</label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="w-full px-5 py-4 border-2 border-red-200 focus:border-red-300 rounded-2xl text-base focus:ring-4 focus:ring-red-300/20 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                        placeholder="Въведете паролата си"
                                        required
                                        disabled={deletingAccount}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Напишете <span className="font-bold text-red-600">ИЗТРИЙ</span> за потвърждение
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        className="w-full px-5 py-4 border-2 border-red-200 focus:border-red-300 rounded-2xl text-base focus:ring-4 focus:ring-red-300/20 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 uppercase"
                                        placeholder="ИЗТРИЙ"
                                        required
                                        disabled={deletingAccount}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeDeleteAccount}
                                        className="flex-1 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
                                        disabled={deletingAccount}
                                    >
                                        Откажи
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteAccount}
                                        disabled={deletingAccount || deleteConfirmText !== "ИЗТРИЙ" || !deletePassword}
                                        className="flex-1 px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                                    >
                                        {deletingAccount ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                Изтриване...
                                            </span>
                                        ) : (
                                            "Изтрий завинаги"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit profile modal */}
            {editMode && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-10 max-w-lg w-full shadow-2xl shadow-purple-900/30 animate-in zoom-in-95 duration-500 border-2 border-purple-200/60 max-h-[90vh] overflow-y-auto relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-purple-50/20 pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                    Редактирай профил
                                </h3>
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="p-2.5 rounded-2xl hover:bg-slate-100 transition-all duration-300 hover:scale-110 hover:rotate-90 border-2 border-transparent hover:border-slate-200/60"
                                >
                                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdateProfile();
                                }}
                                className="space-y-5"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Име</label>
                                        <input
                                            type="text"
                                            value={editedFirstName}
                                            onChange={(e) => setEditedFirstName(e.target.value)}
                                            className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                            placeholder="Име"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Фамилия</label>
                                        <input
                                            type="text"
                                            value={editedLastName}
                                            onChange={(e) => setEditedLastName(e.target.value)}
                                            className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                            placeholder="Фамилия"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Град</label>
                                    <input
                                        type="text"
                                        value={editedCity}
                                        onChange={(e) => setEditedCity(e.target.value)}
                                        className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                        placeholder="Град"
                                    />
                                </div>
                                {role === "teacher" && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Квалификации</label>
                                        <input
                                            type="text"
                                            value={editedQualifications}
                                            onChange={(e) => setEditedQualifications(e.target.value)}
                                            className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                            placeholder="Математика, Физика..."
                                        />
                                    </div>
                                )}
                                {role === "teacher" && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Биография / Описание</label>
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            rows={5}
                                            className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 resize-y"
                                            placeholder="Кратко представяне за учениците: опит, подход, за какво преподавате..."
                                        />
                                    </div>
                                )}
                                {role === "teacher" && (
                                    <>
                                        <div className="border-t border-slate-200 pt-5 mt-2">
                                            <p className="text-sm font-bold text-purple-700 mb-3">Цена и онлайн уроци</p>
                                            <div className="space-y-4">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={priceNegotiable}
                                                        onChange={(e) => {
                                                            setPriceNegotiable(e.target.checked);
                                                            if (e.target.checked) setEditedHourlyRate("");
                                                        }}
                                                        className="w-5 h-5 rounded border-2 border-slate-300 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span className="text-slate-700 font-medium">По договаряне</span>
                                                </label>
                                                {!priceNegotiable && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">Цена за час (€)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={editedHourlyRate}
                                                            onChange={(e) => setEditedHourlyRate(e.target.value)}
                                                            className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                                            placeholder="напр. 25"
                                                        />
                                                    </div>
                                                )}
                                                {!priceNegotiable && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">Бележка за цената (по избор)</label>
                                                        <input
                                                            type="text"
                                                            value={editedPriceNote}
                                                            onChange={(e) => setEditedPriceNote(e.target.value)}
                                                            className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                                            placeholder="напр. При пакет 10 урока - отстъпка"
                                                        />
                                                    </div>
                                                )}
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={editedOffersOnline}
                                                        onChange={(e) => setEditedOffersOnline(e.target.checked)}
                                                        className="w-5 h-5 rounded border-2 border-slate-300 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span className="text-slate-700 font-medium">Предлагам онлайн уроци</span>
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditMode(false)}
                                        className="flex-1 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
                                    >
                                        Откажи
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loadingUpdate}
                                        className="flex-1 px-6 py-3 text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingUpdate ? "Запазване..." : "Запази"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
