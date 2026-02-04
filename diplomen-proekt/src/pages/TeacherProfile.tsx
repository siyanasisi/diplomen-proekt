import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { useModalFocus } from "../hooks/useModalFocus";
import { useTeacherBooking } from "../hooks/useTeacherBooking";
import { useToast } from "../context/ToastContext";
import { RatingStars } from "../components/RatingStars";
import type { Teacher, TeacherReview, BookingFormState } from "../types/teacher";
import { getDayNameBg } from "../utils/teacherSlots";

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
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [reviews, setReviews] = useState<TeacherReview[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    const showToast = useToast();
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
                setTeacher(data);
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

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        if (id) loadTeacher();
    }, [authLoading, user, id, navigate, loadTeacher]);

    const loadChatMessages = async () => {
        if (!user || !teacher) return;

        setLoadingChat(true);
        try {
            await ensureValidSession();

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('student_id', user.id)
                .eq('teacher_id', teacher.user_id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error loading chat messages:', error);
            } else if (data) {
                setChatMessages(data);
            }
        } catch (error) {
            console.error('Failed to load chat messages:', error);
        } finally {
            setLoadingChat(false);
        }
    };

    useEffect(() => {
        if (user && teacher) {
            loadChatMessages();
        }
    }, [user, teacher]);

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
            if (authorIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("id, first_name, last_name")
                    .in("id", authorIds);
                (profilesData ?? []).forEach((p: { id: string; first_name: string | null; last_name: string | null }) => {
                    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Анонимен";
                    nameByUserId.set(p.id, name);
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

        setSubmitting(true);
        try {
            await ensureValidSession();

            // create message/contact request 
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    student_id: user.id,
                    teacher_id: teacher.user_id,
                    message: contactMessage,
                    created_at: new Date().toISOString(),
                    is_from_student: true
                })
                .select('*')
                .single();

            if (error) {
                console.error('Error sending message:', error);
                showToast("Грешка при изпращане на съобщението. Моля, опитайте отново.");
                return;
            }

            // ако ученикът беше „изтрил“ чата с този учител, премахни го от скритите – така в страницата Чатове ще се покаже отново
            await supabase.from("hidden_conversations").delete().eq("user_id", user.id).eq("other_user_id", teacher.user_id);

            // update local chat state so the new message appears immediately
            if (data) {
                setChatMessages((prev) => [...prev, data]);
            } else {
                loadChatMessages();
            }

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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-slate-700">Зареждане...</p>
                </div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Учителят не е намерен</h2>
                    <button
                        onClick={() => navigate('/find-teacher')}
                        className="px-6 py-3 bg-purple-900 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors"
                    >
                        Назад към списъка
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* success message */}
                {success && (
                    <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-green-800 font-semibold">Успешно изпълнено!</p>
                    </div>
                )}

                {/* back button */}
                <button
                    onClick={() => navigate('/find-teacher')}
                    className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Назад
                </button>

                {/* profile card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-purple-200/40 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* profile picture */}
                        <div className="flex-shrink-0">
                            {teacher.profile_picture ? (
                                <img
                                    src={teacher.profile_picture}
                                    alt={teacher.full_name}
                                    className="w-32 h-32 rounded-2xl object-cover border-4 border-purple-200/40 shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center text-white text-4xl font-bold border-4 border-purple-200/40 shadow-lg">
                                    {teacher.full_name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* info */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                {teacher.full_name}
                            </h1>
                            <p className="text-xl font-semibold text-purple-700 mb-3">
                                {teacher.subject}
                            </p>
                            <div className="flex items-center gap-2 mb-4">
                                <RatingStars rating={Math.round(teacher.rating ?? 0)} size="md" />
                                <span className="text-lg font-semibold text-slate-700">
                                    {(teacher.rating ?? 0).toFixed(1)}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {teacher.is_online && (
                                    <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                                        Онлайн в момента
                                    </span>
                                )}
                                {teacher.offers_online_lessons && (
                                    <span className="px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                                        Предлага онлайн уроци
                                    </span>
                                )}
                                {teacher.city && (
                                    <span className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                                        {teacher.city}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* description */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-purple-200/40 mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Описание</h2>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {teacher.description}
                    </p>
                </div>

                {/* price */}
                {(teacher.hourly_rate != null || teacher.price_note) && (
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-purple-200/40 mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Цена</h2>
                        {teacher.hourly_rate != null && (
                            <p className="text-lg font-bold text-slate-900">Цена за час: {teacher.hourly_rate} €</p>
                        )}
                        {teacher.price_note && (
                            <p className="text-slate-700 mt-1">{teacher.price_note}</p>
                        )}
                    </div>
                )}

                {/* education and qualifications */}
                {(teacher.education || teacher.qualifications) && (
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-purple-200/40 mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Образование и квалификации</h2>
                        {teacher.education && (
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-purple-700 mb-2">Образование</h3>
                                <p className="text-slate-700">{teacher.education}</p>
                            </div>
                        )}
                        {teacher.qualifications && (
                            <div>
                                <h3 className="text-sm font-semibold text-purple-700 mb-2">Квалификации</h3>
                                <p className="text-slate-700 whitespace-pre-line">{teacher.qualifications}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* available schedule */}
                {teacher.available_schedule && (
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-purple-200/40 mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Наличен график</h2>
                        <p className="text-slate-700 whitespace-pre-line">{teacher.available_schedule}</p>
                    </div>
                )}

                {/* reviews */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-purple-200/40 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Коментари от ученици</h2>
                        {user && user.id !== teacher.user_id && (
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(true)}
                                className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white text-sm font-semibold rounded-xl transition-colors"
                            >
                                Напиши ревю
                            </button>
                        )}
                    </div>
                    {loadingReviews ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-4 border-purple-900 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <p className="text-slate-600">Все още няма коментари. Бъдете първият, който ще оцени!</p>
                    ) : (
                        <ul className="space-y-4">
                            {reviews.map((r) => (
                                <li
                                    key={r.id}
                                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <RatingStars rating={r.rating} size="sm" />
                                        <span className="text-sm font-semibold text-slate-700">{r.author_name}</span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(r.created_at).toLocaleDateString("bg-BG", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    {r.comment && <p className="text-slate-700 text-sm whitespace-pre-wrap">{r.comment}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* chat section */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-purple-200/40 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Чат с учителя</h2>
                            <p className="text-sm text-slate-600">
                                Вижте историята на съобщенията си с този учител
                            </p>
                        </div>
                        <button
                            onClick={loadChatMessages}
                            disabled={loadingChat}
                            className="px-4 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg
                                className={`w-4 h-4 ${loadingChat ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Обнови
                        </button>
                    </div>

                    <div className="h-64 border border-slate-200 rounded-2xl p-4 bg-slate-50/60 overflow-y-auto space-y-3">
                        {loadingChat ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-4 border-purple-900 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs text-slate-600 font-semibold">Зареждане на чат...</p>
                                </div>
                            </div>
                        ) : chatMessages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center">
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">Все още няма съобщения.</p>
                                    <p className="text-xs text-slate-500">
                                        Използвайте бутона &quot;Свържи се с учителя&quot;, за да започнете чат.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            chatMessages.map((msg) => {
                                const isStudent = msg.is_from_student !== false;
                                const msgDate = new Date(msg.created_at);
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm text-sm ${
                                                isStudent
                                                    ? 'bg-purple-900 text-white rounded-br-sm'
                                                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                            <p
                                                className={`mt-1 text-[10px] ${
                                                    isStudent ? 'text-purple-100/80' : 'text-slate-400'
                                                }`}
                                            >
                                                {msgDate.toLocaleTimeString('bg-BG', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}{' '}
                                                · {isStudent ? 'Вие' : 'Учител'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* action buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setShowContactModal(true)}
                        className="flex-1 px-6 py-4 bg-white border-2 border-purple-900 text-purple-900 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                        Свържи се с учителя
                    </button>
                    <button
                        onClick={booking.openBookingModal}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
                    >
                        Запази час
                    </button>
                </div>

                {/* booking modal */}
                {booking.showBookingModal && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
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
                            className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-purple-200/40"
                        >
                            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                <div>
                                    <h2 id="booking-title" className="text-xl font-bold text-slate-900">Запази час</h2>
                                    {booking.lessonDurationMinutes != null && (
                                        <p className="text-sm text-slate-500 mt-0.5">Урокът е {booking.lessonDurationMinutes} мин</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={booking.closeBookingModal}
                                    disabled={booking.submitting}
                                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                    aria-label="Затвори"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div id="booking-desc" className="flex-1 min-h-0 overflow-y-auto space-y-4">
                                {booking.submitting && !booking.bookingSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-4">
                                        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                                            <span className="inline-block w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" aria-hidden />
                                        </div>
                                        <p className="text-xl font-bold text-slate-900 mb-1">Записваме...</p>
                                        <p className="text-slate-600">Моля, изчакайте.</p>
                                    </div>
                                ) : booking.bookingSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-4">
                                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                                            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-xl font-bold text-slate-900 mb-1">Готово!</p>
                                        <p className="text-slate-600 mb-4">Пренасочваме...</p>
                                        <button
                                            type="button"
                                            onClick={booking.stayOnPage}
                                            className="text-sm font-medium text-purple-700 hover:text-purple-800 underline focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
                                        >
                                            Остани на страницата
                                        </button>
                                    </div>
                                ) : booking.loadingSlots ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-10 h-10 border-4 border-purple-900 border-t-transparent rounded-full animate-spin" aria-hidden />
                                    </div>
                                ) : booking.loadSlotsError ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <p className="text-slate-700 font-medium mb-2">Наличието не можа да се зареди.</p>
                                        <p className="text-slate-500 text-sm mb-4">Проверете връзката и опитайте отново.</p>
                                        <button
                                            type="button"
                                            onClick={booking.retryLoadSlots}
                                            disabled={booking.loadingSlots}
                                            className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-semibold transition-colors disabled:opacity-50"
                                        >
                                            Опитай отново
                                        </button>
                                    </div>
                                ) : !booking.hasBookingSettings ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <p className="text-slate-700 font-medium mb-2">
                                            Учителят не е настроил записване.
                                        </p>
                                        <p className="text-slate-600 text-sm">
                                            Свържете се с него чрез бутона „Свържи се с учителя“ по-долу на страницата.
                                        </p>
                                    </div>
                                ) : !booking.hasAvailability ? (
                                    <>
                                        <p className="text-slate-600 text-sm">
                                            Учителят все още не е настроил наличност за уроци. Можете да изберете дата и час ръчно.
                                        </p>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Дата</label>
                                            <input
                                                type="date"
                                                value={booking.bookingForm.date}
                                                onChange={(e) => booking.setBookingForm({ ...booking.bookingForm, date: e.target.value })}
                                                min={getMinDate()}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-900 focus:ring-4 focus:ring-purple-900/10 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Час</label>
                                            <input
                                                type="time"
                                                value={booking.bookingForm.time}
                                                onChange={(e) => booking.setBookingForm({ ...booking.bookingForm, time: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-900 focus:ring-4 focus:ring-purple-900/10 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Съобщение (по избор)</label>
                                            <textarea
                                                value={booking.bookingForm.message}
                                                onChange={(e) => booking.setBookingForm((prev: BookingFormState) => ({ ...prev, message: e.target.value }))}
                                                placeholder="Добавете допълнителна информация..."
                                                rows={3}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-900 focus:ring-4 focus:ring-purple-900/10 outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {booking.earliestFreeSlot && (
                                            <div className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200/80">
                                                <p className="text-sm text-slate-700">
                                                    <span className="font-semibold text-emerald-800">Най-ранен свободен час:</span>{" "}
                                                    {new Date(booking.earliestFreeSlot.date + "T12:00").toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}{" "}
                                                    в {booking.earliestFreeSlot.time}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const slot = booking.earliestFreeSlot;
                                                        if (!slot) return;
                                                        booking.goToDate(new Date(slot.date + "T12:00"));
                                                        booking.setBookingForm((prev) => ({ ...prev, date: slot.date, time: slot.time }));
                                                    }}
                                                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 underline"
                                                >
                                                    Отиди там
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <button type="button" onClick={booking.goPrevWeek} disabled={!booking.canGoPrevWeek} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent" aria-label="Предишна седмица">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm font-semibold text-slate-700 tabular-nums">
                                                    {booking.weekDates[0]?.toLocaleDateString("bg-BG", { day: "numeric", month: "short" })} – {booking.weekDates[6]?.toLocaleDateString("bg-BG", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                                <input
                                                    type="date"
                                                    className="sr-only"
                                                    onChange={(e) => booking.goToDate(new Date(e.target.value + "T12:00"))}
                                                    id="booking-date-picker"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => (document.getElementById("booking-date-picker") as HTMLInputElement | null)?.showPicker?.()}
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    Избор на друга дата
                                                </button>
                                            </div>
                                            <button type="button" onClick={booking.goNextWeek} disabled={!booking.canGoNextWeek} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent" aria-label="Следваща седмица">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto pb-2 -mx-1 flex gap-4">
                                            {booking.weekDates.map((d) => {
                                                const dateKey = booking.formatDateKey(d);
                                                const daySlots = booking.slotsByDay.get(dateKey) ?? [];
                                                const isExpanded = booking.expandedDays.has(dateKey);
                                                const visibleSlots = isExpanded ? daySlots : daySlots.slice(0, booking.INITIAL_SLOTS_PER_DAY);
                                                const hasMore = daySlots.length > booking.INITIAL_SLOTS_PER_DAY && !isExpanded;
                                                const dayName = getDayNameBg(d.getDay() === 0 ? 7 : d.getDay()).toLowerCase();
                                                const dateStr = `${d.getDate().toString().padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
                                                return (
                                                    <div key={dateKey} className="flex-shrink-0 w-[140px] sm:w-[160px] flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                                                        <div className="p-3 bg-white border-b border-slate-200">
                                                            <p className="font-semibold text-slate-800 capitalize text-sm">{dayName}</p>
                                                            <p className="text-xs text-slate-500 tabular-nums">{dateStr}</p>
                                                        </div>
                                                        <div className="p-2 flex-1 min-h-[120px]">
                                                            <div className="grid grid-cols-2 gap-1.5">
                                                                {visibleSlots.map((slot) => {
                                                                    const isFree = slot.status === "free";
                                                                    const isBlocked = slot.status === "blocked";
                                                                    const selected = booking.bookingForm.date === dateKey && booking.bookingForm.time === slot.time;
                                                                    return (
                                                                        <button
                                                                            key={slot.time}
                                                                            type="button"
                                                                            onClick={() => isFree && booking.setBookingForm((prev) => ({ ...prev, date: dateKey, time: slot.time }))}
                                                                            disabled={!isFree}
                                                                            className={`flex items-center justify-between gap-0.5 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                                                isFree
                                                                                    ? "bg-white border-2 border-emerald-500 text-emerald-800 hover:bg-emerald-50"
                                                                                    : isBlocked
                                                                                    ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed bg-[repeating-linear-gradient(-45deg,transparent,transparent_3px,rgba(0,0,0,0.04)_3px,rgba(0,0,0,0.04)_6px)]"
                                                                                    : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                                                                            } ${selected ? "ring-2 ring-purple-600 ring-offset-1" : ""}`}
                                                                        >
                                                                            <span className="tabular-nums">{slot.time}</span>
                                                                            {isFree && (
                                                                                <span className="flex items-center gap-0.5">
                                                                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                                                                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" /></svg>
                                                                                </span>
                                                                            )}
                                                                            {!isFree && (
                                                                                <span className="flex items-center gap-0.5 opacity-60">
                                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" /></svg>
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {hasMore && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => booking.setExpandedDays((prev) => new Set(prev).add(dateKey))}
                                                                    className="w-full mt-2 py-2 rounded-lg border-2 border-emerald-500 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors"
                                                                >
                                                                    Още
                                                                </button>
                                                            )}
                                                            {daySlots.length === 0 && (
                                                                <p className="text-xs text-slate-400 py-4 text-center">Няма слотове</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {booking.bookingForm.date && booking.bookingForm.time && (
                                            <div ref={bookingSelectedRef} className="pt-4 border-t border-slate-200 space-y-3">
                                                <p className="text-sm font-semibold text-slate-700">
                                                    Избрахте: {new Date(booking.bookingForm.date + "T12:00").toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" })} в {booking.bookingForm.time}
                                                </p>
                                                <label className="block text-sm font-semibold text-slate-700">Съобщение (по избор)</label>
                                                <textarea
                                                    value={booking.bookingForm.message}
                                                    onChange={(e) => booking.setBookingForm((prev: BookingFormState) => ({ ...prev, message: e.target.value }))}
                                                    placeholder="Добавете допълнителна информация..."
                                                    rows={3}
                                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-900 focus:ring-4 focus:ring-purple-900/10 outline-none transition-all resize-none"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            {booking.bookingNetworkError && (
                                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0">
                                    <p className="text-sm text-amber-900 font-medium">
                                        Възникна проблем с връзката. Проверете интернет и опитайте отново.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={booking.handleBookLesson}
                                        disabled={booking.submitting}
                                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        {booking.submitting ? "Изчакване..." : "Опитай отново"}
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 flex-shrink-0">
                                <button type="button" onClick={booking.closeBookingModal} disabled={booking.submitting} className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none">
                                    Откажи
                                </button>
                                <button
                                    type="button"
                                    onClick={booking.handleBookLesson}
                                    disabled={booking.submitting || !booking.bookingForm.date || !booking.bookingForm.time}
                                    className="flex-1 px-4 py-3 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {booking.submitting ? "Запазване..." : "Запази"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* contact modal */}
                {showContactModal && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contact-title"
                        aria-describedby="contact-desc"
                    >
                        <div
                            ref={contactModalRef}
                            className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-purple-200/40"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 id="contact-title" className="text-2xl font-bold text-slate-900">Свържи се с учителя</h2>
                                <button
                                    type="button"
                                    onClick={closeContactModal}
                                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                                    aria-label="Затвори"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div id="contact-desc">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Съобщение
                                </label>
                                <textarea
                                    value={contactMessage}
                                    onChange={(e) => setContactMessage(e.target.value)}
                                    placeholder="Напишете вашето съобщение..."
                                    rows={6}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-900 focus:ring-4 focus:ring-purple-900/10 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeContactModal}
                                    className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
                                >
                                    Откажи
                                </button>
                                <button
                                    type="button"
                                    onClick={handleContactTeacher}
                                    disabled={submitting || !contactMessage.trim()}
                                    className="flex-1 px-4 py-3 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Изпращане..." : "Изпрати"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* review modal */}
                {showReviewModal && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="review-title"
                        aria-describedby="review-desc"
                    >
                        <div
                            ref={reviewModalRef}
                            className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-purple-200/40"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 id="review-title" className="text-2xl font-bold text-slate-900">Напиши ревю</h2>
                                <button
                                    type="button"
                                    onClick={closeReviewModal}
                                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                                    aria-label="Затвори"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div id="review-desc" className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Рейтинг (1–5)</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewRating(star)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    reviewRating >= star
                                                        ? "text-amber-400"
                                                        : "text-slate-300 hover:text-slate-400"
                                                }`}
                                                aria-label={`${star} звезди`}
                                            >
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Коментар (по избор)</label>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Оставете коментар..."
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-900 focus:ring-4 focus:ring-purple-900/10 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeReviewModal}
                                    className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
                                >
                                    Откажи
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitReview}
                                    disabled={submittingReview || reviewRating < 1}
                                    className="flex-1 px-4 py-3 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingReview ? "Изпращане..." : "Изпрати ревю"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
