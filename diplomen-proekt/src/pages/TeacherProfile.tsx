import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { useModalFocus } from "../hooks/useModalFocus";
import { useTeacherBooking } from "../hooks/useTeacherBooking";
import { useToast } from "../context/ToastContext";
import { AvatarImage } from "../components/AvatarImage";
import { AlertBanner } from "../components/ui/feedback/AlertBanner";
import { RatingStars } from "../components/RatingStars";
import { BookingSlotPicker } from "../components/teacher/BookingSlotPicker";
import { TeacherWeeklySchedule } from "../components/teacher/TeacherWeeklySchedule";
import type {
    Teacher,
    TeacherReview,
    TeacherAvailabilityRow,
    TeacherBookingSettingsRow,
    BookingFormState,
} from "../types/teacher";

const MODAL_LABEL = "block text-slate-700 text-[0.8125rem] font-semibold mb-1.5";
const MODAL_INPUT =
    "w-full border border-slate-200 focus:border-purple-500 text-slate-700 placeholder-slate-400 outline-none text-sm font-medium";
const MODAL_TEXTAREA = `${MODAL_INPUT} resize-none`;
const MODAL_FIELD_STYLE = { borderRadius: "0.625rem", padding: "0.75rem 0.875rem" } as const;

export const TeacherProfile = () => {
    const { id } = useParams<{ id: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactMessage, setContactMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [reviews, setReviews] = useState<TeacherReview[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [weeklyAvailability, setWeeklyAvailability] = useState<TeacherAvailabilityRow[]>([]);
    const [bookingSettings, setBookingSettings] = useState<TeacherBookingSettingsRow | null>(null);

    const showToast = useToast();
    const MAX_VISIBLE_REVIEWS = 3;
    const booking = useTeacherBooking(teacher, { showToast });

    const closeContactModal = () => {
        setShowContactModal(false);
        setContactMessage("");
    };
    const { modalRef: bookingModalRef } = useModalFocus(booking.showBookingModal, booking.closeBookingModal, {
        canClose: () => !booking.submitting,
    });
    const bookingSelectedRef = useRef<HTMLDivElement | null>(null);
    const { modalRef: contactModalRef } = useModalFocus(showContactModal, closeContactModal);
    const closeReviewModal = () => {
        setShowReviewModal(false);
        setReviewRating(0);
        setReviewComment("");
    };
    const { modalRef: reviewModalRef } = useModalFocus(showReviewModal, closeReviewModal);

    const loadTeacher = useCallback(async () => {
        if (!id || !user) return;
        setLoading(true);
        try {
            await ensureValidSession();
            const first = await supabase
                .from('teacher_profiles')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            let data = first.data;
            const error = first.error;

            if (error) {
                console.error('Error loading teacher:', error);
                navigate('/find-teacher');
                return;
            }
            if (!data) {
                const byUser = await supabase
                    .from('teacher_profiles')
                    .select('*')
                    .eq('user_id', id)
                    .maybeSingle();
                if (byUser.error) {
                    console.error('Error loading teacher by user_id:', byUser.error);
                    navigate('/find-teacher');
                    return;
                }
                data = byUser.data;
            }
            if (data) {
                // Fallback: use profiles.avatar_url if teacher_profiles.profile_picture is empty
                const userId = data.user_id;
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', userId)
                    .maybeSingle();
                const avatarUrl = (profileData as { avatar_url?: string | null } | null)?.avatar_url;
                const teacherUserId = data.user_id as string;
                const [avRes, setRes] = await Promise.all([
                    supabase
                        .from("teacher_availability")
                        .select("id, teacher_id, day_of_week, start_time, end_time")
                        .eq("teacher_id", teacherUserId)
                        .order("day_of_week"),
                    supabase
                        .from("teacher_booking_settings")
                        .select("lesson_duration_minutes, buffer_minutes, auto_accept_bookings")
                        .eq("teacher_id", teacherUserId)
                        .maybeSingle(),
                ]);
                setWeeklyAvailability((avRes.data as TeacherAvailabilityRow[]) ?? []);
                setBookingSettings((setRes.data as TeacherBookingSettingsRow | null) ?? null);
                setTeacher({
                    ...data,
                    profile_picture: data.profile_picture || avatarUrl || undefined,
                });
            } else {
                navigate('/find-teacher');
            }
        } catch (error) {
            console.error('Failed to load teacher:', error);
            navigate('/find-teacher');
        } finally {
            setLoading(false);
        }
    }, [id, user, navigate]);

    const refetchTeacherForRating = useCallback(async () => {
        if (!teacher?.id) return;
        try {
            const { data } = await supabase
                .from('teacher_profiles')
                .select('rating')
                .eq('id', teacher.id)
                .maybeSingle();
            if (data && (data as { rating?: number }).rating != null) {
                setTeacher((prev) => prev ? { ...prev, rating: (data as { rating: number }).rating } : null);
            }
        } catch {
            // ignore
        }
    }, [teacher?.id]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        if (id) loadTeacher();
    }, [authLoading, user, id, navigate, loadTeacher]);

    const loadReviews = useCallback(async (): Promise<TeacherReview[]> => {
        if (!teacher?.id) return [];
        const teacherId = teacher.id;
        try {
            const { data: reviewsData, error } = await supabase
                .from("teacher_reviews")
                .select("id, teacher_id, author_id, rating, comment, created_at")
                .eq("teacher_id", teacherId)
                .order("created_at", { ascending: false });
            if (error) {
                console.error("Error loading reviews:", error);
                return [];
            }
            const list = (reviewsData ?? []) as (TeacherReview & { author_id: string })[];
            const authorIds = [...new Set(list.map((r) => r.author_id))];
            const nameByUserId = new Map<string, string>();
            const avatarByUserId = new Map<string, string | null>();
            if (authorIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("id, first_name, last_name, avatar_url")
                    .in("id", authorIds);
                (profilesData ?? []).forEach((p: {
                    id: string;
                    first_name: string | null;
                    last_name: string | null;
                    avatar_url: string | null;
                }) => {
                    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Анонимен";
                    nameByUserId.set(p.id, name);
                    avatarByUserId.set(p.id, p.avatar_url ?? null);
                });
            }
            return list.map((r) => ({
                id: r.id,
                teacher_id: r.teacher_id,
                author_id: r.author_id,
                rating: r.rating,
                comment: r.comment,
                created_at: r.created_at,
                author_name: nameByUserId.get(r.author_id) ?? "Анонимен",
                author_avatar_url: avatarByUserId.get(r.author_id) ?? null,
            }));
        } catch (err) {
            console.error("Failed to load reviews:", err);
            return [];
        }
    }, [teacher?.id]);

    useEffect(() => {
        if (!teacher?.id) return;
        let cancelled = false;
        setLoadingReviews(true);
        loadReviews()
            .then((list) => {
                if (!cancelled) setReviews(list);
            })
            .finally(() => {
                if (!cancelled) setLoadingReviews(false);
            });
        return () => {
            cancelled = true;
        };
    }, [teacher?.id, loadReviews]);

    const handleSubmitReview = async () => {
        if (!teacher || !user || reviewRating < 1 || reviewRating > 5) return;
        setSubmittingReview(true);
        try {
            await ensureValidSession();
            const { error } = await supabase.from("teacher_reviews").insert({
                teacher_id: teacher.id,
                author_id: user.id,
                rating: reviewRating,
                comment: reviewComment.trim() || null,
            });
            if (error) {
                console.error("Error submitting review:", error);
                showToast("Грешка при изпращане на ревюто. Моля, опитайте отново.");
                return;
            }
            closeReviewModal();
            setLoadingReviews(true);
            loadReviews().then((list) => {
                setReviews(list);
            }).finally(() => setLoadingReviews(false));
            refetchTeacherForRating();
        } catch (err) {
            console.error("Failed to submit review:", err);
            showToast("Грешка при изпращане на ревюто. Моля, опитайте отново.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleContactTeacher = async () => {
        if (!teacher || !user || !contactMessage.trim()) {
            showToast("Моля, въведете съобщение");
            return;
        }
        if (user.id === teacher.user_id) {
            showToast("Не можете да изпращате съобщения до себе си.");
            return;
        }

        setSubmitting(true);
        try {
            await ensureValidSession();

            // create message/contact request 
            const { error } = await supabase
                .from('messages')
                .insert({
                    student_id: user.id,
                    teacher_id: teacher.user_id,
                    message: contactMessage,
                    created_at: new Date().toISOString(),
                    is_from_student: true
                });

            if (error) {
                console.error('Error sending message:', error);
                showToast("Грешка при изпращане на съобщението. Моля, опитайте отново.");
                return;
            }

            await supabase.from("hidden_conversations").delete().eq("user_id", user.id).eq("other_user_id", teacher.user_id);

            setSuccess(true);
            setShowContactModal(false);
            setContactMessage("");
            
            setTimeout(() => {
                setSuccess(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to send message:', error);
            showToast("Грешка при изпращане на съобщението. Моля, опитайте отново.");
        } finally {
            setSubmitting(false);
        }
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    if (authLoading || loading) {
        return (
            <div className="teacher-profile-page min-h-screen flex items-center justify-center relative">
                <div className="relative z-10 text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-purple-200 border-t-purple-700 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Зареждане...</p>
                </div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="teacher-profile-page min-h-screen flex items-center justify-center relative p-4">
                <div className="relative z-10 text-center teacher-profile-card p-8 sm:p-10 max-w-md">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">Учителят не е намерен</h2>
                    <button
                        onClick={() => navigate('/find-teacher')}
                        className="min-h-[44px] px-6 py-3 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 active:scale-[0.98] transition-all shadow-lg shadow-purple-700/20"
                    >
                        Назад към списъка
                    </button>
                </div>
            </div>
        );
    }

    const sectionCardClass = "teacher-profile-card teacher-profile-section-card";
    const sectionTitleClass = "text-slate-900";
    const sectionTitleStyle = { fontSize: "1.0625rem", fontWeight: 600 } as const;

    const displayRating =
        reviews.length > 0
            ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
            : (teacher.rating ?? 0);

    return (
        <div className="teacher-profile-page min-h-screen relative" style={{ padding: '2rem 2rem 2rem 3rem' }}>
            <div className="relative z-10 max-w-6xl mx-auto">
                {/* success message */}
                {success && (
                    <AlertBanner
                        variant="success"
                        message="Успешно изпълнено!"
                        className="mb-8 shadow-sm"
                    />
                )}

                {/* back button */}
                <button
                    onClick={() => navigate('/find-teacher')}
                    className="block mb-10 flex items-center gap-2 min-h-[44px] px-3 py-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/80 font-medium text-sm transition-all active:scale-[0.98]"
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Назад
                </button>

                {/* header */}
                <header className="mb-6 pb-5 border-b border-slate-200/80 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                    <div className="flex-shrink-0">
                        {teacher.profile_picture ? (
                            <img
                                src={teacher.profile_picture}
                                alt=""
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-200/80 shadow-md"
                            />
                        ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-600 text-3xl sm:text-4xl font-semibold border border-slate-200/80 shadow-md">
                                {teacher.full_name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="teacher-profile-headline text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
                            {teacher.full_name}
                        </h1>
                        <p className="text-slate-500 mt-1.5 text-base">
                            {teacher.subject}
                            {teacher.city && (
                                <>
                                    <span className="text-slate-400 mx-2" aria-hidden>·</span>
                                    {teacher.city}
                                </>
                            )}
                        </p>
                        {(teacher.hourly_rate != null || teacher.price_note) && (
                            <p className="mt-1.5 text-base font-semibold text-slate-800">
                                {teacher.hourly_rate != null && `${teacher.hourly_rate} €/час`}
                                {teacher.hourly_rate != null && teacher.price_note && " · "}
                                {teacher.price_note && teacher.price_note}
                            </p>
                        )}
                        <p className="mt-2 flex items-center gap-2 text-slate-600">
                            <RatingStars rating={Math.round(displayRating)} size="sm" />
                            <span className="text-sm font-medium">{displayRating.toFixed(1)}</span>
                            {reviews.length > 0 && (
                                <span className="text-slate-400 text-sm">({reviews.length} {reviews.length === 1 ? 'отзив' : 'отзива'})</span>
                            )}
                        </p>
                    </div>
                </header>

                <div className="lg:grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 lg:items-start">
                    {/* left column */}
                    <div className="flex flex-col gap-5 sm:gap-6">
                        {/* description */}
                        {teacher.description && (
                            <section className={sectionCardClass}>
                                <h2 className={sectionTitleClass} style={{ ...sectionTitleStyle, marginBottom: "0.625rem" }}>Описание</h2>
                                <p className="text-slate-600 text-[15px] leading-[1.6] whitespace-pre-line">
                                    {teacher.description}
                                </p>
                            </section>
                        )}

                        {/* education and qualifications */}
                        {(teacher.education || teacher.qualifications) && (
                            <section className={sectionCardClass}>
                                <h2 className={sectionTitleClass} style={{ ...sectionTitleStyle, marginBottom: "0.625rem" }}>Образование и квалификации</h2>
                                {teacher.education && (
                                    <p className="text-slate-600 text-[15px] mb-3">{teacher.education}</p>
                                )}
                                {teacher.qualifications && (
                                    <p className="text-slate-600 text-[15px] leading-[1.6] whitespace-pre-line">{teacher.qualifications}</p>
                                )}
                            </section>
                        )}

                        {/* price */}
                        {(teacher.hourly_rate != null || teacher.price_note) && (
                            <section className={sectionCardClass}>
                                <h2 className={sectionTitleClass} style={{ ...sectionTitleStyle, marginBottom: "0.625rem" }}>Цена</h2>
                                {teacher.hourly_rate != null && (
                                    <p className="text-slate-800 font-semibold text-[15px]">Цена за час: {teacher.hourly_rate} €</p>
                                )}
                                {teacher.price_note && (
                                    <p className="text-slate-600 text-[15px] mt-1">{teacher.price_note}</p>
                                )}
                            </section>
                        )}

                        {/* available schedule */}
                        {(weeklyAvailability.length > 0 || teacher.available_schedule) && (
                            <section className={sectionCardClass}>
                                <h2 className={sectionTitleClass} style={{ ...sectionTitleStyle, marginBottom: "0.375rem" }}>
                                    Наличен график
                                </h2>
                                <p className="text-slate-500" style={{ fontSize: "0.8125rem", marginBottom: "1rem", lineHeight: 1.5 }}>
                                    Седмичен шаблон — важи всяка седмица, без нужда от нов график всеки месец.
                                </p>
                                {weeklyAvailability.length > 0 ? (
                                    <TeacherWeeklySchedule
                                        availability={weeklyAvailability.map((a) => ({
                                            day_of_week: a.day_of_week,
                                            start_time: a.start_time,
                                            end_time: a.end_time,
                                        }))}
                                        lessonMinutes={bookingSettings?.lesson_duration_minutes ?? null}
                                    />
                                ) : (
                                    <p className="text-slate-600 text-[15px] leading-[1.6] whitespace-pre-line">
                                        {teacher.available_schedule}
                                    </p>
                                )}
                            </section>
                        )}

                        {/* reviews section */}
                        <section className={sectionCardClass}>
                            <div
                                className="flex flex-wrap items-center justify-between gap-3"
                                style={{ marginBottom: "1rem" }}
                            >
                                <div className="flex items-center" style={{ gap: "0.5rem" }}>
                                    <span className="material-icons text-purple-700" style={{ fontSize: "1.125rem" }}>
                                        rate_review
                                    </span>
                                    <h2 className={sectionTitleClass} style={sectionTitleStyle}>
                                        Отзиви от ученици
                                    </h2>
                                </div>
                                {user && user.id !== teacher.user_id && (
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewModal(true)}
                                        className="bg-purple-700 hover:bg-purple-800 text-white inline-flex items-center transition-colors"
                                        style={{
                                            gap: "0.375rem",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "0.625rem",
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        <span className="material-icons" style={{ fontSize: "1rem" }}>edit</span>
                                        Напиши ревю
                                    </button>
                                )}
                            </div>

                            {loadingReviews ? (
                                <div className="flex flex-col items-center justify-center" style={{ padding: "2.5rem 0", gap: "0.75rem" }}>
                                    <div
                                        className="animate-spin rounded-full border-2 border-slate-200 border-t-purple-600"
                                        style={{ width: "2rem", height: "2rem" }}
                                        aria-hidden
                                    />
                                    <p className="text-slate-500" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                                        Зареждане на отзиви...
                                    </p>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div
                                    className="bg-slate-50 border border-slate-100 text-center"
                                    style={{ borderRadius: "0.75rem", padding: "2.5rem 1.5rem" }}
                                >
                                    <span
                                        className="material-icons text-slate-300"
                                        style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}
                                    >
                                        reviews
                                    </span>
                                    <p className="text-slate-600" style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                                        Все още няма отзиви
                                    </p>
                                    <p className="text-slate-500" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
                                        {user && user.id !== teacher.user_id
                                            ? "Бъдете първият, който споделя опит от уроци с този учител."
                                            : "Отзивите от ученици ще се появят тук."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <ul
                                        className="border border-slate-200 overflow-hidden divide-y divide-slate-100"
                                        style={{ borderRadius: "0.75rem", listStyle: "none", margin: 0, padding: 0 }}
                                    >
                                        {(showAllReviews ? reviews : reviews.slice(0, MAX_VISIBLE_REVIEWS)).map((r) => {
                                            const dateStr = new Date(r.created_at).toLocaleDateString("bg-BG", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            });
                                            const authorInitial = (r.author_name ?? "А").charAt(0).toUpperCase();
                                            return (
                                                <li
                                                    key={r.id}
                                                    className="bg-white hover:bg-slate-50/80 transition-colors"
                                                    style={{ padding: "1rem 1.25rem" }}
                                                >
                                                    <div className="flex items-start" style={{ gap: "0.875rem" }}>
                                                        <AvatarImage
                                                            url={r.author_avatar_url}
                                                            alt={r.author_name ?? "Ученик"}
                                                            className="shrink-0 w-10 h-10 overflow-hidden border border-slate-200 rounded-[0.625rem]"
                                                            imgClassName="w-full h-full object-cover"
                                                            fallback={
                                                                <div
                                                                    className="flex items-center justify-center bg-purple-700 text-white shrink-0"
                                                                    style={{
                                                                        width: "2.5rem",
                                                                        height: "2.5rem",
                                                                        borderRadius: "0.625rem",
                                                                        fontSize: "0.875rem",
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    {authorInitial}
                                                                </div>
                                                            }
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className="flex flex-wrap items-center"
                                                                style={{ gap: "0.5rem", marginBottom: "0.375rem" }}
                                                            >
                                                                <span
                                                                    className="text-slate-900"
                                                                    style={{ fontSize: "0.875rem", fontWeight: 600 }}
                                                                >
                                                                    {r.author_name ?? "Анонимен ученик"}
                                                                </span>
                                                                <RatingStars rating={r.rating} size="sm" />
                                                                <span className="text-slate-400" style={{ fontSize: "0.6875rem", fontWeight: 500 }}>
                                                                    {dateStr}
                                                                </span>
                                                            </div>
                                                            {r.comment ? (
                                                                <p
                                                                    className="text-slate-600"
                                                                    style={{ fontSize: "0.875rem", lineHeight: 1.55 }}
                                                                >
                                                                    {r.comment}
                                                                </p>
                                                            ) : (
                                                                <p className="text-slate-400 italic" style={{ fontSize: "0.8125rem" }}>
                                                                    Без коментар
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    {reviews.length > MAX_VISIBLE_REVIEWS && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllReviews((v) => !v)}
                                            className="text-purple-700 hover:text-purple-900 transition-colors inline-flex items-center"
                                            style={{
                                                gap: "0.25rem",
                                                marginTop: "0.875rem",
                                                fontSize: "0.8125rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {showAllReviews ? "Свий" : `Виж всички (${reviews.length})`}
                                            <span className="material-icons" style={{ fontSize: "1.125rem" }}>
                                                {showAllReviews ? "expand_less" : "expand_more"}
                                            </span>
                                        </button>
                                    )}
                                </>
                            )}
                        </section>
                    </div>

                    {/* right column */}
                    <aside className="lg:sticky lg:top-6 lg:self-start">
                        <div className="teacher-profile-sidebar-card flex flex-col gap-5">
                            {/* supporting */}
                            <div className="flex gap-4 items-start">
                                <div className="flex-shrink-0">
                                    {teacher.profile_picture ? (
                                        <img
                                            src={teacher.profile_picture}
                                            alt=""
                                            className="teacher-profile-avatar-inline w-16 h-16 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="teacher-profile-avatar-inline w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 text-lg font-semibold">
                                            {teacher.full_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-800 truncate">{teacher.full_name}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{teacher.subject}</p>
                                    <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1">
                                            <RatingStars rating={Math.round(displayRating)} size="xs" />
                                            <span>{displayRating.toFixed(1)}</span>
                                        </span>
                                        {teacher.city && <span>{teacher.city}</span>}
                                        {teacher.is_online && (
                                            <span className="inline-flex items-center gap-1 text-emerald-600">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                                                Онлайн
                                            </span>
                                        )}
                                    </p>
                                    {(teacher.hourly_rate != null || teacher.price_note) && (
                                        <p className="mt-2 text-sm font-semibold text-slate-800">
                                            {teacher.hourly_rate != null ? `${teacher.hourly_rate} €/час` : null}
                                            {teacher.hourly_rate != null && teacher.price_note ? " · " : null}
                                            {teacher.price_note ?? ""}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* primary cta */}
                            <div className="pb-2">
                                {booking.canBookLesson ? (
                                    <button
                                        type="button"
                                        onClick={booking.openBookingModal}
                                        className="teacher-profile-btn-primary w-full min-h-[56px] px-5 py-3.5 text-white text-base font-semibold rounded-xl"
                                    >
                                        Запази час
                                    </button>
                                ) : booking.isOwnTeacherProfile ? (
                                    <div
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 text-center text-slate-600"
                                        style={{ padding: "1rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.45 }}
                                    >
                                        Не можете да запишете час при себе си.
                                    </div>
                                ) : null}
                            </div>

                            {/* details */}
                            <div className="border-t border-slate-200 pt-7">
                                <ul className="teacher-profile-checklist text-xs text-slate-500 space-y-1.5" aria-hidden>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500 shrink-0" aria-hidden>✓</span>
                                        Избор на дата и час
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500 shrink-0" aria-hidden>✓</span>
                                        Потвърждение от учителя
                                    </li>
                                </ul>
                            </div>

                            {/* secondary cta */}
                            {user && user.id !== teacher.user_id && (
                                <div className="border-t border-slate-200 pt-5">
                                    <button
                                        type="button"
                                        onClick={() => setShowContactModal(true)}
                                        className="teacher-profile-contact-btn w-full min-h-[48px] px-4 py-3 text-sm font-semibold rounded-xl border-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Свържи се с учителя
                                    </button>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                {/* booking modal */}
                {booking.showBookingModal && teacher && (
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto"
                        style={{ padding: "1.5rem" }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="booking-title"
                        aria-describedby="booking-desc"
                        onClick={(e) => {
                            if (e.target !== e.currentTarget || booking.submitting) return;
                            booking.closeBookingModal();
                        }}
                    >
                        <div
                            ref={bookingModalRef}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full shadow-xl max-h-[min(90vh,calc(100vh-3rem))] flex flex-col overflow-hidden"
                            style={{ maxWidth: "52rem", borderRadius: "1rem", margin: "2rem 0" }}
                        >
                            <div
                                className="flex-shrink-0 border-b border-slate-100"
                                style={{ padding: "1.5rem 2rem 1.25rem" }}
                            >
                                <div
                                    className="flex items-center justify-between"
                                    style={{ marginBottom: "0.75rem" }}
                                >
                                    <h2
                                        id="booking-title"
                                        className="text-slate-900"
                                        style={{
                                            fontSize: "1.25rem",
                                            fontWeight: 700,
                                            letterSpacing: "-0.01em",
                                        }}
                                    >
                                        Запази час
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={booking.closeBookingModal}
                                        disabled={booking.submitting}
                                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40"
                                        style={{ padding: "0.375rem", borderRadius: "0.5rem" }}
                                        aria-label="Затвори"
                                    >
                                        <span className="material-icons" style={{ fontSize: "1.25rem" }}>
                                            close
                                        </span>
                                    </button>
                                </div>
                                <div
                                    className="flex items-center bg-slate-50 border border-slate-100 min-w-0"
                                    style={{
                                        gap: "0.5rem",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "0.5rem",
                                    }}
                                >
                                    <span
                                        className="material-icons text-purple-700 shrink-0"
                                        style={{ fontSize: "1rem" }}
                                    >
                                        event
                                    </span>
                                    <span
                                        className="text-slate-700 truncate"
                                        style={{ fontSize: "0.875rem", fontWeight: 600 }}
                                    >
                                        {teacher.full_name}
                                        {booking.lessonDurationMinutes != null
                                            ? ` · ${booking.lessonDurationMinutes} мин`
                                            : ""}
                                    </span>
                                </div>
                            </div>
                            <div
                                id="booking-desc"
                                className="flex-1 min-h-0 overflow-y-auto space-y-5"
                                style={{ padding: "1.5rem 2rem" }}
                            >
                                {booking.submitting && !booking.bookingSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-4" style={{ gap: "0.75rem" }}>
                                        <div
                                            className="animate-spin rounded-full border-2 border-slate-200 border-t-purple-600"
                                            style={{ width: "2.5rem", height: "2.5rem" }}
                                            aria-hidden
                                        />
                                        <p className="text-slate-900 font-bold" style={{ fontSize: "1.125rem" }}>
                                            Записваме...
                                        </p>
                                        <p className="text-slate-500 text-sm">Моля, изчакайте.</p>
                                    </div>
                                ) : booking.bookingSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-4" style={{ gap: "0.5rem" }}>
                                        <span className="material-icons text-emerald-600" style={{ fontSize: "3rem" }}>
                                            check_circle
                                        </span>
                                        <p className="text-slate-900 font-bold" style={{ fontSize: "1.125rem" }}>
                                            Готово!
                                        </p>
                                        <p className="text-slate-500 text-sm" style={{ marginBottom: "0.75rem" }}>
                                            Пренасочваме...
                                        </p>
                                        <button
                                            type="button"
                                            onClick={booking.stayOnPage}
                                            className="text-sm font-semibold text-purple-700 hover:text-purple-800 transition-colors"
                                        >
                                            Остани на страницата
                                        </button>
                                    </div>
                                ) : booking.loadingSlots ? (
                                    <div className="flex flex-col items-center justify-center py-16" style={{ gap: "0.75rem" }}>
                                        <div
                                            className="animate-spin rounded-full border-2 border-slate-200 border-t-purple-600"
                                            style={{ width: "2rem", height: "2rem" }}
                                            aria-hidden
                                        />
                                        <p className="text-slate-500 text-sm font-medium">Зареждане на наличност...</p>
                                    </div>
                                ) : booking.loadSlotsError ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <span className="material-icons text-slate-400 mb-3" style={{ fontSize: "2.5rem" }}>
                                            error_outline
                                        </span>
                                        <p className="text-slate-900 font-semibold mb-1">Наличието не можа да се зареди</p>
                                        <p className="text-slate-500 text-sm mb-5">Проверете връзката и опитайте отново.</p>
                                        <button
                                            type="button"
                                            onClick={booking.retryLoadSlots}
                                            disabled={booking.loadingSlots}
                                            className="bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold transition-colors disabled:opacity-40 inline-flex items-center"
                                            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", gap: "0.375rem" }}
                                        >
                                            <span className="material-icons" style={{ fontSize: "1rem" }}>refresh</span>
                                            Опитай отново
                                        </button>
                                    </div>
                                ) : !booking.hasBookingSettings ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <span className="material-icons text-purple-600 mb-3" style={{ fontSize: "2.5rem" }}>
                                            event_busy
                                        </span>
                                        <p className="text-slate-900 font-semibold mb-1">
                                            Учителят не е настроил записване
                                        </p>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Свържете се с него чрез бутона „Свържи се с учителя“ на страницата.
                                        </p>
                                    </div>
                                ) : !booking.hasAvailability ? (
                                    <>
                                        <div
                                            className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-sm font-medium"
                                            style={{ padding: "0.75rem 0.875rem" }}
                                        >
                                            <span className="material-icons shrink-0" style={{ fontSize: "1.125rem" }}>
                                                info
                                            </span>
                                            <p className="leading-relaxed">
                                                Учителят все още не е настроил наличност. Можете да изберете дата и час ръчно.
                                            </p>
                                        </div>
                                        <div>
                                            <label className={MODAL_LABEL}>Дата</label>
                                            <input
                                                type="date"
                                                value={booking.bookingForm.date}
                                                onChange={(e) => booking.setBookingForm({ ...booking.bookingForm, date: e.target.value })}
                                                min={getMinDate()}
                                                className={MODAL_INPUT}
                                                style={MODAL_FIELD_STYLE}
                                            />
                                        </div>
                                        <div>
                                            <label className={MODAL_LABEL}>Час</label>
                                            <input
                                                type="time"
                                                value={booking.bookingForm.time}
                                                onChange={(e) => booking.setBookingForm({ ...booking.bookingForm, time: e.target.value })}
                                                className={MODAL_INPUT}
                                                style={MODAL_FIELD_STYLE}
                                            />
                                        </div>
                                        <div>
                                            <label className={MODAL_LABEL}>Съобщение (по избор)</label>
                                            <textarea
                                                value={booking.bookingForm.message}
                                                onChange={(e) => booking.setBookingForm((prev: BookingFormState) => ({ ...prev, message: e.target.value }))}
                                                placeholder="Добавете допълнителна информация..."
                                                rows={3}
                                                className={MODAL_TEXTAREA}
                                                style={{ ...MODAL_FIELD_STYLE, minHeight: "5.5rem" }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <BookingSlotPicker
                                            booking={booking}
                                            minDate={getMinDate()}
                                            selectedSummaryRef={bookingSelectedRef}
                                        />
                                    </>
                                )}
                            </div>
                            {booking.bookingNetworkError && (
                                <div
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0 border-t border-slate-100 bg-amber-50"
                                    style={{ padding: "0.875rem 1.5rem" }}
                                >
                                    <p className="text-sm text-amber-900 font-medium leading-relaxed flex items-start gap-2">
                                        <span className="material-icons shrink-0" style={{ fontSize: "1.125rem" }}>
                                            warning_amber
                                        </span>
                                        Възникна проблем с връзката. Проверете интернет и опитайте отново.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={booking.handleBookLesson}
                                        disabled={booking.submitting}
                                        className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 whitespace-nowrap inline-flex items-center"
                                        style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", gap: "0.375rem" }}
                                    >
                                        {booking.submitting ? "Изчакване..." : "Опитай отново"}
                                    </button>
                                </div>
                            )}
                            {!booking.bookingSuccess &&
                                !booking.submitting &&
                                !booking.loadingSlots && (
                                    <div
                                        className="flex items-center justify-end flex-shrink-0 border-t border-slate-100"
                                        style={{ gap: "0.625rem", padding: "1.25rem 2rem" }}
                                    >
                                        <button
                                            type="button"
                                            onClick={booking.closeBookingModal}
                                            disabled={booking.submitting}
                                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-40"
                                            style={{
                                                padding: "0.625rem 1.125rem",
                                                borderRadius: "0.75rem",
                                                fontSize: "0.875rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Затвори
                                        </button>
                                        <button
                                            type="button"
                                            onClick={booking.handleBookLesson}
                                            disabled={
                                                booking.submitting ||
                                                !booking.bookingForm.date ||
                                                !booking.bookingForm.time
                                            }
                                            className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-700/20"
                                            style={{
                                                padding: "0.625rem 1.25rem",
                                                borderRadius: "0.75rem",
                                                fontSize: "0.875rem",
                                                fontWeight: 600,
                                                gap: "0.375rem",
                                            }}
                                        >
                                            {booking.submitting ? (
                                                <span
                                                    className="inline-block border-2 border-white border-t-transparent rounded-full animate-spin"
                                                    style={{ width: "1rem", height: "1rem" }}
                                                    aria-hidden
                                                />
                                            ) : (
                                                <span className="material-icons" style={{ fontSize: "1rem" }}>
                                                    check
                                                </span>
                                            )}
                                            {booking.submitting ? "Запазване..." : "Запази"}
                                        </button>
                                    </div>
                                )}
                        </div>
                    </div>
                )}

                {/* contact modal */}
                {showContactModal && teacher && (
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto"
                        style={{ padding: "1.5rem" }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contact-title"
                        aria-describedby="contact-desc"
                        onClick={(e) => {
                            if (e.target !== e.currentTarget || submitting) return;
                            closeContactModal();
                        }}
                    >
                        <div
                            ref={contactModalRef}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full shadow-xl"
                            style={{ maxWidth: "36rem", borderRadius: "1rem", margin: "2rem 0" }}
                        >
                            <div style={{ padding: "2rem" }}>
                                <div style={{ marginBottom: "1.5rem" }}>
                                    <div
                                        className="flex items-center justify-between"
                                        style={{ marginBottom: "0.75rem" }}
                                    >
                                        <h2
                                            id="contact-title"
                                            className="text-slate-900"
                                            style={{
                                                fontSize: "1.25rem",
                                                fontWeight: 700,
                                                letterSpacing: "-0.01em",
                                            }}
                                        >
                                            Свържи се с учителя
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={closeContactModal}
                                            disabled={submitting}
                                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40"
                                            style={{ padding: "0.375rem", borderRadius: "0.5rem" }}
                                            aria-label="Затвори"
                                        >
                                            <span className="material-icons" style={{ fontSize: "1.25rem" }}>
                                                close
                                            </span>
                                        </button>
                                    </div>
                                    <div
                                        className="flex items-center bg-slate-50 border border-slate-100 min-w-0"
                                        style={{
                                            gap: "0.5rem",
                                            padding: "0.5rem 0.75rem",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <span
                                            className="material-icons text-purple-700 shrink-0"
                                            style={{ fontSize: "1rem" }}
                                        >
                                            mail
                                        </span>
                                        <span
                                            className="text-slate-700 truncate"
                                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                                        >
                                            {teacher.full_name}
                                        </span>
                                    </div>
                                </div>

                                <div id="contact-desc">
                                    <label className={MODAL_LABEL}>Съобщение</label>
                                    <textarea
                                        value={contactMessage}
                                        onChange={(e) => setContactMessage(e.target.value)}
                                        placeholder="Напишете вашето съобщение..."
                                        rows={6}
                                        disabled={submitting}
                                        className={MODAL_TEXTAREA}
                                        style={{ ...MODAL_FIELD_STYLE, minHeight: "8.5rem" }}
                                    />
                                </div>

                                <div
                                    className="flex items-center justify-end"
                                    style={{ gap: "0.5rem", marginTop: "1.5rem" }}
                                >
                                    <button
                                        type="button"
                                        onClick={closeContactModal}
                                        disabled={submitting}
                                        className="text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "0.5rem",
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Затвори
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleContactTeacher}
                                        disabled={submitting || !contactMessage.trim()}
                                        className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "0.5rem",
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                            gap: "0.375rem",
                                        }}
                                    >
                                        {submitting ? (
                                            <span
                                                className="inline-block border-2 border-white border-t-transparent rounded-full animate-spin"
                                                style={{ width: "1rem", height: "1rem" }}
                                                aria-hidden
                                            />
                                        ) : (
                                            <span className="material-icons" style={{ fontSize: "1rem" }}>
                                                send
                                            </span>
                                        )}
                                        {submitting ? "Изпращане..." : "Изпрати"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* review modal */}
                {showReviewModal && (
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto"
                        style={{ padding: "1.5rem" }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="review-title"
                        aria-describedby="review-desc"
                        onClick={(e) => {
                            if (e.target !== e.currentTarget || submittingReview) return;
                            closeReviewModal();
                        }}
                    >
                        <div
                            ref={reviewModalRef}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full shadow-xl"
                            style={{ maxWidth: "36rem", borderRadius: "1rem", margin: "2rem 0" }}
                        >
                            <div style={{ padding: "2rem" }}>
                                <div style={{ marginBottom: "1.5rem" }}>
                                    <div
                                        className="flex items-center justify-between"
                                        style={{ marginBottom: "0.75rem" }}
                                    >
                                        <h2
                                            id="review-title"
                                            className="text-slate-900"
                                            style={{
                                                fontSize: "1.25rem",
                                                fontWeight: 700,
                                                letterSpacing: "-0.01em",
                                            }}
                                        >
                                            Напиши ревю
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={closeReviewModal}
                                            disabled={submittingReview}
                                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40"
                                            style={{ padding: "0.375rem", borderRadius: "0.5rem" }}
                                            aria-label="Затвори"
                                        >
                                            <span className="material-icons" style={{ fontSize: "1.25rem" }}>
                                                close
                                            </span>
                                        </button>
                                    </div>
                                    <div
                                        className="flex items-center bg-slate-50 border border-slate-100 min-w-0"
                                        style={{
                                            gap: "0.5rem",
                                            padding: "0.5rem 0.75rem",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <span className="material-icons text-purple-700 shrink-0" style={{ fontSize: "1rem" }}>
                                            rate_review
                                        </span>
                                        <span
                                            className="text-slate-700 truncate"
                                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                                        >
                                            {teacher.full_name}
                                        </span>
                                    </div>
                                </div>

                                <div id="review-desc">
                                    <label className={MODAL_LABEL}>Рейтинг (1–5)</label>
                                    <div className="flex" style={{ gap: "0.375rem", marginBottom: "1rem" }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewRating(star)}
                                                className={`flex items-center justify-center border transition-colors ${
                                                    reviewRating >= star
                                                        ? "border-amber-200 bg-amber-50 text-amber-500"
                                                        : "border-slate-200 bg-white text-slate-300 hover:border-slate-300 hover:text-slate-400"
                                                }`}
                                                style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem" }}
                                                aria-label={`${star} звезди`}
                                            >
                                                <span className="material-icons" style={{ fontSize: "1.25rem" }}>
                                                    star
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <label className={MODAL_LABEL}>Коментар (по избор)</label>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Споделете как мина урокът..."
                                        rows={4}
                                        disabled={submittingReview}
                                        className={MODAL_TEXTAREA}
                                        style={{ ...MODAL_FIELD_STYLE, minHeight: "6.5rem" }}
                                    />
                                </div>

                                <div
                                    className="flex items-center justify-end"
                                    style={{ gap: "0.5rem", marginTop: "1.5rem" }}
                                >
                                    <button
                                        type="button"
                                        onClick={closeReviewModal}
                                        disabled={submittingReview}
                                        className="text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "0.5rem",
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Затвори
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmitReview}
                                        disabled={submittingReview || reviewRating < 1}
                                        className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "0.5rem",
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                            gap: "0.375rem",
                                        }}
                                    >
                                        {submittingReview ? (
                                            <span
                                                className="inline-block border-2 border-white border-t-transparent rounded-full animate-spin"
                                                style={{ width: "1rem", height: "1rem" }}
                                                aria-hidden
                                            />
                                        ) : (
                                            <span className="material-icons" style={{ fontSize: "1rem" }}>
                                                send
                                            </span>
                                        )}
                                        {submittingReview ? "Изпращане..." : "Изпрати ревю"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
