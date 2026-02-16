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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto animate-spin" style={{ width: '2.5rem', height: '2.5rem', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', marginBottom: '1rem' }} />
                    <p className="text-slate-500" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Зареждане...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const roleLabel = role === "student" ? "Ученик" : role === "teacher" ? "Учител" : null;
    const grade = userMetadata?.grade as string | undefined;
    const city = userMetadata?.city as string | undefined;
    const qualifications = userMetadata?.qualifications as string | undefined;

    const isTeacher = role === "teacher";
    const displayEvents = isTeacher && showAllEvents ? allEvents : upcomingEvents;

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
            {/* loading overlay */}
            {isLoadingData && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
                    <div className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '2rem', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                        <div className="flex flex-col items-center" style={{ gap: '0.75rem' }}>
                            <div className="animate-spin" style={{ width: '2rem', height: '2rem', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%' }} />
                            <p className="text-slate-600" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Зареждане на данни...</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto relative z-10" style={{ padding: '2rem 1.5rem' }}>
                <ProfileHeader
                    role={role}
                    currentStreak={currentStreak}
                    onNavigateHome={() => navigate("/home")}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-8">
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

                        <ProfileSettings
                            onChangePassword={() => setShowChangePassword(true)}
                            onSignOut={handleSignOut}
                            onDeleteAccount={() => setShowDeleteAccount(true)}
                        />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 space-y-8">
                        <ProfileQuickActions
                            role={role}
                            onAddEvent={() => navigate("/home")}
                            onViewStats={() => navigate("/home")}
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
                        />

                        {role === "student" && (
                            <ProfileRecentActivity events={recentActivity} formatDate={formatDate} />
                        )}
                    </div>
                </div>
            </div>

            <footer className="border-t border-slate-200 bg-white" style={{ marginTop: '3rem', padding: '2rem 0' }}>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between" style={{ padding: '0 1.5rem', gap: '1.5rem' }}>
                    <div className="flex items-center text-purple-700 opacity-50" style={{ gap: '0.375rem', fontWeight: 700 }}>
                        <span className="material-icons" style={{ fontSize: '1.125rem' }}>school</span>
                        <span style={{ fontSize: '0.875rem' }}>Matura+</span>
                    </div>
                    <div className="flex" style={{ gap: '1.5rem' }}>
                        <a className="text-slate-400 hover:text-purple-700 transition-colors" style={{ fontSize: '0.75rem', fontWeight: 500 }} href="#">Общи условия</a>
                        <a className="text-slate-400 hover:text-purple-700 transition-colors" style={{ fontSize: '0.75rem', fontWeight: 500 }} href="#">Поверителност</a>
                        <a className="text-slate-400 hover:text-purple-700 transition-colors" style={{ fontSize: '0.75rem', fontWeight: 500 }} href="#">Помощ</a>
                    </div>
                    <p className="text-slate-400 uppercase" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>© 2026 Всички права запазени</p>
                </div>
            </footer>

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
