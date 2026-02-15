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
    variant?: "default" | "teacher";
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
    variant = "default",
}: ProfileCardProps) {
    const isTeacher = variant === "teacher";

    if (isTeacher) {
        const initials = displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        return (
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                    <div className="relative">
                        {currentAvatarUrl ? (
                            <img
                                alt={`${displayName} profile`}
                                className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-md"
                                src={currentAvatarUrl}
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-3xl font-bold bg-[#6D28D9]">
                                {initials}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    {displayName}
                                    {roleLabel && (
                                        <span className="bg-[#6D28D9]/10 text-[#6D28D9] text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                                            {roleLabel.toUpperCase()}
                                        </span>
                                    )}
                                </h2>
                                <p className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                    <span className="material-icons text-base">mail_outline</span>
                                    {userEmail}
                                </p>
                            </div>
                            <button
                                onClick={onEditClick}
                                className="flex items-center gap-2 bg-[#6D28D9] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#8B5CF6] transition-all shadow-lg shadow-[#6D28D9]/20"
                            >
                                <span className="material-icons text-sm">edit</span>
                                Редактирай
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {city && (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Град</p>
                                    <p className="font-semibold">{city}</p>
                                </div>
                            )}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Член от</p>
                                <p className="font-semibold">{memberSince}</p>
                            </div>
                            {role === "teacher" && qualifications && (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 md:col-span-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Квалификации</p>
                                    <p className="font-semibold">{qualifications}</p>
                                </div>
                            )}
                            {role === "teacher" &&
                                teacherProfile &&
                                (teacherProfile.hourly_rate != null || teacherProfile.price_note || teacherProfile.offers_online_lessons) && (
                                    <div className="bg-[#6D28D9]/5 p-3 rounded-xl border border-[#6D28D9]/10 md:col-span-2">
                                        <p className="text-[10px] uppercase font-bold text-[#6D28D9]/70 mb-1">
                                            Цена и онлайн уроци
                                        </p>
                                        <div className="flex items-center justify-between">
                                            {teacherProfile.hourly_rate != null && (
                                                <p className="font-bold text-[#6D28D9] text-lg">
                                                    Цена за час: {teacherProfile.hourly_rate} €
                                                </p>
                                            )}
                                            {teacherProfile.offers_online_lessons && (
                                                <span className="text-xs text-[#6D28D9]/80 flex items-center gap-1">
                                                    <span className="material-icons text-sm">check_circle</span>
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

    return (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
            <div className="relative p-12">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
                    {/* Avatar section */}
                    <div className="relative group/avatar flex-shrink-0">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-400/30 to-purple-600/30 blur-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700 -z-10" />
                            {currentAvatarUrl ? (
                                <img
                                    src={currentAvatarUrl}
                                    alt={displayName}
                                    className="w-36 h-36 rounded-3xl object-cover shadow-2xl ring-4 ring-purple-200/60 transition-all duration-700 group-hover/avatar:scale-110 group-hover/avatar:ring-purple-400/80 group-hover/avatar:shadow-purple-900/40 group-hover/avatar:rotate-2"
                                />
                            ) : (
                                <div className="w-36 h-36 rounded-3xl flex items-center justify-center text-white text-6xl font-black shadow-2xl ring-4 ring-purple-200/60 transition-all duration-700 group-hover/avatar:scale-110 group-hover/avatar:ring-purple-400/80 group-hover/avatar:shadow-purple-900/40 group-hover/avatar:rotate-2 bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 border-4 border-white shadow-2xl ring-2 ring-emerald-200/60 animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/90 via-black/70 to-black/50 opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 cursor-pointer backdrop-blur-xl">
                            <label className="cursor-pointer transform hover:scale-110 transition-transform duration-300">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onAvatarUpload}
                                    className="hidden"
                                    disabled={uploadingAvatar}
                                />
                                <div className="px-6 py-3 rounded-2xl text-white text-sm font-bold bg-white/30 backdrop-blur-xl hover:bg-white/40 transition-all hover:scale-110 border-2 border-white/40 shadow-2xl">
                                    {uploadingAvatar ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Качване...
                                        </div>
                                    ) : currentAvatarUrl ? (
                                        "Смени"
                                    ) : (
                                        "Добави"
                                    )}
                                </div>
                            </label>
                            {currentAvatarUrl && (
                                <button
                                    onClick={onRemoveAvatar}
                                    className="px-6 py-3 rounded-2xl text-white text-sm font-bold bg-red-500/95 hover:bg-red-600 backdrop-blur-xl transition-all hover:scale-110 border-2 border-red-400/60 shadow-2xl"
                                    disabled={uploadingAvatar}
                                >
                                    Премахни
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Info Section */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-6 mb-10">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-4 mb-4 flex-wrap">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                        {displayName}
                                    </h2>
                                    {roleLabel && (
                                        <span className="px-4 py-1.5 text-xs font-black text-purple-900 bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 rounded-2xl uppercase tracking-widest border-2 border-purple-300/60 shadow-lg shadow-purple-900/10">
                                            {roleLabel.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-lg font-semibold text-slate-700 flex items-center gap-3 group/email">
                                    <svg
                                        className="w-5 h-5 text-purple-600 group-hover/email:scale-110 transition-transform duration-300"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                                        {userEmail}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={onEditClick}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 hover:from-purple-700 hover:via-purple-800 hover:to-purple-700 text-white rounded-2xl font-bold transition-all duration-500 flex items-center gap-3 border-2 border-purple-500/50 hover:border-purple-400/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/40 hover:scale-105 shadow-xl shadow-purple-900/30 group"
                            >
                                <svg
                                    className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                                Редактирай
                            </button>
                        </div>

                        {/* Profile details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 border-t-2 border-gradient-to-r from-transparent via-purple-200/40 to-transparent">
                            {city && (
                                <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 border-2 border-purple-200/40 hover:border-purple-300/60 transition-all duration-500 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <p className="text-xs font-black text-purple-600 mb-3 uppercase tracking-widest relative z-10">Град</p>
                                    <p className="text-lg font-bold text-slate-900 relative z-10">
                                        {city}
                                        {role === "student" && grade && (
                                            <span className="text-slate-600 font-semibold"> • {grade} клас</span>
                                        )}
                                    </p>
                                </div>
                            )}
                            <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 border-2 border-purple-200/40 hover:border-purple-300/60 transition-all duration-500 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <p className="text-xs font-black text-purple-600 mb-3 uppercase tracking-widest relative z-10">Член от</p>
                                <p className="text-lg font-bold text-slate-900 relative z-10">{memberSince}</p>
                            </div>
                            {role === "teacher" && qualifications && (
                                <div className="sm:col-span-2 bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 border-2 border-purple-200/40 hover:border-purple-300/60 transition-all duration-500 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <p className="text-xs font-black text-purple-600 mb-3 uppercase tracking-widest relative z-10">Квалификации</p>
                                    <p className="text-lg font-bold text-slate-900 relative z-10">{qualifications}</p>
                                </div>
                            )}
                            {role === "teacher" &&
                                teacherProfile &&
                                (teacherProfile.hourly_rate != null || teacherProfile.price_note || teacherProfile.offers_online_lessons) && (
                                    <div className="sm:col-span-2 bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 border-2 border-purple-200/40 hover:border-purple-300/60 transition-all duration-500 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <p className="text-xs font-black text-purple-600 mb-3 uppercase tracking-widest relative z-10">
                                            Цена и онлайн уроци
                                        </p>
                                        <div className="relative z-10 space-y-1">
                                            {teacherProfile.hourly_rate != null && (
                                                <p className="text-lg font-bold text-slate-900">
                                                    Цена за час: {teacherProfile.hourly_rate} €
                                                </p>
                                            )}
                                            {teacherProfile.price_note && (
                                                <p className="text-slate-700">{teacherProfile.price_note}</p>
                                            )}
                                            {teacherProfile.offers_online_lessons && (
                                                <p className="text-sm font-semibold text-emerald-700">Предлага онлайн уроци</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
