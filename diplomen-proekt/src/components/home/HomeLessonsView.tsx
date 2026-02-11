import type { HomeState } from "./types";

type HomeLessonsViewProps = {
    variant: "teacher" | "student";
    home: HomeState;
};

export function HomeLessonsView({ variant, home }: HomeLessonsViewProps) {
    const {
        activeMenu,
        role,
        lessonsLoading,
        pendingBookings,
        studentBookings,
        actingOnBookingId,
        navigate,
        handleConfirmBooking,
        handleCancelByTeacher,
        handleCancelMyBooking,
        formatDateLessons,
    } = home;

    if (variant === "teacher") {
        return (
            <>
{/* lessons view - teacher */}
                        {activeMenu === 'lessons' && role === 'teacher' && (
                            <div className="max-w-3xl">
                                <header className="mb-14 pb-8 border-b border-slate-200/80">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Часове</h2>
                                    </div>
                                    <p className="text-slate-500 text-[15px] ml-[52px]">Чакащи потвърждение и потвърдени часове. Можете да откажете час при нужда.</p>
                                </header>
                                {lessonsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-28 gap-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                                        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                                        <p className="text-sm text-slate-500 font-medium">Зареждане...</p>
                                    </div>
                                ) : pendingBookings.length === 0 ? (
                                    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-20 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Няма записани часове</h3>
                                        <p className="text-slate-500 text-[15px] max-w-sm mx-auto">Нови записи от ученици ще се появят тук. Можете да ги потвърдите или откажете.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {(() => {
                                            const pending = pendingBookings.filter((b) => (b.status ?? "pending") === "pending");
                                            const confirmed = pendingBookings.filter((b) => b.status === "confirmed");
                                            const renderBooking = (b: { id: string; lesson_date: string; lesson_time: string; message: string | null; student_id: string; status: string; student_name?: string }, showConfirm: boolean) => {
                                                const lessonDate = new Date(b.lesson_date + "T12:00");
                                                const weekday = lessonDate.toLocaleDateString("bg-BG", { weekday: "short" });
                                                const day = lessonDate.toLocaleDateString("bg-BG", { day: "numeric" });
                                                const month = lessonDate.toLocaleDateString("bg-BG", { month: "short" });
                                                return (
                                                    <li
                                                        key={b.id}
                                                        className="group rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-slate-200 transition-all duration-200"
                                                    >
                                                        <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                                                            <div className="flex items-center gap-5 min-w-0 flex-1">
                                                                <div className="flex-shrink-0 w-[72px] rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center py-2.5 shadow-sm">
                                                                    <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">{weekday}</span>
                                                                    <span className="text-2xl font-bold leading-none tabular-nums">{day}</span>
                                                                    <span className="text-[11px] font-medium opacity-80">{month}</span>
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="font-semibold text-slate-900 text-[15px]">
                                                                        {String(b.lesson_time).slice(0, 5)} ч.
                                                                    </p>
                                                                    <p className="text-slate-600 text-[15px] mt-0.5 truncate">{b.student_name}</p>
                                                                    {b.message && (
                                                                        <p className="text-sm text-slate-400 mt-2 truncate max-w-sm" title={b.message}>{b.message}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2.5 sm:flex-shrink-0 border-t border-slate-100 pt-5 sm:pt-0 sm:border-t-0">
                                                                {showConfirm && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={actingOnBookingId !== null}
                                                                        onClick={() => handleConfirmBooking(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
                                                                    >
                                                                        {actingOnBookingId === b.id ? "Изчакване..." : "Потвърди"}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    disabled={actingOnBookingId !== null}
                                                                    onClick={() => handleCancelByTeacher(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-colors"
                                                                >
                                                                    Откажи час
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            };
                                            return (
                                                <>
                                                    {pending.length > 0 && (
                                                        <section>
                                                            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3">Чакащи потвърждение</h3>
                                                            <ul className="space-y-3">
                                                                {pending.map((b) => renderBooking(b, true))}
                                                            </ul>
                                                        </section>
                                                    )}
                                                    {confirmed.length > 0 && (
                                                        <section>
                                                            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3">Потвърдени часове</h3>
                                                            <ul className="space-y-3">
                                                                {confirmed.map((b) => renderBooking(b, false))}
                                                            </ul>
                                                        </section>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        
            </>
        );
    }

    return (
        <>
{/* lessons view - student */}
                    {activeMenu === 'lessons' && role === 'student' && (
                        <div className="max-w-3xl">
                            <header className="mb-14 pb-8 border-b border-slate-200/80">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Часове</h2>
                                </div>
                                <p className="text-slate-500 text-[15px] ml-[52px]">Вашите записани уроци. Ще получите съобщение в чата при потвърждение или отказ.</p>
                            </header>
                            {lessonsLoading ? (
                                <div className="flex flex-col items-center justify-center py-28 gap-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                                    <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                                    <p className="text-sm text-slate-500 font-medium">Зареждане...</p>
                                </div>
                            ) : studentBookings.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-20 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Нямате записани часове</h3>
                                    <p className="text-slate-500 text-[15px] max-w-sm mx-auto mb-10">Намерете учител и запишете час — той ще се появи тук и ще получите известие при потвърждение.</p>
                                    <button
                                        onClick={() => navigate("/find-teacher")}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                                    >
                                        Намери учител
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {studentBookings.map((b) => {
                                        const isPending = b.status === "pending";
                                        const lessonDate = new Date(b.lesson_date + "T12:00");
                                        const weekday = lessonDate.toLocaleDateString("bg-BG", { weekday: "short" });
                                        const day = lessonDate.toLocaleDateString("bg-BG", { day: "numeric" });
                                        const month = lessonDate.toLocaleDateString("bg-BG", { month: "short" });
                                        return (
                                            <li
                                                key={b.id}
                                                className="group rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-slate-200 transition-all duration-200"
                                            >
                                                <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                                                    <div className="flex items-center gap-5 min-w-0 flex-1">
                                                        <div className="flex-shrink-0 w-[72px] rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center py-2.5 shadow-sm">
                                                            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">{weekday}</span>
                                                            <span className="text-2xl font-bold leading-none tabular-nums">{day}</span>
                                                            <span className="text-[11px] font-medium opacity-80">{month}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-slate-900 text-[15px]">
                                                                {String(b.lesson_time).slice(0, 5)} ч. · {b.teacher_name}
                                                            </p>
                                                            <p className="text-slate-500 text-[15px] mt-0.5">
                                                                {formatDateLessons(b.lesson_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 sm:flex-shrink-0 border-t border-slate-100 pt-5 sm:pt-0 sm:border-t-0">
                                                        <span
                                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium ${
                                                                isPending
                                                                    ? "bg-amber-50 text-amber-800 border border-amber-200/70"
                                                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                                                            }`}
                                                        >
                                                            {isPending ? (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                    Чака потвърждение
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                                    Потвърден
                                                                </>
                                                            )}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelMyBooking(b.id, b.teacher_id ?? '', b.lesson_date, b.lesson_time)}
                                                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:text-red-600 transition-colors"
                                                        >
                                                            Откажи час
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}

                    
        </>
    );
}
