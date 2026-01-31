import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";

interface Teacher {
    id: string;
    user_id: string;
    full_name: string;
    profile_picture?: string;
    subject: string;
    description: string;
    rating: number;
    city?: string;
    is_online: boolean;
    education?: string;
    qualifications?: string;
    available_schedule?: string;
    email?: string;
}

interface BookingForm {
    date: string;
    time: string;
    message: string;
}

export const TeacherProfile = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [bookingForm, setBookingForm] = useState<BookingForm>({
        date: "",
        time: "",
        message: ""
    });
    const [contactMessage, setContactMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        if (id) {
            loadTeacher();
        }
    }, [user, id, navigate]);

    const loadTeacher = async () => {
        if (!id || !user) return;
        
        try {
            await ensureValidSession();
            
            const { data, error } = await supabase
                .from('teacher_profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error loading teacher:', error);
                navigate('/find-teacher');
            } else if (data) {
                setTeacher(data);
            }
        } catch (error) {
            console.error('Failed to load teacher:', error);
            navigate('/find-teacher');
        } finally {
            setLoading(false);
        }
    };

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

    const handleBookLesson = async () => {
        if (!teacher || !user || !bookingForm.date || !bookingForm.time) {
            alert("Моля, попълнете всички полета");
            return;
        }

        setSubmitting(true);
        try {
            await ensureValidSession();

            // create booking
            const { error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    student_id: user.id,
                    teacher_id: teacher.user_id,
                    teacher_profile_id: teacher.id,
                    lesson_date: bookingForm.date,
                    lesson_time: bookingForm.time,
                    message: bookingForm.message,
                    status: 'pending'
                });

            if (bookingError) {
                console.error('Error creating booking:', bookingError);
                alert("Грешка при запазване на часа. Моля, опитайте отново.");
                return;
            }

            // add to calendar
            const dateKey = bookingForm.date; 
            const eventText = `Урок с ${teacher.full_name} - ${teacher.subject} в ${bookingForm.time}`;

            const { error: calendarError } = await supabase
                .from('calendar_events')
                .insert({
                    user_id: user.id,
                    date: dateKey,
                    event_text: eventText
                });

            if (calendarError) {
                console.error('Error adding to calendar:', calendarError);
            }

            setSuccess(true);
            setShowBookingModal(false);
            setBookingForm({ date: "", time: "", message: "" });
            
            setTimeout(() => {
                setSuccess(false);
                navigate('/home');
            }, 2000);
        } catch (error) {
            console.error('Failed to book lesson:', error);
            alert("Грешка при запазване на часа. Моля, опитайте отново.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleContactTeacher = async () => {
        if (!teacher || !user || !contactMessage.trim()) {
            alert("Моля, въведете съобщение");
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
                alert("Грешка при изпращане на съобщението. Моля, опитайте отново.");
                return;
            }

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
            alert("Грешка при изпращане на съобщението. Моля, опитайте отново.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <svg
                key={i}
                className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    const getMinDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 1);
        return today.toISOString().split('T')[0];
    };

    if (loading) {
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
                                {renderStars(Math.round(teacher.rating))}
                                <span className="text-lg font-semibold text-slate-700">
                                    {teacher.rating.toFixed(1)}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {teacher.is_online && (
                                    <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                                        Онлайн уроци
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
                        onClick={() => setShowBookingModal(true)}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
                    >
                        Запази час
                    </button>
                </div>

                {/* booking modal */}
                {showBookingModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-purple-200/40">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">Запази час</h2>
                                <button
                                    onClick={() => {
                                        setShowBookingModal(false);
                                        setBookingForm({ date: "", time: "", message: "" });
                                    }}
                                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Дата
                                    </label>
                                    <input
                                        type="date"
                                        value={bookingForm.date}
                                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                                        min={getMinDate()}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-900 focus:ring-4 focus:ring-purple-900/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Час
                                    </label>
                                    <input
                                        type="time"
                                        value={bookingForm.time}
                                        onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-900 focus:ring-4 focus:ring-purple-900/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Съобщение (по избор)
                                    </label>
                                    <textarea
                                        value={bookingForm.message}
                                        onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                                        placeholder="Добавете допълнителна информация..."
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-900 focus:ring-4 focus:ring-purple-900/10 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowBookingModal(false);
                                        setBookingForm({ date: "", time: "", message: "" });
                                    }}
                                    className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
                                >
                                    Откажи
                                </button>
                                <button
                                    onClick={handleBookLesson}
                                    disabled={submitting || !bookingForm.date || !bookingForm.time}
                                    className="flex-1 px-4 py-3 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Запазване..." : "Запази"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* contact modal */}
                {showContactModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-purple-200/40">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">Свържи се с учителя</h2>
                                <button
                                    onClick={() => {
                                        setShowContactModal(false);
                                        setContactMessage("");
                                    }}
                                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div>
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
                                    onClick={() => {
                                        setShowContactModal(false);
                                        setContactMessage("");
                                    }}
                                    className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
                                >
                                    Откажи
                                </button>
                                <button
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
            </div>
        </div>
    );
};
