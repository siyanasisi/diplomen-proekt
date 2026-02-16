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
        <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* avatar */}
                <div className="relative group/avatar">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                        {currentAvatarUrl ? (
                            <img
                                alt={`${displayName} profile`}
                                className="w-full h-full object-cover"
                                src={currentAvatarUrl}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold bg-purple-700">
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" />
                    {/* avatar hover overlay */}
                    <div className="absolute inset-0 rounded-3xl bg-black/70 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer">
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onAvatarUpload}
                                className="hidden"
                                disabled={uploadingAvatar}
                            />
                            <div className="px-4 py-2 rounded-xl text-white text-xs font-bold bg-white/25 hover:bg-white/35 transition-all border border-white/30">
                                {uploadingAvatar ? "..." : currentAvatarUrl ? "Смени" : "Добави"}
                            </div>
                        </label>
                        {currentAvatarUrl && (
                            <button
                                onClick={onRemoveAvatar}
                                className="px-4 py-2 rounded-xl text-white text-xs font-bold bg-red-500/80 hover:bg-red-600 transition-all border border-red-400/50"
                                disabled={uploadingAvatar}
                            >
                                Премахни
                            </button>
                        )}
                    </div>
                </div>

                {/* info */}
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold text-slate-900">{displayName}</h2>
                                {roleLabel && (
                                    <span className="px-3 py-1 bg-purple-700/10 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wider">
                                        {roleLabel}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center text-slate-500 mt-1">
                                <span className="material-icons text-sm mr-1">mail</span>
                                <span className="text-sm">{userEmail}</span>
                            </div>
                        </div>
                        <button
                            onClick={onEditClick}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-purple-700/20"
                        >
                            <span className="material-icons text-sm">edit</span>
                            Редактирай
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {city && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Град</p>
                                <p className="font-bold text-slate-700 flex items-center">
                                    {city}
                                    {role === "student" && grade && (
                                        <><span className="mx-2 text-slate-300">•</span>{grade} клас</>
                                    )}
                                </p>
                            </div>
                        )}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Член от</p>
                            <p className="font-bold text-slate-700">{memberSince}</p>
                        </div>

                        {isTeacher && qualifications && (
                            <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Квалификации</p>
                                <p className="font-bold text-slate-700">{qualifications}</p>
                            </div>
                        )}

                        {isTeacher &&
                            teacherProfile &&
                            (teacherProfile.hourly_rate != null || teacherProfile.price_note || teacherProfile.offers_online_lessons) && (
                                <div className="col-span-2 bg-purple-700/5 p-4 rounded-2xl border border-purple-700/10">
                                    <p className="text-[10px] uppercase font-bold text-purple-700/70 mb-1 tracking-widest">
                                        Цена и онлайн уроци
                                    </p>
                                    <div className="flex items-center justify-between">
                                        {teacherProfile.hourly_rate != null && (
                                            <p className="font-bold text-purple-700 text-lg">
                                                Цена за час: {teacherProfile.hourly_rate} €
                                            </p>
                                        )}
                                        {teacherProfile.offers_online_lessons && (
                                            <span className="text-xs text-purple-700/80 flex items-center gap-1">
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
