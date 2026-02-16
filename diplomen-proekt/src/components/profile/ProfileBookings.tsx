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
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-4">Чакащи часове за потвърждение</h3>
            <div className="space-y-3">
                {bookings.map((b) => {
                    const initials = (b.student_name ?? "У")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                    return (
                        <div
                            key={b.id}
                            className="flex flex-wrap items-center justify-between p-4 bg-purple-700/5 border border-purple-700/20 rounded-2xl gap-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-sm">
                                    {initials}
                                </div>
                                <div>
                                    <p className="font-bold">{b.student_name ?? "Ученик"}</p>
                                    <p className="text-xs text-slate-500">
                                        {b.lesson_date} {String(b.lesson_time).slice(0, 5)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={actingOnBookingId !== null}
                                    onClick={() => onConfirm(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                    className="px-4 py-2 bg-purple-700 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {actingOnBookingId === b.id ? "..." : "Потвърди"}
                                </button>
                                <button
                                    type="button"
                                    disabled={actingOnBookingId !== null}
                                    onClick={() => onCancel(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {actingOnBookingId === b.id ? "..." : "Откажи"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

interface MyBookingsProps {
    bookings: StudentBooking[];
    onCancel: (id: string, teacherId: string, lessonDate: string, lessonTime: string) => void;
}

export function MyBookings({ bookings, onCancel }: MyBookingsProps) {
    if (bookings.length === 0) return null;

    return (
        <section>
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xl font-bold text-slate-800">Моите записани часове</h3>
            </div>
            <div
                id="my-bookings"
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm scroll-mt-6"
            >
                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-6">
                        Тук виждате записаните от вас часове. Ще получите съобщение в чата, когато учителят потвърди или откаже.
                    </p>
                    <div className="space-y-3">
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
                                <div
                                    key={b.id}
                                    className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-purple-700/10 flex items-center justify-center text-purple-700">
                                            <span className="material-icons">schedule</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">
                                                {dateStr} в {timeStr} ч.
                                            </p>
                                            <p className="text-sm text-slate-500 font-medium">{b.teacher_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {isPending ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                                                <span className="material-icons text-base">hourglass_empty</span>
                                                Чака потвърждение
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                                                <span className="material-icons text-base">check_circle</span>
                                                Потвърден
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onCancel(b.id, b.teacher_id, b.lesson_date, b.lesson_time)}
                                            className="text-slate-400 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-wider"
                                        >
                                            Откажи час
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
