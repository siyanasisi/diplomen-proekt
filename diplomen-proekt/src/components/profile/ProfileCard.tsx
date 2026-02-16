import type { TeacherProfileData } from "../../hooks/useProfile";

interface ProfileCardProps {
    displayName: string;
    role: string | null;
    userEmail: string;
    roleLabel: string | null;
    city: string | undefined;
    grade: string | undefined;
    memberSince: string;
    qualifications: string | undefined;
    teacherProfile: TeacherProfileData | null;
    currentAvatarUrl: string | null;
    uploadingAvatar: boolean;
    onEditClick: () => void;
    onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAvatar: () => void;
}

export function ProfileCard({
    displayName,
    role,
    userEmail,
    roleLabel,
    city,
    grade,
    memberSince,
    qualifications,
    teacherProfile,
    currentAvatarUrl,
    uploadingAvatar,
    onEditClick,
    onAvatarUpload,
    onRemoveAvatar,
}: ProfileCardProps) {
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const isTeacher = role === "teacher";

    return (
        <section className="bg-white border border-slate-200" style={{ borderRadius: '1.25rem', padding: '2.5rem 3rem' }}>
            <div className="flex flex-col md:flex-row items-start" style={{ gap: '2.5rem' }}>
                {/* avatar */}
                <div className="relative group/avatar flex-shrink-0" style={{ marginLeft: '0.5rem' }}>
                    <div className="overflow-hidden bg-purple-700" style={{ width: '9.5rem', height: '9.5rem', borderRadius: '1.25rem' }}>
                        {currentAvatarUrl ? (
                            <img
                                alt={`${displayName} profile`}
                                className="w-full h-full object-cover"
                                src={currentAvatarUrl}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white" style={{ fontSize: '2.25rem', fontWeight: 700 }}>
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="absolute bg-green-500 border-[3px] border-white" style={{ bottom: '-0.125rem', right: '-0.125rem', width: '1.25rem', height: '1.25rem', borderRadius: '50%' }} />
                    {/* hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 flex flex-col items-center justify-center" style={{ borderRadius: '1.25rem', gap: '0.5rem' }}>
                        <label className="cursor-pointer">
                            <input type="file" accept="image/*" onChange={onAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                            <div className="text-white bg-white/20 hover:bg-white/30 transition-colors text-center" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                                {uploadingAvatar ? "..." : currentAvatarUrl ? "Смени" : "Добави"}
                            </div>
                        </label>
                        {currentAvatarUrl && (
                            <button
                                onClick={onRemoveAvatar}
                                className="text-white bg-red-500/70 hover:bg-red-600 transition-colors"
                                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
                                disabled={uploadingAvatar}
                            >
                                Премахни
                            </button>
                        )}
                    </div>
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between" style={{ gap: '1.25rem', marginBottom: '1.75rem' }}>
                        <div>
                            <div className="flex items-center" style={{ gap: '0.75rem' }}>
                                <h2 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{displayName}</h2>
                                {roleLabel && (
                                    <span className="bg-purple-50 text-purple-700 border border-purple-100 uppercase" style={{ padding: '0.3125rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                                        {roleLabel}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center text-slate-500" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.125rem' }}>mail</span>
                                <span style={{ fontSize: '1.0625rem' }}>{userEmail}</span>
                            </div>
                        </div>
                        <button
                            onClick={onEditClick}
                            className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors"
                            style={{ gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600 }}
                        >
                            <span className="material-icons" style={{ fontSize: '1.125rem' }}>edit</span>
                            Редактирай
                        </button>
                    </div>

                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                        {city && (
                            <div className="bg-slate-50 border border-slate-100" style={{ padding: '1.125rem', borderRadius: '0.75rem' }}>
                                <p className="text-slate-400 uppercase" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Град</p>
                                <p className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600 }}>
                                    {city}
                                    {role === "student" && grade && <span className="text-slate-400"> · {grade} клас</span>}
                                </p>
                            </div>
                        )}
                        <div className="bg-slate-50 border border-slate-100" style={{ padding: '1.125rem', borderRadius: '0.75rem' }}>
                            <p className="text-slate-400 uppercase" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Член от</p>
                            <p className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600 }}>{memberSince}</p>
                        </div>

                        {isTeacher && qualifications && (
                            <div className="col-span-2 bg-slate-50 border border-slate-100" style={{ padding: '1.125rem', borderRadius: '0.75rem' }}>
                                <p className="text-slate-400 uppercase" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Квалификации</p>
                                <p className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600 }}>{qualifications}</p>
                            </div>
                        )}

                        {isTeacher && teacherProfile &&
                            (teacherProfile.hourly_rate != null || teacherProfile.price_note || teacherProfile.offers_online_lessons) && (
                                <div className="col-span-2 bg-purple-50 border border-purple-100" style={{ padding: '1.125rem', borderRadius: '0.75rem' }}>
                                    <p className="text-purple-700 uppercase" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Цена и онлайн уроци</p>
                                    <div className="flex items-center justify-between">
                                        {teacherProfile.hourly_rate != null && (
                                            <p className="text-purple-700" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                                Цена за час: {teacherProfile.hourly_rate} €
                                            </p>
                                        )}
                                        {teacherProfile.offers_online_lessons && (
                                            <span className="flex items-center text-purple-700" style={{ gap: '0.375rem', fontSize: '0.9375rem', fontWeight: 500 }}>
                                                <span className="material-icons" style={{ fontSize: '1.125rem' }}>check_circle</span>
                                                Предлага онлайн уроци
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </section>
    );
}
