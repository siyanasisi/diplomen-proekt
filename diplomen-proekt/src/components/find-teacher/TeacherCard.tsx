import { useNavigate } from "react-router-dom";
import { AvatarImage } from "../AvatarImage";
import { RatingStars } from "../RatingStars";
import type { Teacher } from "../../types/teacher";

interface TeacherCardProps {
    teacher: Teacher;
    isLoggedIn: boolean;
}

const PLACEHOLDER_DESCRIPTIONS = [
    "Моля, попълнете профила си",
    "Попълнете профила си",
    "Описание",
];

const DESCRIPTION_FALLBACK = "Очаквайте повече информация скоро.";

function getDisplayDescription(description: string | undefined, _subject: string): string {
    const trimmed = (description ?? "").trim();
    if (!trimmed) return DESCRIPTION_FALLBACK;
    const lower = trimmed.toLowerCase();
    if (PLACEHOLDER_DESCRIPTIONS.some((p) => lower.includes(p.toLowerCase()))) {
        return DESCRIPTION_FALLBACK;
    }
    return trimmed;
}

function getHookLine(description: string, subject: string): string {
    const display = getDisplayDescription(description, subject);
    if (display === DESCRIPTION_FALLBACK) return display;
    const firstSentence = display.split(/[.!?]/)[0]?.trim() || display.slice(0, 80);
    return firstSentence.length > 60 ? firstSentence.slice(0, 57) + "…" : firstSentence;
}

export function TeacherCard({ teacher, isLoggedIn }: TeacherCardProps) {
    const navigate = useNavigate();
    const hasRating = teacher.rating > 0;
    const hookLine = getHookLine(teacher.description ?? "", teacher.subject);

    const handleViewProfile = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            navigate(`/teacher/${teacher.id}`);
        }
    };

    const handleContact = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            navigate(`/teacher/${teacher.id}`, { state: { scrollToContact: true } });
        }
    };

    return (
        <article
            className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-slate-300/80 transition-all duration-300 ease-out"
            data-testid="teacher-card"
        >
            {/* badges row */}
            <div className="px-5 pt-5 sm:px-6 sm:pt-6 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-md">
                    {teacher.subject}
                </span>
                {teacher.city && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md">
                        <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {teacher.city}
                    </span>
                )}
                {teacher.is_online && !teacher.city && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" aria-hidden />
                        Онлайн
                    </span>
                )}
            </div>

            <div className="flex flex-col flex-1 p-5 pt-4 sm:p-6 sm:pt-5">
                {/* avatar & name */}
                <div className="flex items-start gap-4 sm:gap-5 mb-3">
                    <div className="relative flex-shrink-0">
                        <AvatarImage
                            url={teacher.profile_picture}
                            fallback={
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center text-white shadow-inner ring-2 ring-white/50">
                                    <span className="relative text-2xl sm:text-3xl font-bold drop-shadow-sm">
                                        {teacher.full_name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="absolute bottom-1.5 right-1.5 w-6 h-6 text-white/90" aria-hidden>
                                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                        </svg>
                                    </span>
                                </div>
                            }
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-white shadow"
                            imgClassName="w-full h-full object-cover"
                            alt={teacher.full_name}
                        />
                        {teacher.is_online && (
                            <span
                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                                title="Онлайн"
                                aria-hidden
                            />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight">
                            {teacher.full_name}
                        </h3>
                        {hasRating ? (
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <RatingStars rating={Math.round(teacher.rating)} size="xs" />
                                <span className="text-xs font-medium text-slate-600">
                                    {teacher.rating.toFixed(1)}
                                </span>
                            </div>
                        ) : (
                            <p className="mt-1.5 text-xs font-medium text-slate-500">
                                Все още без оценки
                            </p>
                        )}
                    </div>
                </div>

                {/* description */}
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">
                    {hookLine}
                </p>

                {/* online badge if there is a city */}
                {teacher.is_online && teacher.city && (
                    <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" aria-hidden />
                            Онлайн
                        </span>
                    </div>
                )}

                {/* cta */}
                <div className="mt-auto pt-2 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleViewProfile}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:ring-offset-1 rounded-lg py-1.5 -ml-1.5 transition-colors"
                    >
                        Виж профил
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={handleContact}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:ring-offset-1 rounded-lg py-1.5 transition-colors"
                    >
                        Свържи се
                    </button>
                </div>
            </div>
        </article>
    );
}
