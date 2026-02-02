import { useNavigate } from "react-router-dom";
import { AvatarImage } from "../AvatarImage";
import { RatingStars } from "../RatingStars";
import type { Teacher } from "../../types/teacher";

interface TeacherCardProps {
    teacher: Teacher;
    isLoggedIn: boolean;
}

export function TeacherCard({ teacher, isLoggedIn }: TeacherCardProps) {
    const navigate = useNavigate();

    const handleViewProfile = () => {
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            navigate(`/teacher/${teacher.id}`);
        }
    };

    return (
        <article
            className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-purple-200/80 transition-all duration-300 hover:-translate-y-0.5"
            data-testid="teacher-card"
        >
            <div className="flex items-start gap-4 mb-4">
                <div className="relative flex-shrink-0">
                    <AvatarImage
                        url={teacher.profile_picture}
                        fallback={
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-inner">
                                {teacher.full_name.charAt(0).toUpperCase()}
                            </div>
                        }
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden ring-2 ring-white shadow-md"
                        imgClassName="w-full h-full object-cover"
                        alt={teacher.full_name}
                    />
                    {teacher.is_online && (
                        <span
                            className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                            title="Онлайн"
                            aria-hidden
                        />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-0.5 truncate">
                        {teacher.full_name}
                    </h3>
                    <p className="text-sm font-semibold text-purple-600 mb-2">
                        {teacher.subject}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <RatingStars rating={Math.round(teacher.rating)} size="sm" />
                        <span className="text-sm font-medium text-slate-600">
                            {teacher.rating.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1 leading-relaxed">
                {teacher.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
                {teacher.is_online && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" aria-hidden />
                        Онлайн
                    </span>
                )}
                {teacher.city && (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                        {teacher.city}
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={handleViewProfile}
                className="w-full min-h-[44px] sm:min-h-[48px] inline-flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:scale-[0.98]"
            >
                Виж профил
            </button>
        </article>
    );
}
