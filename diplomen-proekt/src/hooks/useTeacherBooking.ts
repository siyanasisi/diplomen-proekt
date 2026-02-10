import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import type { Teacher } from "../types/teacher";
import type {
    TeacherAvailabilityRow,
    TeacherBookingSettingsRow,
    TeacherBlockedSlotRow,
    TeacherScheduleExceptionRow,
    BookingFormState,
    BookingSlotRow,
    SlotInfo,
} from "../types/teacher";
import {
    generateSlotsForWeek,
    getStartOfWeekMonday,
    formatDateKey,
    normalizeSlotFromApi,
    normalizeBookingSlotInput,
} from "../utils/teacherSlots";
const REDIRECT_AFTER_BOOKING_MS = 2000;
const INITIAL_SLOTS_PER_DAY = 8;
const MAX_WEEKS_AHEAD = 12;

export type UseTeacherBookingOptions = {
    showToast?: (message: string) => void;
};

export function useTeacherBooking(teacher: Teacher | null, options: UseTeacherBookingOptions = {}) {
    const { showToast } = options;
    const { user } = useAuth();
    const navigate = useNavigate();
    const submittingRef = useRef(false);
    const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const formRef = useRef<BookingFormState>({ date: "", time: "", message: "" });

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingForm, setBookingForm] = useState<BookingFormState>({
        date: "",
        time: "",
        message: "",
    });
    formRef.current = bookingForm;
    const [submitting, setSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [availability, setAvailability] = useState<TeacherAvailabilityRow[]>([]);
    const [settings, setSettings] = useState<TeacherBookingSettingsRow | null>(null);
    const [blockedSlots, setBlockedSlots] = useState<TeacherBlockedSlotRow[]>([]);
    const [exceptions, setExceptions] = useState<TeacherScheduleExceptionRow[]>([]);
    const [existingBookings, setExistingBookings] = useState<BookingSlotRow[]>([]);
    const [weekStart, setWeekStart] = useState<Date>(() => getStartOfWeekMonday(new Date()));
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadSlotsError, setLoadSlotsError] = useState(false);
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
    const [bookingNetworkError, setBookingNetworkError] = useState(false);

    const loadSlots = useCallback(async (teacherUserId: string) => {
        const [avRes, setRes, blockRes, excRes, bookRes] = await Promise.all([
            supabase.from("teacher_availability").select("*").eq("teacher_id", teacherUserId).order("day_of_week"),
            supabase.from("teacher_booking_settings").select("*").eq("teacher_id", teacherUserId).maybeSingle(),
            supabase.from("teacher_blocked_slots").select("*").eq("teacher_id", teacherUserId),
            supabase.from("teacher_schedule_exceptions").select("*").eq("teacher_id", teacherUserId).order("exception_date"),
            supabase.from("bookings").select("lesson_date, lesson_time").eq("teacher_id", teacherUserId).in("status", ["pending", "confirmed"]),
        ]);
        setAvailability((avRes.data as TeacherAvailabilityRow[]) ?? []);
        setSettings((setRes.data as TeacherBookingSettingsRow | null) ?? null);
        setBlockedSlots((blockRes.data as TeacherBlockedSlotRow[]) ?? []);
        setExceptions((excRes.data as TeacherScheduleExceptionRow[]) ?? []);
        setExistingBookings((bookRes.data as BookingSlotRow[] | null)?.map(normalizeSlotFromApi) ?? []);
    }, []);

    useEffect(() => {
        if (!showBookingModal || !teacher) return;
        let cancelled = false;
        setLoadingSlots(true);
        setLoadSlotsError(false);
        (async () => {
            try {
                await ensureValidSession();
                await loadSlots(teacher.user_id);
            } catch (e) {
                console.error("Failed to load booking slots:", e);
                if (!cancelled) setLoadSlotsError(true);
            } finally {
                if (!cancelled) setLoadingSlots(false);
            }
        })();
        return () => { cancelled = true; };
    }, [showBookingModal, teacher, loadSlots]);

    const retryLoadSlots = useCallback(async () => {
        if (!teacher) return;
        setLoadSlotsError(false);
        setLoadingSlots(true);
        try {
            await ensureValidSession();
            await loadSlots(teacher.user_id);
        } catch (e) {
            console.error("Failed to load booking slots:", e);
            setLoadSlotsError(true);
        } finally {
            setLoadingSlots(false);
        }
    }, [teacher, loadSlots]);

    const hasAvailability = availability.length > 0 && settings;

    const generatedSlots = useMemo(() => {
        if (!hasAvailability) return [];
        return generateSlotsForWeek({
            availability,
            settings,
            blockedSlots,
            exceptions,
            existingBookings,
            weekStart,
            daysCount: 7,
        });
    }, [hasAvailability, availability, settings, blockedSlots, exceptions, existingBookings, weekStart]);

    const generatedSlotsFourWeeks = useMemo(() => {
        if (!hasAvailability) return [];
        return generateSlotsForWeek({
            availability,
            settings,
            blockedSlots,
            exceptions,
            existingBookings,
            weekStart: getStartOfWeekMonday(new Date()),
            daysCount: 28,
        });
    }, [hasAvailability, availability, settings, blockedSlots, exceptions, existingBookings]);

    const futureSlots = useMemo(() => {
        const now = new Date();
        return generatedSlots.filter((s) => new Date(s.date + "T" + s.time) > now);
    }, [generatedSlots]);

    const earliestFreeSlot = useMemo(() => {
        const now = new Date();
        const free = generatedSlotsFourWeeks.filter(
            (s) => new Date(s.date + "T" + s.time) > now && s.status === "free"
        );
        if (free.length === 0) return null;
        free.sort((a, b) => {
            const c = a.date.localeCompare(b.date);
            return c !== 0 ? c : a.time.localeCompare(b.time);
        });
        return free[0];
    }, [generatedSlotsFourWeeks]);

    const weekDates = useMemo(() => {
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [weekStart]);

    const canGoPrevWeek = useMemo(() => {
        const thisWeekStart = getStartOfWeekMonday(new Date());
        return weekStart.getTime() > thisWeekStart.getTime();
    }, [weekStart]);

    const canGoNextWeek = useMemo(() => {
        const thisWeekStart = getStartOfWeekMonday(new Date());
        const maxWeekStart = new Date(thisWeekStart);
        maxWeekStart.setDate(maxWeekStart.getDate() + (MAX_WEEKS_AHEAD - 1) * 7);
        return weekStart.getTime() < maxWeekStart.getTime();
    }, [weekStart]);

    const slotsByDay = useMemo(() => {
        const map = new Map<string, SlotInfo[]>();
        weekDates.forEach((d) => {
            const key = formatDateKey(d);
            const daySlots = futureSlots
                .filter((s) => s.date === key)
                .sort((a, b) => a.time.localeCompare(b.time));
            map.set(key, daySlots);
        });
        return map;
    }, [futureSlots, weekDates]);

    const openBookingModal = useCallback(() => setShowBookingModal(true), []);
    const closeBookingModal = useCallback(() => {
        if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current);
            redirectTimeoutRef.current = null;
        }
        setShowBookingModal(false);
        setBookingForm({ date: "", time: "", message: "" });
        setBookingSuccess(false);
        setBookingNetworkError(false);
    }, []);

    const stayOnPage = useCallback(() => {
        if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current);
            redirectTimeoutRef.current = null;
        }
        setBookingSuccess(false);
        setShowBookingModal(false);
        setBookingForm({ date: "", time: "", message: "" });
        setBookingNetworkError(false);
    }, []);

    const goPrevWeek = useCallback(() => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d);
    }, [weekStart]);
    const goNextWeek = useCallback(() => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d);
    }, [weekStart]);
    const goToDate = useCallback((date: Date) => setWeekStart(getStartOfWeekMonday(date)), []);

    const notify = useCallback(
        (message: string) => {
            showToast?.(message);
        },
        [showToast]
    );

    const handleBookLesson = useCallback(async () => {
        if (!teacher || !user) return;
        const form = formRef.current;
        const { date: normDate, time: normTime } = normalizeBookingSlotInput(form.date, form.time);
        if (!normDate || !normTime) {
            notify("Моля, изберете дата и час за урока.");
            return;
        }
        const slotDateTime = new Date(normDate + "T" + normTime);
        if (slotDateTime <= new Date()) {
            notify("Не можете да запазвате час с дата или час в миналото.");
            return;
        }
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        setBookingNetworkError(false);

        try {
            await ensureValidSession();

            const { data: existingForSlot } = await supabase
                .from("bookings")
                .select("id, lesson_time")
                .eq("teacher_id", teacher.user_id)
                .eq("lesson_date", normDate)
                .in("status", ["pending", "confirmed"]);
            const slotTaken = (existingForSlot ?? []).some(
                (row) => String(row.lesson_time).slice(0, 5) === normTime
            );
            if (slotTaken) {
                notify("Този час вече е зает. Моля, изберете друг слот.");
                return;
            }

            const status = settings?.auto_accept_bookings ? "confirmed" : "pending";
            const { error } = await supabase.from("bookings").insert({
                student_id: user.id,
                teacher_id: teacher.user_id,
                teacher_profile_id: teacher.id,
                lesson_date: normDate,
                lesson_time: normTime,
                message: form.message?.trim() || null,
                status,
            });

            if (error) {
                const isConflict = error.code === "23505" || error.message?.toLowerCase().includes("unique");
                notify(
                    isConflict
                        ? "Този час вече е зает. Моля, изберете друг слот."
                        : "Грешка при запазване на часа. Моля, опитайте отново."
                );
                return;
            }

            notify(settings?.auto_accept_bookings ? "Часът е записан и потвърден." : "Заявката е изпратена. Чакайте потвърждение от учителя.");
            setBookingSuccess(true);
            redirectTimeoutRef.current = window.setTimeout(() => {
                redirectTimeoutRef.current = null;
                closeBookingModal();
                setBookingSuccess(false);
                navigate("/home");
            }, REDIRECT_AFTER_BOOKING_MS);
        } catch (err) {
            console.error("Failed to book lesson:", err);
            const isNetworkError =
                err instanceof TypeError ||
                (err && typeof err === "object" && "message" in err && typeof (err as Error).message === "string" &&
                    /fetch|network|timeout|econnrefused|econnreset|enotfound/i.test((err as Error).message));
            if (isNetworkError) {
                setBookingNetworkError(true);
                notify("Възникна проблем с връзката. Използвайте „Опитай отново“ по-долу.");
            } else {
                notify("Грешка при запазване на часа. Моля, опитайте отново.");
            }
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    }, [teacher, user, settings, closeBookingModal, navigate, notify]);

    return {
        showBookingModal,
        openBookingModal,
        closeBookingModal,
        stayOnPage,
        bookingForm,
        setBookingForm,
        submitting,
        bookingSuccess,
        loadingSlots,
        loadSlotsError,
        retryLoadSlots,
        hasAvailability,
        hasBookingSettings: settings !== null,
        generatedSlots,
        generatedSlotsFourWeeks,
        futureSlots,
        earliestFreeSlot,
        weekDates,
        weekStart,
        slotsByDay,
        expandedDays,
        setExpandedDays,
        canGoPrevWeek,
        canGoNextWeek,
        goPrevWeek,
        goNextWeek,
        goToDate,
        handleBookLesson,
        formatDateKey,
        INITIAL_SLOTS_PER_DAY,
        bookingNetworkError,
        lessonDurationMinutes: settings?.lesson_duration_minutes ?? null,
    };
}
