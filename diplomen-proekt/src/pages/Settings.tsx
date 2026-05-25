import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileSettings } from "../components/profile/ProfileSettings";
import { ProfileModals } from "../components/profile/ProfileModals";
import { AvatarImage } from "../components/AvatarImage";

export function Settings() {
    const navigate = useNavigate();
    const profile = useProfile();
    const {
        user,
        role,
        loading,
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
        showDeleteAccount,
        setShowDeleteAccount,
        deletePassword,
        setDeletePassword,
        deleteConfirmText,
        setDeleteConfirmText,
        deletingAccount,
        editMode,
        setEditMode,
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
        displayName,
        currentAvatarUrl,
        handleSignOut,
        handleDeleteAccount,
        handleUpdateProfile,
        validatePassword,
        handleChangePassword,
        closeChangePassword,
        closeDeleteAccount,
    } = profile;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div
                        className="mx-auto animate-spin"
                        style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            border: "2px solid #e2e8f0",
                            borderTopColor: "#7c3aed",
                            borderRadius: "50%",
                            marginBottom: "1rem",
                        }}
                    />
                    <p className="text-slate-500" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                        Зареждане...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const roleLabel = role === "student" ? "Ученик" : role === "teacher" ? "Учител" : null;

    return (
        <div className="flex min-h-full bg-slate-50 overflow-hidden relative">
            <div
                className="pointer-events-none fixed top-0 right-0 -z-10 opacity-30"
                style={{
                    width: "30%",
                    height: "100vh",
                    background: "linear-gradient(to left, rgba(126,34,206,0.04), transparent)",
                }}
            />

            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
                <div
                    className="max-w-3xl mx-auto"
                    style={{
                        paddingTop: "2rem",
                        paddingLeft: "2rem",
                        paddingRight: "2rem",
                        paddingBottom: "6rem",
                    }}
                >
                    <ProfileHeader
                        role={role}
                        title="Настройки"
                        subtitle="Сигурност, акаунт и изход от приложението"
                        showStreak={false}
                        onNavigateHome={() => navigate("/home")}
                    />

                    <section
                        className="bg-white border border-slate-200"
                        style={{ borderRadius: "1rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}
                    >
                        <div className="flex items-center flex-wrap" style={{ gap: "1rem" }}>
                            <AvatarImage
                                url={currentAvatarUrl}
                                fallback={
                                    <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                }
                                className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200 shrink-0"
                                imgClassName="w-full h-full object-cover"
                                alt={displayName}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-slate-900 truncate" style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
                                    {displayName}
                                </p>
                                <p className="text-slate-500 truncate" style={{ fontSize: "0.75rem", marginTop: "0.125rem" }}>
                                    {user.email}
                                </p>
                                {roleLabel && (
                                    <span
                                        className="inline-flex mt-2 bg-purple-50 text-purple-700 border border-purple-100"
                                        style={{
                                            padding: "0.125rem 0.5rem",
                                            borderRadius: "0.375rem",
                                            fontSize: "0.6875rem",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {roleLabel}
                                    </span>
                                )}
                            </div>
                            <Link
                                to="/profile"
                                className="text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors shrink-0 inline-flex items-center"
                                style={{
                                    gap: "0.25rem",
                                    padding: "0.5rem 0.875rem",
                                    borderRadius: "0.5rem",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                }}
                            >
                                Моят профил
                                <span className="material-icons" style={{ fontSize: "1rem" }}>chevron_right</span>
                            </Link>
                        </div>
                    </section>

                    <ProfileSettings
                        onChangePassword={() => setShowChangePassword(true)}
                        onSignOut={handleSignOut}
                        onDeleteAccount={() => setShowDeleteAccount(true)}
                    />
                </div>
            </main>

            <ProfileModals
                showChangePassword={showChangePassword}
                setShowChangePassword={setShowChangePassword}
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                passwordError={passwordError}
                setPasswordError={setPasswordError}
                changingPassword={changingPassword}
                validatePassword={validatePassword}
                handleChangePassword={handleChangePassword}
                closeChangePassword={closeChangePassword}
                showDeleteAccount={showDeleteAccount}
                setShowDeleteAccount={setShowDeleteAccount}
                deletePassword={deletePassword}
                setDeletePassword={setDeletePassword}
                deleteConfirmText={deleteConfirmText}
                setDeleteConfirmText={setDeleteConfirmText}
                deletingAccount={deletingAccount}
                handleDeleteAccount={handleDeleteAccount}
                closeDeleteAccount={closeDeleteAccount}
                editMode={editMode}
                setEditMode={setEditMode}
                role={role}
                editedFirstName={editedFirstName}
                setEditedFirstName={setEditedFirstName}
                editedLastName={editedLastName}
                setEditedLastName={setEditedLastName}
                editedCity={editedCity}
                setEditedCity={setEditedCity}
                editedQualifications={editedQualifications}
                setEditedQualifications={setEditedQualifications}
                editedHourlyRate={editedHourlyRate}
                setEditedHourlyRate={setEditedHourlyRate}
                editedPriceNote={editedPriceNote}
                setEditedPriceNote={setEditedPriceNote}
                editedOffersOnline={editedOffersOnline}
                setEditedOffersOnline={setEditedOffersOnline}
                editedDescription={editedDescription}
                setEditedDescription={setEditedDescription}
                priceNegotiable={priceNegotiable}
                setPriceNegotiable={setPriceNegotiable}
                loadingUpdate={loadingUpdate}
                handleUpdateProfile={handleUpdateProfile}
            />
        </div>
    );
}
