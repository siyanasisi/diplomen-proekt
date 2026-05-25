import type { PendingBooking, StudentBooking } from "../../hooks/useProfile";
import { AlertBanner } from "../ui/feedback/AlertBanner";

function canCancelBefore24h(lessonDate: string, lessonTime: string): boolean {
    const normalizedTime = `${String(lessonTime).slice(0, 5)}:00`;
    const lessonDateTime = new Date(`${lessonDate}T${normalizedTime}`);
    if (Number.isNaN(lessonDateTime.getTime())) return false;
    return lessonDateTime.getTime() - Date.now() >= 24 * 60 * 60 * 1000;
}

function formatLessonDate(lessonDate: string): string {
    try {
        return new Date(lessonDate + "T12:00").toLocaleDateString("bg-BG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch {
        return lessonDate;
    }
}

interface PendingBookingsProps {
    bookings: PendingBooking[];
    actingOnBookingId: string | null;
    onConfirm: (id: string, studentId: string, lessonDate: string, lessonTime: string) => void;
    onCancel: (id: string, studentId: string, lessonDate: string, lessonTime: string) => void;
}

export function PendingBookings({ bookings, actingOnBookingId, onConfirm, onCancel }: PendingBookingsProps) {
    if (bookings.length === 0) return null;

    return (
        <section
            className="bg-white border border-slate-100 shadow-sm"
            style={{ borderRadius: "1rem", padding: "2rem" }}
        >
            <div style={{ marginBottom: "1.25rem" }}>
                <h3
                    className="text-slate-900"
                    style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em" }}
                >
                    Чакащи часове за потвърждение
                </h3>
                <div
                    className="flex items-center bg-slate-50 border border-slate-100 mt-3"
                    style={{ gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", width: "fit-content" }}
                >
                    <span className="material-icons text-purple-700" style={{ fontSize: "1rem" }}>
                        pending_actions
                    </span>
                    <span className="text-slate-700" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        {bookings.length} {bookings.length === 1 ? "заявка" : "заявки"}
                    </span>
                </div>
            </div>
            <div className="flex flex-col" style={{ gap: "0.75rem" }}>
                {bookings.map((b) => {
                    const initials = (b.student_name ?? "У")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                    const timeStr = String(b.lesson_time).slice(0, 5);
                    return (
                        <div
                            key={b.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between border border-slate-200 bg-slate-50/50"
                            style={{ gap: "1rem", padding: "1rem", borderRadius: "0.75rem" }}
                        >
                            <div className="flex items-center min-w-0" style={{ gap: "0.875rem" }}>
                                <div
                                    className="bg-purple-700 text-white flex items-center justify-center font-bold shrink-0"
                                    style={{
                                        width: "2.5rem",
                                        height: "2.5rem",
                                        borderRadius: "0.625rem",
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <p
                                        className="text-slate-900 truncate"
                                        style={{ fontSize: "0.9375rem", fontWeight: 600 }}
                                    >
                                        {b.student_name ?? "Ученик"}
                                    </p>
                                    <p className="text-slate-500" style={{ fontSize: "0.8125rem", marginTop: "0.125rem" }}>
                                        {formatLessonDate(b.lesson_date)} · {timeStr} ч.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center shrink-0" style={{ gap: "0.5rem" }}>
                                <button
                                    type="button"
                                    disabled={actingOnBookingId !== null}
                                    onClick={() => onConfirm(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                    className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        padding: "0.5rem 1rem",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                        gap: "0.375rem",
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: "1rem" }}>
                                        check
                                    </span>
                                    {actingOnBookingId === b.id ? "..." : "Потвърди"}
                                </button>
                                <button
                                    type="button"
                                    disabled={actingOnBookingId !== null}
                                    onClick={() => onCancel(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                    className="text-slate-600 hover:bg-white border border-slate-200 transition-colors disabled:opacity-40"
                                    style={{
                                        padding: "0.5rem 1rem",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                    }}
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
        <section id="my-bookings" className="scroll-mt-6">
            <div
                className="bg-white border border-slate-100 shadow-sm"
                style={{ borderRadius: "1rem", padding: "2rem" }}
            >
                <div style={{ marginBottom: "1.5rem" }}>
                    <h3
                        className="text-slate-900"
                        style={{
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            letterSpacing: "-0.01em",
                            marginBottom: "0.75rem",
                        }}
                    >
                        Моите записани часове
                    </h3>
                    <div
                        className="flex items-center bg-slate-50 border border-slate-100"
                        style={{
                            gap: "0.5rem",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.5rem",
                            width: "fit-content",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <span className="material-icons text-purple-700" style={{ fontSize: "1rem" }}>
                            schedule
                        </span>
                        <span className="text-slate-700" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                            {bookings.length} {bookings.length === 1 ? "записан час" : "записани часа"}
                        </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                        Тук виждате записаните от вас часове. Ще получите съобщение в чата, когато учителят
                        потвърди или откаже.
                    </p>
                </div>

                <div className="flex flex-col" style={{ gap: "1rem" }}>
                    {bookings.map((b) => {
                        const timeStr = String(b.lesson_time).slice(0, 5);
                        const canCancel = canCancelBefore24h(b.lesson_date, b.lesson_time);
                        const dateStr = formatLessonDate(b.lesson_date);
                        const isPending = b.status === "pending";
                        const lessonDate = new Date(b.lesson_date + "T12:00");

                        return (
                            <div
                                key={b.id}
                                className="border border-slate-200 bg-white"
                                style={{ borderRadius: "0.75rem", padding: "1.25rem 1.5rem" }}
                            >
                                <div className="flex items-start min-w-0" style={{ gap: "1.25rem" }}>
                                    <div
                                        className="flex-shrink-0 flex flex-col items-center justify-center bg-purple-700 text-white"
                                        style={{
                                            width: "3.5rem",
                                            borderRadius: "0.625rem",
                                            padding: "0.625rem 0",
                                        }}
                                    >
                                        <span
                                            className="uppercase"
                                            style={{ fontSize: "0.5625rem", fontWeight: 600, opacity: 0.9 }}
                                        >
                                            {lessonDate.toLocaleDateString("bg-BG", { weekday: "short" })}
                                        </span>
                                        <span
                                            className="tabular-nums"
                                            style={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1 }}
                                        >
                                            {lessonDate.toLocaleDateString("bg-BG", { day: "numeric" })}
                                        </span>
                                        <span
                                            style={{ fontSize: "0.5625rem", fontWeight: 500, opacity: 0.85 }}
                                        >
                                            {lessonDate.toLocaleDateString("bg-BG", { month: "short" })}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <p
                                            className="text-slate-900"
                                            style={{ fontSize: "1rem", fontWeight: 600, lineHeight: 1.35 }}
                                        >
                                            {timeStr} ч. · {b.teacher_name}
                                        </p>
                                        <p
                                            className="text-slate-500"
                                            style={{
                                                fontSize: "0.875rem",
                                                marginTop: "0.375rem",
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {dateStr}
                                        </p>
                                    </div>
                                </div>

                                {!canCancel && (
                                    <AlertBanner
                                        variant="warning"
                                        message="Отказът е заключен (по-малко от 24ч преди часа)"
                                        role="status"
                                        style={{ marginTop: "1rem", fontSize: "0.8125rem" }}
                                    />
                                )}

                                <div
                                    className="flex flex-wrap items-center justify-end border-t border-slate-100"
                                    style={{ gap: "0.75rem", marginTop: "1.25rem", paddingTop: "1.25rem" }}
                                >
                                    {isPending ? (
                                        <span
                                            className="inline-flex items-center bg-amber-50 text-amber-800 border border-amber-200"
                                            style={{
                                                gap: "0.5rem",
                                                padding: "0.5rem 0.875rem",
                                                borderRadius: "0.5rem",
                                                fontSize: "0.8125rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: "1rem" }}>
                                                hourglass_empty
                                            </span>
                                            Чака потвърждение
                                        </span>
                                    ) : (
                                        <span
                                            className="inline-flex items-center bg-emerald-50 text-emerald-800 border border-emerald-200"
                                            style={{
                                                gap: "0.5rem",
                                                padding: "0.5rem 0.875rem",
                                                borderRadius: "0.5rem",
                                                fontSize: "0.8125rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            <span
                                                className="material-icons text-emerald-600"
                                                style={{ fontSize: "1rem" }}
                                            >
                                                check_circle
                                            </span>
                                            Потвърден
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        disabled={!canCancel}
                                        onClick={() =>
                                            onCancel(b.id, b.teacher_id, b.lesson_date, b.lesson_time)
                                        }
                                        title={
                                            canCancel
                                                ? "Откажи час"
                                                : "Отказът е възможен само до 24 часа преди часа"
                                        }
                                        className="text-red-600 hover:bg-red-50 flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:text-slate-400"
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "0.5rem",
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                            gap: "0.5rem",
                                        }}
                                    >
                                        <span className="material-icons" style={{ fontSize: "1.125rem" }}>
                                            delete
                                        </span>
                                        Откажи час
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
