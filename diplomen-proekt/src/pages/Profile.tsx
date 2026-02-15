import { useProfile } from "../hooks/useProfile";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileModals } from "../components/profile/ProfileModals";
import { ProfileCard } from "../components/profile/ProfileCard";
import { ProfileStats } from "../components/profile/ProfileStats";
import { PendingBookings, MyBookings } from "../components/profile/ProfileBookings";
import { ProfileSettings } from "../components/profile/ProfileSettings";
import { ProfileQuickActions } from "../components/profile/ProfileQuickActions";
import { ProfileEvents } from "../components/profile/ProfileEvents";
import { ProfileRecentActivity } from "../components/profile/ProfileRecentActivity";
import { ProfileAvailability } from "../components/profile/ProfileAvailability";

export const Profile = () => {
    const profile = useProfile();
    const {
        user,
        role,
        loading,
        isLoadingData,
        currentStreak,
        longestStreak,
        earnedPoints,
        totalEvents,
        upcomingEvents,
        recentActivity,
        allEvents,
        editMode,
        setEditMode,
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
        teacherProfile,
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
        showAllEvents,
        setShowAllEvents,
        teacherAvailability,
        teacherBookingSettings,
        teacherBlockedSlots,
        teacherExceptions,
        savingAvailability,
        futurePendingBookings,
        studentUpcomingBookings,
        actingOnBookingId,
        userMetadata,
        displayName,
        memberSince,
        currentAvatarUrl,
        uploadingAvatar,
        navigate,
        handleSignOut,
        handleDeleteAccount,
        formatDate,
        formatFullDate,
        handleUpdateProfile,
        handleSaveAvailability,
        handleConfirmBooking,
        handleCancelBooking,
        handleCancelMyBooking,
        handleDeleteEvent,
        handleAvatarUpload,
        validatePassword,
        handleChangePassword,
        handleRemoveAvatar,
        openEditMode,
        closeChangePassword,
        closeDeleteAccount,
    } = profile;

    if (loading) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${
                    role === "teacher" ? "bg-[#F9FAFB]" : "bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50"
                }`}
            >
                <div className="text-center">
                    <svg className="animate-spin w-12 h-12 text-[#6D28D9] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <p className="text-slate-600 font-medium">Зареждане...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const roleLabel = role === "student" ? "Ученик" : role === "teacher" ? "Учител" : null;
    const grade = userMetadata?.grade as string | undefined;
    const city = userMetadata?.city as string | undefined;
    const qualifications = userMetadata?.qualifications as string | undefined;

    const displayEvents = role === "teacher" && showAllEvents ? allEvents : upcomingEvents;

    const isTeacher = role === "teacher";

    return (
        <div
            className={`min-h-screen ${
                isTeacher ? "bg-[#F9FAFB] font-['Inter',sans-serif]" : "bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50"
            } relative overflow-x-hidden`}
        >
            {/* background */}
            {!isTeacher && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/30 via-purple-100/20 to-transparent rounded-full blur-3xl animate-pulse" />
                    <div
                        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-200/20 via-purple-100/15 to-transparent rounded-full blur-3xl animate-pulse"
                        style={{ animationDelay: "1s" }}
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-purple-100/10 via-transparent to-transparent rounded-full blur-3xl" />
                </div>
            )}

            {/* loading overlay */}
            {isLoadingData && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200/60">
                        <div className="flex flex-col items-center gap-4">
                            <svg className="animate-spin w-12 h-12 text-[#6D28D9]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            <p className="text-sm font-semibold text-slate-700">Зареждане на данни...</p>
                        </div>
                    </div>
                </div>
            )}

            <main className={`max-w-7xl mx-auto relative z-10 ${isTeacher ? "px-4 py-8" : "px-8 py-16"}`}>
                <ProfileHeader
                    role={role}
                    currentStreak={currentStreak}
                    onNavigateHome={() => navigate("/home")}
                    variant={isTeacher ? "teacher" : "default"}
                />

                <div className={`grid grid-cols-1 lg:grid-cols-3 ${isTeacher ? "gap-8" : "gap-6"}`}>
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <ProfileCard
                            displayName={displayName}
                            role={role}
                            userEmail={user.email ?? ""}
                            roleLabel={roleLabel}
                            city={city}
                            grade={grade}
                            memberSince={memberSince}
                            qualifications={qualifications}
                            teacherProfile={teacherProfile}
                            currentAvatarUrl={currentAvatarUrl}
                            uploadingAvatar={uploadingAvatar}
                            onEditClick={openEditMode}
                            onAvatarUpload={handleAvatarUpload}
                            onRemoveAvatar={handleRemoveAvatar}
                            variant={isTeacher ? "teacher" : "default"}
                        />

                        {isTeacher && (
                            <ProfileAvailability
                                initialAvailability={teacherAvailability}
                                initialSettings={teacherBookingSettings}
                                initialBlocked={teacherBlockedSlots}
                                initialExceptions={teacherExceptions}
                                onSave={handleSaveAvailability}
                                saving={savingAvailability}
                                variant="teacher"
                            />
                        )}

                        {isTeacher && (
                            <PendingBookings
                                bookings={futurePendingBookings}
                                actingOnBookingId={actingOnBookingId}
                                onConfirm={handleConfirmBooking}
                                onCancel={handleCancelBooking}
                                variant="teacher"
                            />
                        )}

                        {role === "student" && (
                            <ProfileStats
                                currentStreak={currentStreak}
                                longestStreak={longestStreak}
                                earnedPoints={earnedPoints}
                                totalEvents={totalEvents}
                            />
                        )}

                        {role === "student" && (
                            <MyBookings
                                bookings={studentUpcomingBookings}
                                onCancel={handleCancelMyBooking}
                            />
                        )}

                        {!isTeacher && (
                            <ProfileSettings
                                onChangePassword={() => setShowChangePassword(true)}
                                onSignOut={handleSignOut}
                                onDeleteAccount={() => setShowDeleteAccount(true)}
                            />
                        )}
                    </div>

                    {/* Right Column */}
                    <div className={isTeacher ? "space-y-8" : "space-y-6"}>
                        <ProfileQuickActions
                            role={role}
                            onAddEvent={() => navigate("/home")}
                            onViewStats={() => navigate("/home")}
                            variant={isTeacher ? "teacher" : "default"}
                        />

                        <ProfileEvents
                            role={role}
                            events={displayEvents}
                            showAllEvents={showAllEvents}
                            allEventsCount={allEvents.length}
                            onToggleShowAll={() => setShowAllEvents(!showAllEvents)}
                            onNavigateHome={() => navigate("/home")}
                            formatDate={formatDate}
                            formatFullDate={formatFullDate}
                            onDeleteEvent={handleDeleteEvent}
                            variant={isTeacher ? "teacher" : "default"}
                        />

                        {role === "student" && (
                            <ProfileRecentActivity events={recentActivity} formatDate={formatDate} />
                        )}

                        {isTeacher && (
                            <ProfileSettings
                                onChangePassword={() => setShowChangePassword(true)}
                                onSignOut={handleSignOut}
                                onDeleteAccount={() => setShowDeleteAccount(true)}
                                variant="teacher"
                            />
                        )}
                    </div>
                </div>
            </main>

            {isTeacher && (
                <footer className="mt-20 border-t border-slate-200 py-12 bg-white">
                    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-2 text-[#6D28D9] font-bold opacity-50">
                            <span className="material-icons">school</span>
                            <span>Matura+</span>
                        </div>
                        <div className="flex gap-8">
                            <a className="text-xs font-medium text-slate-400 hover:text-[#6D28D9] transition-colors" href="#">Общи условия</a>
                            <a className="text-xs font-medium text-slate-400 hover:text-[#6D28D9] transition-colors" href="#">Политика за поверителност</a>
                            <a className="text-xs font-medium text-slate-400 hover:text-[#6D28D9] transition-colors" href="#">Помощ</a>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">© 2026 Всички права запазени</p>
                    </div>
                </footer>
            )}

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
};
