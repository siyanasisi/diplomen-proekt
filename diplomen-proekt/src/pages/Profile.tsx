import { useProfile } from "../hooks/useProfile";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileModals } from "../components/profile/ProfileModals";
import { ProfileCard } from "../components/profile/ProfileCard";
import { PendingBookings, MyBookings } from "../components/profile/ProfileBookings";
import { ProfileSettings } from "../components/profile/ProfileSettings";
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
        <div className="flex min-h-full bg-slate-50 overflow-hidden relative">
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

            <div
                className="pointer-events-none fixed top-0 right-0 -z-10 opacity-30"
                style={{ width: '30%', height: '100vh', background: 'linear-gradient(to left, rgba(126,34,206,0.04), transparent)' }}
            />

            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ padding: 0 }}>
                <div className="max-w-5xl mx-auto" style={{ paddingTop: '2rem', paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '6rem' }}>
                    <ProfileHeader
                        role={role}
                        currentStreak={currentStreak}
                        onNavigateHome={() => navigate("/home")}
                    />

                    {/* Profile card – full width hero */}
                    <div style={{ marginBottom: '1.5rem' }}>
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
                    </div>

                    {/* stats + quick actions bar */}
                    <div className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '1.5rem 2rem', marginBottom: '2rem' }}>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between" style={{ gap: '1.25rem' }}>
                            {/* stats inline */}
                            {role === "student" ? (
                                <div className="flex items-center flex-wrap" style={{ gap: '1.5rem' }}>
                                    {[
                                        { value: currentStreak, label: "Текуща серия", icon: "local_fire_department", iconBg: "bg-purple-50 text-purple-700" },
                                        { value: longestStreak, label: "Най-дълга серия", icon: "emoji_events", iconBg: "bg-amber-50 text-amber-600" },
                                        { value: earnedPoints, label: "Точки", icon: "stars", iconBg: "bg-emerald-50 text-emerald-600" },
                                        { value: totalEvents, label: "Събития", icon: "calendar_month", iconBg: "bg-purple-50 text-purple-700" },
                                    ].map((stat, i) => (
                                        <div key={i} className="flex items-center" style={{ gap: '0.75rem' }}>
                                            <div className={`flex items-center justify-center ${stat.iconBg}`} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem' }}>
                                                <span className="material-icons" style={{ fontSize: '1.125rem' }}>{stat.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-900" style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>{stat.value}</p>
                                                <p className="text-slate-400 uppercase" style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.06em', marginTop: '0.125rem' }}>{stat.label}</p>
                                            </div>
                                            {i < 3 && <div className="hidden lg:block bg-slate-200" style={{ width: '1px', height: '2rem', marginLeft: '0.75rem' }} />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center" style={{ gap: '0.5rem' }}>
                                    <div className="flex items-center justify-center bg-purple-50 text-purple-700" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem' }}>
                                        <span className="material-icons" style={{ fontSize: '1.125rem' }}>school</span>
                                    </div>
                                    <span className="text-slate-600" style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Управлявай уроци и наличност от тук</span>
                                </div>
                            )}

                            {/* action buttons */}
                            <div className="flex items-center shrink-0" style={{ gap: '0.625rem' }}>
                                <button
                                    onClick={() => navigate("/home")}
                                    className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors"
                                    style={{ gap: '0.375rem', padding: '0.625rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                                >
                                    <span className="material-icons" style={{ fontSize: '1.125rem' }}>add_circle</span>
                                    Добави събитие
                                </button>
                                {role === "student" && (
                                    <button
                                        onClick={() => navigate("/home")}
                                        className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center transition-colors"
                                        style={{ gap: '0.375rem', padding: '0.625rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '1.125rem' }}>analytics</span>
                                        Статистики
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 items-start" style={{ gap: '2rem' }}>
                        {/* left column */}
                        <div className="lg:col-span-7 flex flex-col" style={{ gap: '1.5rem' }}>
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

                        {/* right column */}
                        <div className="lg:col-span-5 flex flex-col" style={{ gap: '1.5rem' }}>
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
};
