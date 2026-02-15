import type { PendingBooking, StudentBooking } from "../../hooks/useProfile";

interface PendingBookingsProps {
    bookings: PendingBooking[];
    actingOnBookingId: string | null;
    onConfirm: (id: string, studentId: string, lessonDate: string, lessonTime: string) => void;
    onCancel: (id: string, studentId: string, lessonDate: string, lessonTime: string) => void;
}

export function PendingBookings({ bookings, actingOnBookingId, onConfirm, onCancel }: PendingBookingsProps) {
    if (bookings.length === 0) return null;

    return (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-8 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                Чакащи часове за потвърждение
            </h3>
            <p className="text-sm text-slate-600 mb-4">Потвърдете или откажете записаните от учениците часове.</p>
            <ul className="space-y-3">
                {bookings.map((b) => (
                    <li
                        key={b.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-purple-200/60 bg-purple-50/40 p-4"
                    >
                        <span className="font-semibold text-slate-800">
                            {b.lesson_date} {String(b.lesson_time).slice(0, 5)}
                        </span>
                        <span className="text-slate-600">{b.student_name}</span>
                        {b.message && (
                            <span className="text-sm text-slate-500 truncate max-w-xs" title={b.message}>
                                {b.message}
                            </span>
                        )}
                        <div className="ml-auto flex gap-2">
                            <button
                                type="button"
                                disabled={actingOnBookingId !== null}
                                onClick={() => onConfirm(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-sm font-medium hover:bg-purple-800 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {actingOnBookingId === b.id ? "..." : "Потвърди"}
                            </button>
                            <button
                                type="button"
                                disabled={actingOnBookingId !== null}
                                onClick={() => onCancel(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {actingOnBookingId === b.id ? "..." : "Откажи"}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

interface MyBookingsProps {
    bookings: StudentBooking[];
    onCancel: (id: string, teacherId: string, lessonDate: string, lessonTime: string) => void;
}

export function MyBookings({ bookings, onCancel }: MyBookingsProps) {
    if (bookings.length === 0) return null;

    return (
        <div
            id="my-bookings"
            className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-8 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 scroll-mt-6"
        >
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                Моите записани часове
            </h3>
            <p className="text-sm text-slate-600 mb-4">
                Тук виждате записаните от вас часове. Ще получите съобщение в чата, когато учителят потвърди или откаже.
            </p>
            <ul className="space-y-3">
                {bookings.map((b) => {
                    const timeStr = String(b.lesson_time).slice(0, 5);
                    const dateStr = (() => {
                        try {
                            return new Date(b.lesson_date + "T12:00").toLocaleDateString("bg-BG", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            });
                        } catch {
                            return b.lesson_date;
                        }
                    })();
                    const isPending = b.status === "pending";
                    return (
                        <li
                            key={b.id}
                            className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${
                                isPending ? "border-amber-200/80 bg-amber-50/50" : "border-emerald-200/60 bg-emerald-50/40"
                            }`}
                        >
                            <span className="font-semibold text-slate-800">
                                {dateStr} в {timeStr} ч.
                            </span>
                            <span className="text-slate-600">{b.teacher_name}</span>
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold ${
                                    isPending
                                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                            >
                                {isPending ? <>⏳ Чака потвърждение</> : <>✓ Потвърден</>}
                            </span>
                            <button
                                type="button"
                                onClick={() => onCancel(b.id, b.teacher_id, b.lesson_date, b.lesson_time)}
                                className="ml-auto px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-100 hover:border-red-200 hover:text-red-700"
                            >
                                Откажи час
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
