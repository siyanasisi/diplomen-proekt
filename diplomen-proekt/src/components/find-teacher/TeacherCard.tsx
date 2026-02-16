import { useNavigate } from "react-router-dom";
import { AvatarImage } from "../AvatarImage";
import { RatingStars } from "../RatingStars";
import type { Teacher } from "../../types/teacher";

interface TeacherCardProps {
    teacher: Teacher;
    isLoggedIn: boolean;
}

function formatPrice(teacher: Teacher): string | null {
    if (teacher.hourly_rate != null && teacher.hourly_rate > 0) {
        return `${teacher.hourly_rate} €/час`;
    }
    if (teacher.price_note?.trim()) return teacher.price_note.trim();
    return null;
}

function getDisplayRating(rating: number | undefined | null): number {
    return rating != null && Number.isFinite(rating) ? rating : 0;
}

export function TeacherCard({ teacher, isLoggedIn }: TeacherCardProps) {
    const navigate = useNavigate();
    const displayRating = getDisplayRating(teacher.rating);
    const hasRating = displayRating > 0;
    const priceStr = formatPrice(teacher);
    const qualification = (teacher.qualifications ?? teacher.education ?? "").trim();

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
        e.stopPropagation();
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            navigate(`/teacher/${teacher.id}`, { state: { scrollToContact: true } });
        }
    };

    const handleCardKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleViewProfile(e as unknown as React.MouseEvent);
        }
    };

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={handleViewProfile}
            onKeyDown={handleCardKeyDown}
            className="find-teacher-card group relative flex h-full flex-col bg-white overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-slate-400 transition-all duration-300 ease-out cursor-pointer"
            style={{ borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            data-testid="teacher-card"
            aria-label={`Виж профил на ${teacher.full_name}`}
        >
            {/* badges row */}
            <div className="flex flex-wrap items-center" style={{ padding: '1.25rem 1.25rem 0', gap: '0.375rem' }}>
                <span className="inline-flex items-center text-indigo-700 bg-indigo-50" style={{ gap: '0.25rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '0.5rem' }}>
                    {teacher.subject}
                </span>
                {displayRating >= 4.5 && displayRating > 0 && (
                    <span className="inline-flex items-center text-amber-700 bg-amber-50" style={{ gap: '0.25rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '0.5rem' }} title="Висок рейтинг">
                        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Популярен
                    </span>
                )}
                {teacher.city && (
                    <span className="inline-flex items-center text-slate-600 bg-slate-100" style={{ gap: '0.25rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 500, borderRadius: '0.5rem' }}>
                        <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {teacher.city}
                    </span>
                )}
                {teacher.is_online && !teacher.city && (
                    <span className="inline-flex items-center text-emerald-700 bg-emerald-50" style={{ gap: '0.25rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 500, borderRadius: '0.5rem' }}>
                        <span className="bg-emerald-500 rounded-full" style={{ width: '0.375rem', height: '0.375rem' }} aria-hidden />
                        Онлайн
                    </span>
                )}
                {teacher.offers_online_lessons && (
                    <span className="inline-flex items-center text-violet-700 bg-violet-50" style={{ gap: '0.25rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 500, borderRadius: '0.5rem' }} title="Предлага онлайн обучение">
                        <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Онлайн обучение
                    </span>
                )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col" style={{ padding: '1rem 1.25rem 1.25rem' }}>
                {/* avatar & name */}
                <div className="flex items-start" style={{ gap: '1rem', marginBottom: '0.875rem' }}>
                    <div className="relative flex-shrink-0">
                        <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem', overflow: 'hidden' }} className="ring-2 ring-white shadow">
                            <AvatarImage
                                url={teacher.profile_picture}
                                fallback={
                                    <div className="bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white shadow-inner" style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem' }}>
                                        <span className="relative font-bold drop-shadow-sm" style={{ fontSize: '1.5rem' }}>
                                            {teacher.full_name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="absolute text-white/90" style={{ bottom: '0.25rem', right: '0.25rem', width: '1.25rem', height: '1.25rem' }} aria-hidden>
                                            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                                                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                            </svg>
                                        </span>
                                    </div>
                                }
                                imgClassName="w-full h-full object-cover"
                                alt={teacher.full_name}
                            />
                        </div>
                        {teacher.is_online && (
                            <span
                                className="absolute bg-emerald-500 border-2 border-white rounded-full"
                                style={{ bottom: '-0.125rem', right: '-0.125rem', width: '0.75rem', height: '0.75rem' }}
                                title="Онлайн"
                                aria-hidden
                            />
                        )}
                    </div>
                    <div className="flex-1 min-w-0" style={{ paddingTop: '0.125rem' }}>
                        <h3 className="text-slate-900 truncate leading-tight tracking-tight" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                            {teacher.full_name}
                        </h3>
                        {hasRating ? (
                            <div className="flex items-center" style={{ gap: '0.375rem', marginTop: '0.5rem' }}>
                                <RatingStars rating={Math.round(displayRating)} size="xs" />
                                <span className="font-medium text-gray-500" style={{ fontSize: '0.8125rem' }}>
                                    {displayRating.toFixed(1)}
                                </span>
                            </div>
                        ) : (
                            <p className="inline-flex flex-wrap items-center text-gray-600 leading-none" style={{ marginTop: '0.625rem', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>
                                <span className="inline-flex items-center gap-1">
                                    <span className="shrink-0 text-amber-400" aria-hidden>
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </span>
                                    Бъди първият, който ще оцени
                                </span>
                                <span className="inline-flex items-center bg-emerald-100 text-emerald-700 uppercase tracking-wide" style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.625rem', fontWeight: 700 }} title="Скоро добавен профил">
                                    Нов
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                {/* rating, price, qualification, online */}
                <div className="flex flex-col" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {priceStr && (
                        <div className="flex items-center text-slate-700" style={{ gap: '0.625rem', fontSize: '0.9375rem' }}>
                            <span className="flex-shrink-0 text-slate-400" aria-hidden>
                                <svg className="w-[1.125rem] h-[1.125rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <span style={{ fontWeight: 600 }}>{priceStr}</span>
                        </div>
                    )}
                    {qualification && (
                        <div className="flex items-start text-slate-600" style={{ gap: '0.625rem', fontSize: '0.9375rem' }}>
                            <span className="flex-shrink-0 text-slate-400" style={{ marginTop: '0.125rem' }} aria-hidden>
                                <svg className="w-[1.125rem] h-[1.125rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                </svg>
                            </span>
                            <span className="line-clamp-2 leading-snug">{qualification}</span>
                        </div>
                    )}
                </div>

                {/* cta */}
                <div className="mt-auto flex flex-wrap items-center opacity-80 transition-opacity duration-200 group-hover:opacity-100" style={{ paddingTop: '0.75rem', gap: '0.5rem' }}>
                    <span className="inline-flex items-center text-white bg-purple-700 group-hover:bg-purple-800 transition-colors pointer-events-none" style={{ gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, padding: '0.5rem 0.875rem', borderRadius: '0.5rem' }}>
                        Виж профил
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                    <button
                        type="button"
                        onClick={handleContact}
                        className="inline-flex items-center text-slate-600 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 border border-slate-200 bg-transparent transition-colors"
                        style={{ gap: '0.375rem', fontSize: '0.875rem', fontWeight: 500, padding: '0.5rem 0.875rem', borderRadius: '0.5rem' }}
                    >
                        Свържи се
                    </button>
                </div>
            </div>
        </article>
    );
}
