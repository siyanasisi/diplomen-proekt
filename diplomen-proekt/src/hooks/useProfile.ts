import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase, ensureValidSession } from "../supabase-client";
import { useNavigate } from "react-router-dom";
import type {
    TeacherAvailabilityRow,
    TeacherBookingSettingsRow,
    TeacherBlockedSlotRow,
    TeacherScheduleExceptionRow,
} from "../types/teacher";
import type { TeacherAvailabilityFormData } from "../components/teacher-availability/TeacherAvailabilityForm";
import { sendBookingEmail } from "../utils/sendBookingEmail";

export interface PendingBooking {
    id: string;
    lesson_date: string;
    lesson_time: string;
    message: string | null;
    student_id: string;
    student_name?: string;
}

export interface StudentBooking {
    id: string;
    lesson_date: string;
    lesson_time: string;
    status: string;
    teacher_name: string;
    teacher_profile_id: string;
    teacher_id: string;
}

export interface TeacherProfileData {
    hourly_rate: number | null;
    price_note: string | null;
    offers_online_lessons: boolean;
    description: string;
}

export interface CalendarEvent {
    id: string;
    date: string;
    event_text: string;
    [key: string]: unknown;
}

function canCancelBefore24h(lessonDate: string, lessonTime: string): boolean {
    const normalizedTime = `${String(lessonTime).slice(0, 5)}:00`;
    const lessonDateTime = new Date(`${lessonDate}T${normalizedTime}`);
    if (Number.isNaN(lessonDateTime.getTime())) return false;
    const diffMs = lessonDateTime.getTime() - Date.now();
    return diffMs >= 24 * 60 * 60 * 1000;
}

export function useProfile() {
    const { user, role, signOut, loading, refreshProfile, currentUserProfile } = useAuth();
    const navigate = useNavigate();
    const showToast = useToast();

    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
    const [recentActivity, setRecentActivity] = useState<CalendarEvent[]>([]);
    const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [editedFirstName, setEditedFirstName] = useState("");
    const [editedLastName, setEditedLastName] = useState("");
    const [editedCity, setEditedCity] = useState("");
    const [editedQualifications, setEditedQualifications] = useState("");
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [showAllEvents, setShowAllEvents] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfileData | null>(null);
    const [editedHourlyRate, setEditedHourlyRate] = useState("");
    const [editedPriceNote, setEditedPriceNote] = useState("");
    const [editedOffersOnline, setEditedOffersOnline] = useState(false);
    const [editedDescription, setEditedDescription] = useState("");
    const [priceNegotiable, setPriceNegotiable] = useState(false);
    const [teacherAvailability, setTeacherAvailability] = useState<TeacherAvailabilityRow[]>([]);
    const [teacherBookingSettings, setTeacherBookingSettings] = useState<TeacherBookingSettingsRow | null>(null);
    const [teacherBlockedSlots, setTeacherBlockedSlots] = useState<TeacherBlockedSlotRow[]>([]);
    const [teacherExceptions, setTeacherExceptions] = useState<TeacherScheduleExceptionRow[]>([]);
    const [savingAvailability, setSavingAvailability] = useState(false);
    const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
    const [studentUpcomingBookings, setStudentUpcomingBookings] = useState<StudentBooking[]>([]);
    const [actingOnBookingId, setActingOnBookingId] = useState<string | null>(null);

    const loadUserData = useCallback(async () => {
        if (!user) return;

        try {
            await ensureValidSession();

            const { data: statsData, error: statsError } = await supabase
                .from("user_stats")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (statsError) {
                console.warn("Could not load user stats:", statsError);
                setCurrentStreak(0);
                setLongestStreak(0);
                setEarnedPoints(0);
            } else if (statsData) {
                setCurrentStreak(statsData.current_streak || 0);
                setLongestStreak(statsData.longest_streak || 0);
                setEarnedPoints(statsData.earned_points || 0);
            } else {
                await supabase.from("user_stats").insert({
                    user_id: user.id,
                    current_streak: 0,
                    longest_streak: 0,
                    earned_points: 0,
                });
                setCurrentStreak(0);
                setLongestStreak(0);
                setEarnedPoints(0);
            }

            const { data: eventsData, count } = await supabase
                .from("calendar_events")
                .select("*", { count: "exact" })
                .eq("user_id", user.id)
                .order("date", { ascending: true });

            setTotalEvents(count || 0);

            if (eventsData) {
                setAllEvents(eventsData as CalendarEvent[]);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const upcoming = (eventsData as CalendarEvent[])
                    .filter((event) => {
                        const [year, month, day] = event.date.split("-").map(Number);
                        const eventDate = new Date(year, month - 1, day);
                        return eventDate >= today;
                    })
                    .slice(0, role === "teacher" ? 10 : 3);
                setUpcomingEvents(upcoming);

                if (role === "student") {
                    const recent = (eventsData as CalendarEvent[])
                        .filter((event) => {
                            const [year, month, day] = event.date.split("-").map(Number);
                            const eventDate = new Date(year, month - 1, day);
                            return eventDate < today;
                        })
                        .slice(-5)
                        .reverse();
                    setRecentActivity(recent);
                }
            }

            if (role === "student") {
                const todayKey = new Date().toISOString().slice(0, 10);
                const { data: myBookings } = await supabase
                    .from("bookings")
                    .select("id, lesson_date, lesson_time, status, teacher_profile_id")
                    .eq("student_id", user.id)
                    .in("status", ["pending", "confirmed"])
                    .gte("lesson_date", todayKey)
                    .order("lesson_date", { ascending: true })
                    .order("lesson_time", { ascending: true });
                const list = (myBookings ?? []) as {
                    id: string;
                    lesson_date: string;
                    lesson_time: string;
                    status: string;
                    teacher_profile_id: string;
                }[];
                if (list.length > 0) {
                    const profileIds = [...new Set(list.map((b) => b.teacher_profile_id))];
                    const { data: tpData } = await supabase
                        .from("teacher_profiles")
                        .select("id, full_name, user_id")
                        .in("id", profileIds);
                    const nameMap = new Map(
                        (tpData ?? []).map((p: { id: string; full_name: string | null; user_id: string }) => [
                            p.id,
                            { name: p.full_name ?? "Учител", userId: p.user_id },
                        ])
                    );
                    setStudentUpcomingBookings(
                        list.map((b) => {
                            const t = nameMap.get(b.teacher_profile_id);
                            return {
                                ...b,
                                teacher_name: t?.name ?? "Учител",
                                teacher_id: t?.userId ?? "",
                            };
                        })
                    );
                } else {
                    setStudentUpcomingBookings([]);
                }
            } else {
                setStudentUpcomingBookings([]);
            }

            if (role === "teacher") {
                const { data: tp } = await supabase
                    .from("teacher_profiles")
                    .select("hourly_rate, price_note, offers_online_lessons, description")
                    .eq("user_id", user.id)
                    .maybeSingle();
                if (tp) {
                    setTeacherProfile({
                        hourly_rate: tp.hourly_rate ?? null,
                        price_note: tp.price_note ?? null,
                        offers_online_lessons: tp.offers_online_lessons ?? false,
                        description: (tp as { description?: string | null }).description ?? "",
                    });
                } else {
                    setTeacherProfile(null);
                }
                const [avRes, setRes, blockRes, excRes] = await Promise.all([
                    supabase.from("teacher_availability").select("*").eq("teacher_id", user.id).order("day_of_week"),
                    supabase.from("teacher_booking_settings").select("*").eq("teacher_id", user.id).maybeSingle(),
                    supabase.from("teacher_blocked_slots").select("*").eq("teacher_id", user.id),
                    supabase.from("teacher_schedule_exceptions").select("*").eq("teacher_id", user.id).order("exception_date"),
                ]);
                setTeacherAvailability((avRes.data as TeacherAvailabilityRow[]) ?? []);
                setTeacherBookingSettings((setRes.data as TeacherBookingSettingsRow | null) ?? null);
                setTeacherBlockedSlots((blockRes.data as TeacherBlockedSlotRow[]) ?? []);
                setTeacherExceptions((excRes.data as TeacherScheduleExceptionRow[]) ?? []);
                const { data: pendingData } = await supabase
                    .from("bookings")
                    .select("id, lesson_date, lesson_time, message, student_id")
                    .eq("teacher_id", user.id)
                    .eq("status", "pending")
                    .order("lesson_date", { ascending: true })
                    .order("lesson_time", { ascending: true });
                const list = (pendingData ?? []) as {
                    id: string;
                    lesson_date: string;
                    lesson_time: string;
                    message: string | null;
                    student_id: string;
                }[];
                if (list.length > 0) {
                    const ids = [...new Set(list.map((b) => b.student_id))];
                    const { data: profilesData } = await supabase.from("profiles").select("id, first_name, last_name").in("id", ids);
                    const nameMap = new Map(
                        (profilesData ?? []).map((p: { id: string; first_name: string | null; last_name: string | null }) => [
                            p.id,
                            [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Ученик",
                        ])
                    );
                    setPendingBookings(list.map((b) => ({ ...b, student_name: nameMap.get(b.student_id) ?? "Ученик" })));
                } else {
                    setPendingBookings([]);
                }
            } else {
                setTeacherProfile(null);
                setTeacherAvailability([]);
                setTeacherBookingSettings(null);
                setTeacherBlockedSlots([]);
                setTeacherExceptions([]);
                setPendingBookings([]);
            }
        } catch (error) {
            console.error("Error in loadUserData:", error);
            setCurrentStreak(0);
            setLongestStreak(0);
            setEarnedPoints(0);
            setTotalEvents(0);
            setUpcomingEvents([]);
            setRecentActivity([]);
            setAllEvents([]);
        }
    }, [user, role]);

    useEffect(() => {
        let isMounted = true;

        if (user) {
            setIsLoadingData(true);
            loadUserData()
                .then(async () => {
                    if (isMounted) {
                        setIsLoadingData(false);
                        const userMetadata = user.user_metadata as Record<string, unknown>;
                        if (userMetadata?.avatar_url) {
                            setAvatarUrl(userMetadata.avatar_url as string);
                            await supabase.from("profiles").update({ avatar_url: userMetadata.avatar_url }).eq("id", user.id);
                        } else {
                            setAvatarUrl(null);
                        }
                    }
                })
                .catch((error) => {
                    console.error("Error loading user data:", error);
                    if (isMounted) setIsLoadingData(false);
                });
        } else if (!user && !loading) {
            const redirectTimeout = setTimeout(() => {
                if (isMounted) navigate("/login");
            }, 100);
            return () => {
                isMounted = false;
                clearTimeout(redirectTimeout);
            };
        }

        return () => {
            isMounted = false;
        };
    }, [user, navigate, loading, loadUserData]);

    useEffect(() => {
        if (!user) return;
        const col = role === "teacher" ? "teacher_id" : "student_id";
        const channel = supabase
            .channel(`profile-bookings-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "bookings",
                    filter: `${col}=eq.${user.id}`,
                },
                () => { loadUserData(); }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, role, loadUserData]);

    const handleSignOut = useCallback(async () => {
        await signOut();
        navigate("/");
    }, [signOut, navigate]);

    const handleDeleteAccount = useCallback(async () => {
        if (!user) return;
        if (!deletePassword) {
            showToast("Моля въведете паролата си за потвърждение");
            return;
        }
        if (deleteConfirmText !== "ИЗТРИЙ") {
            showToast('Моля напишете "ИЗТРИЙ" за потвърждение');
            return;
        }
        if (!user.email) {
            showToast("Email не е наличен");
            return;
        }

        setDeletingAccount(true);
        try {
            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: deletePassword,
            });
            if (verifyError) {
                showToast("Паролата е неправилна. Моля опитайте отново.");
                setDeletingAccount(false);
                return;
            }

            await supabase.from("calendar_events").delete().eq("user_id", user.id);
            await supabase.from("user_stats").delete().eq("user_id", user.id);

            const userMetadata = user.user_metadata as Record<string, unknown>;
            const metaAvatarUrl = userMetadata?.avatar_url as string | undefined;
            if (metaAvatarUrl) {
                try {
                    const urlParts = metaAvatarUrl.split("/");
                    const filePath = urlParts.slice(-2).join("/");
                    await supabase.storage.from("profile-pictures").remove([filePath]);
                } catch (storageError) {
                    console.error("Error deleting avatar:", storageError);
                }
            }

            showToast("Акаунтът ви е изтрит успешно. Всички ваши данни са премахнати.");
            await signOut();
            navigate("/");
        } catch (error: unknown) {
            console.error("Error deleting account:", error);
            showToast(`Грешка при изтриване на акаунта: ${(error as Error).message}`);
        } finally {
            setDeletingAccount(false);
        }
    }, [user, deletePassword, deleteConfirmText, showToast, signOut, navigate]);

    const formatDate = useCallback((dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
    }, []);

    const formatFullDate = useCallback((dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
    }, []);

    const handleUpdateProfile = useCallback(async () => {
        if (!user) return;
        setLoadingUpdate(true);
        try {
            const firstNameVal = editedFirstName.trim();
            const lastNameVal = editedLastName.trim();
            const fullNameVal = `${firstNameVal} ${lastNameVal}`.trim();

            const authUpdates: Record<string, unknown> = {};
            if (firstNameVal) authUpdates.first_name = firstNameVal;
            if (lastNameVal) authUpdates.last_name = lastNameVal;
            if (fullNameVal) authUpdates.full_name = fullNameVal;
            if (editedCity.trim()) authUpdates.city = editedCity.trim();
            if (role === "teacher" && editedQualifications.trim()) authUpdates.qualifications = editedQualifications.trim();

            const { error } = await supabase.auth.updateUser({ data: authUpdates });
            if (error) {
                console.error("Error updating profile:", error);
                showToast("Грешка при обновяване на профила");
                setLoadingUpdate(false);
                return;
            }

            // Sync to profiles table (used by AuthContext, Navbar, chat, etc.)
            // profiles has: first_name, last_name, city, qualifications (no full_name)
            const profilePayload: Record<string, unknown> = {
                first_name: firstNameVal || null,
                last_name: lastNameVal || null,
                city: editedCity.trim() || null,
            };
            if (role === "teacher") {
                profilePayload.qualifications = editedQualifications.trim() || null;
            }

            const { error: profileErr } = await supabase
                .from("profiles")
                .update(profilePayload)
                .eq("id", user.id);

            if (profileErr) {
                console.error("Could not sync profile to profiles table:", profileErr);
                showToast("Профилът е обновен в акаунта, но синхронизацията с базата не успя.");
            }

            // Force auth session refresh so user_metadata is current
            await supabase.auth.getUser();

            if (role === "teacher") {
                const hourlyRateNum = priceNegotiable ? null : (editedHourlyRate.trim() ? Number(editedHourlyRate.trim()) : null);
                const priceNoteVal = priceNegotiable ? "По договаряне" : (editedPriceNote.trim() || null);
                const descriptionVal =
                    editedDescription.trim() ||
                    "Учител в системата Матура+. Моля, попълнете профила си за да се покажете в списъка с учители.";
                const { error: tpError } = await supabase
                    .from("teacher_profiles")
                    .update({
                        full_name: fullNameVal || null,
                        hourly_rate: hourlyRateNum,
                        price_note: priceNoteVal,
                        offers_online_lessons: editedOffersOnline,
                        description: descriptionVal,
                    })
                    .eq("user_id", user.id);
                if (tpError) {
                    console.error("Error updating teacher profile:", tpError);
                    showToast("Профилът е обновен, но данните за цена/онлайн не са запазени.");
                }
            }

            await refreshProfile();
            await new Promise((resolve) => setTimeout(resolve, 300));
            await loadUserData();
            setEditMode(false);
            showToast("Профилът е обновен успешно!");
        } catch (error) {
            console.error("Error:", error);
            showToast("Грешка при обновяване на профила");
        } finally {
            setLoadingUpdate(false);
        }
    }, [
        user,
        role,
        editedFirstName,
        editedLastName,
        editedCity,
        editedQualifications,
        priceNegotiable,
        editedHourlyRate,
        editedPriceNote,
        editedOffersOnline,
        editedDescription,
        loadUserData,
        refreshProfile,
        showToast,
    ]);

    const handleSaveAvailability = useCallback(
        async (data: TeacherAvailabilityFormData) => {
            if (!user || role !== "teacher") return;
            setSavingAvailability(true);
            try {
                await ensureValidSession();
                await supabase.from("teacher_availability").delete().eq("teacher_id", user.id);
                if (data.availability.length > 0) {
                    await supabase.from("teacher_availability").insert(
                        data.availability.map((a) => ({
                            teacher_id: user.id,
                            day_of_week: a.day_of_week,
                            start_time: a.start_time,
                            end_time: a.end_time,
                        }))
                    );
                }
                await supabase.from("teacher_booking_settings").upsert(
                    {
                        teacher_id: user.id,
                        lesson_duration_minutes: data.settings.lesson_duration_minutes,
                        buffer_minutes: data.settings.buffer_minutes,
                        auto_accept_bookings: data.settings.auto_accept_bookings,
                    },
                    { onConflict: "teacher_id" }
                );
                await supabase.from("teacher_blocked_slots").delete().eq("teacher_id", user.id);
                if (data.blockedSlots.length > 0) {
                    await supabase.from("teacher_blocked_slots").insert(
                        data.blockedSlots.map((b) => ({
                            teacher_id: user.id,
                            day_of_week: b.day_of_week,
                            start_time: b.start_time,
                            end_time: b.end_time,
                        }))
                    );
                }
                await supabase.from("teacher_schedule_exceptions").delete().eq("teacher_id", user.id);
                if (data.exceptions.length > 0) {
                    await supabase.from("teacher_schedule_exceptions").insert(
                        data.exceptions.map((e) => ({
                            teacher_id: user.id,
                            exception_date: e.exception_date,
                            is_fully_unavailable: e.is_fully_unavailable,
                            override_start_time: e.override_start_time,
                            override_end_time: e.override_end_time,
                        }))
                    );
                }
                await loadUserData();
                showToast("Наличността е запазена успешно!");
            } catch (error) {
                console.error("Error saving availability:", error);
                showToast("Грешка при запазване на наличността");
            } finally {
                setSavingAvailability(false);
            }
        },
        [user, role, loadUserData, showToast]
    );

    const formatBookingDateTime = useCallback((lessonDate: string, lessonTime: string) => {
        const timeStr = String(lessonTime).slice(0, 5);
        try {
            const d = new Date(lessonDate + "T12:00:00");
            return (
                d.toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) +
                " в " +
                timeStr +
                " ч."
            );
        } catch {
            return lessonDate + " в " + timeStr + " ч.";
        }
    }, []);

    const handleConfirmBooking = useCallback(
        async (bookingId: string, studentId: string, lessonDate: string, lessonTime: string) => {
            if (!user) return;
            setActingOnBookingId(bookingId);
            try {
                const { error } = await supabase
                    .from("bookings")
                    .update({ status: "confirmed" })
                    .eq("id", bookingId)
                    .eq("teacher_id", user.id);
                if (error) throw error;
                const dateTimeText = formatBookingDateTime(lessonDate, lessonTime);
                await supabase.from("messages").insert({
                    student_id: studentId,
                    teacher_id: user.id,
                    message: `Вашият час в ${dateTimeText} е потвърден. До скоро!`,
                    is_from_student: false,
                });

                sendBookingEmail({
                    type: "booking_confirmed",
                    student_id: studentId,
                    teacher_id: user.id,
                    lesson_date: lessonDate,
                    lesson_time: lessonTime,
                });

                showToast("Часът е потвърден. Ученикът ще получи съобщение в чата.");
                await loadUserData();
            } catch (e) {
                console.error("Error confirming booking:", e);
                showToast("Грешка при потвърждаване.");
            } finally {
                setActingOnBookingId(null);
            }
        },
        [user, loadUserData, showToast, formatBookingDateTime]
    );

    const handleCancelBooking = useCallback(
        async (bookingId: string, studentId: string, lessonDate: string, lessonTime: string) => {
            if (!user || !confirm("Сигурни ли сте, че искате да откажете този час?")) return;
            setActingOnBookingId(bookingId);
            try {
                const { error } = await supabase
                    .from("bookings")
                    .update({ status: "cancelled" })
                    .eq("id", bookingId)
                    .eq("teacher_id", user.id);
                if (error) throw error;
                const dateTimeText = formatBookingDateTime(lessonDate, lessonTime);
                await supabase.from("messages").insert({
                    student_id: studentId,
                    teacher_id: user.id,
                    message: `Съжалявам, часът в ${dateTimeText} е отменен. Можете да запишете друг час.`,
                    is_from_student: false,
                });

                sendBookingEmail({
                    type: "booking_cancelled",
                    student_id: studentId,
                    teacher_id: user.id,
                    lesson_date: lessonDate,
                    lesson_time: lessonTime,
                    cancelled_by: "teacher",
                });

                showToast("Часът е отказен. Ученикът ще получи съобщение в чата.");
                await loadUserData();
            } catch (e) {
                console.error("Error cancelling booking:", e);
                showToast("Грешка при отказ.");
            } finally {
                setActingOnBookingId(null);
            }
        },
        [user, loadUserData, showToast, formatBookingDateTime]
    );

    const handleCancelMyBooking = useCallback(
        async (bookingId: string, teacherId: string, lessonDate: string, lessonTime: string) => {
            if (!canCancelBefore24h(lessonDate, lessonTime)) {
                showToast("Не може да отмените час по-малко от 24 часа преди началото.");
                return;
            }
            if (!user || !confirm("Сигурни ли сте, че искате да откажете този час?")) return;
            try {
                const { error } = await supabase
                    .from("bookings")
                    .update({ status: "cancelled" })
                    .eq("id", bookingId)
                    .eq("student_id", user.id);
                if (error) throw error;
                const dateTimeText = formatBookingDateTime(lessonDate, lessonTime);
                if (teacherId) {
                    await supabase.from("messages").insert({
                        student_id: user.id,
                        teacher_id: teacherId,
                        message: `Отмених записания час на ${dateTimeText}.`,
                        is_from_student: true,
                    });

                    sendBookingEmail({
                        type: "booking_cancelled",
                        student_id: user.id,
                        teacher_id: teacherId,
                        lesson_date: lessonDate,
                        lesson_time: lessonTime,
                        cancelled_by: "student",
                    });
                }
                showToast("Часът е отменен.");
                await loadUserData();
            } catch (e) {
                console.error("Error cancelling booking:", e);
                showToast("Грешка при отказ.");
            }
        },
        [user, loadUserData, showToast, formatBookingDateTime]
    );

    const handleDeleteEvent = useCallback(
        async (eventId: string) => {
            if (!user) return;
            if (!confirm("Сигурни ли сте, че искате да изтриете това събитие?")) return;
            const { error } = await supabase
                .from("calendar_events")
                .delete()
                .eq("id", eventId)
                .eq("user_id", user.id);
            if (error) {
                console.error("Error deleting event:", error);
                showToast("Грешка при изтриване на събитието");
            } else {
                showToast("Събитието е изтрито успешно");
                loadUserData();
            }
        },
        [user, showToast, loadUserData]
    );

    const handleAvatarUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!user || !event.target.files || event.target.files.length === 0) return;
            const file = event.target.files[0];
            if (!file.type.startsWith("image/")) {
                showToast("Моля изберете валиден файл (изображение)");
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                showToast("Файлът е твърде голям. Моля изберете изображение под 2MB");
                return;
            }
            setUploadingAvatar(true);
            try {
                const fileExt = file.name.split(".").pop();
                const filePath = `${user.id}/avatar.${fileExt}`;
                const oldAvatar = (user.user_metadata as Record<string, unknown>)?.avatar_url as string | undefined;
                if (oldAvatar) {
                    const oldPath = oldAvatar.split("/").slice(-2).join("/");
                    await supabase.storage.from("profile-pictures").remove([oldPath]);
                }
                const { error: uploadError } = await supabase.storage
                    .from("profile-pictures")
                    .upload(filePath, file, { upsert: true });
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);
                const publicUrl = data.publicUrl;
                const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
                if (updateError) throw updateError;
                await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
                setAvatarUrl(publicUrl);
                await new Promise((resolve) => setTimeout(resolve, 500));
                await loadUserData();
                await refreshProfile();
                showToast("Профилната снимка е обновена успешно!");
            } catch (error: unknown) {
                console.error("Error uploading avatar:", error);
                showToast(`Грешка при качване на снимката: ${(error as Error).message}`);
            } finally {
                setUploadingAvatar(false);
                event.target.value = "";
            }
        },
        [user, loadUserData, refreshProfile, showToast]
    );

    const validatePassword = useCallback((password: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        if (password.length < minLength) return `Паролата трябва да е поне ${minLength} символа.`;
        if (!hasUpperCase) return "Паролата трябва да съдържа поне една главна буква. ";
        if (!hasLowerCase) return "Паролата трябва да съдържа поне една малка буква.";
        if (!hasNumber) return "Паролата трябва да съдържа поне една цифра.";
        if (!hasSpecialChar) return "Паролата трябва да съдържа поне един специален символ. ";
        return "";
    }, []);

    const handleChangePassword = useCallback(async () => {
        setPasswordError("");
        if (!currentPassword) {
            setPasswordError("Моля въведете текущата парола");
            return;
        }
        const passwordValidationError = validatePassword(newPassword);
        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Новата парола и потвърждението не съвпадат");
            return;
        }
        if (currentPassword === newPassword) {
            setPasswordError("Новата парола трябва да бъде различна от текущата");
            return;
        }
        setChangingPassword(true);
        try {
            if (!user?.email) throw new Error("Email не е наличен");
            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (verifyError) {
                setPasswordError("Текущата парола е неправилна");
                setChangingPassword(false);
                return;
            }
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;
            showToast("Паролата е променена успешно!");
            setShowChangePassword(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordError("");
        } catch (error: unknown) {
            console.error("Error changing password:", error);
            const errMsg = (error as Error).message || "Грешка при промяна на паролата";
            setPasswordError(errMsg);
            showToast(errMsg);
        } finally {
            setChangingPassword(false);
        }
    }, [
        user,
        currentPassword,
        newPassword,
        confirmPassword,
        validatePassword,
        showToast,
    ]);

    const handleRemoveAvatar = useCallback(async () => {
        if (!user || !confirm("Сигурни ли сте, че искате да премахнете профилната си снимка?")) return;
        try {
            const userMetadata = user.user_metadata as Record<string, unknown>;
            const metaAvatarUrl = userMetadata?.avatar_url as string | undefined;
            if (metaAvatarUrl) {
                const urlParts = metaAvatarUrl.split("/");
                const filePath = urlParts.slice(-2).join("/");
                await supabase.storage.from("profile-pictures").remove([filePath]);
            }
            const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: null } });
            if (updateError) throw updateError;
            await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
            setAvatarUrl(null);
            await new Promise((resolve) => setTimeout(resolve, 500));
            await loadUserData();
            await refreshProfile();
            showToast("Профилната снимка е премахната успешно!");
        } catch (error: unknown) {
            console.error("Error removing avatar:", error);
            showToast(`Грешка при премахване на снимката: ${(error as Error).message}`);
        }
    }, [user, loadUserData, refreshProfile, showToast]);

    const userMetadata = useMemo(() => {
        if (!user?.user_metadata) return {};
        return (user.user_metadata as Record<string, unknown>) || {};
    }, [user]);

    const displayName = useMemo(() => {
        if (!user) return "Потребител";
        // Prefer currentUserProfile (from profiles table) - updates immediately after refreshProfile
        const fromProfile =
            currentUserProfile?.first_name != null || currentUserProfile?.last_name != null
                ? `${currentUserProfile?.first_name ?? ""} ${currentUserProfile?.last_name ?? ""}`.trim()
                : null;
        if (fromProfile) return fromProfile;
        // Fallback to auth user_metadata
        const firstName = userMetadata?.first_name as string | undefined;
        const lastName = userMetadata?.last_name as string | undefined;
        const fullName =
            (userMetadata?.full_name as string) || (firstName && lastName ? `${firstName} ${lastName}` : null);
        return fullName || user.email?.split("@")[0] || (role === "teacher" ? "Учител" : "Ученик");
    }, [user, userMetadata, currentUserProfile, role]);

    const memberSince = useMemo(() => {
        if (!user?.created_at) return "";
        try {
            return new Date(user.created_at).toLocaleDateString("bg-BG", { month: "long", year: "numeric" });
        } catch {
            return "";
        }
    }, [user?.created_at]);

    const futurePendingBookings = useMemo(
        () =>
            pendingBookings.filter(
                (b) => new Date(b.lesson_date + "T" + (b.lesson_time?.slice(0, 5) || "00:00")) > new Date()
            ),
        [pendingBookings]
    );

    useEffect(() => {
        if (loading || isLoadingData || !user) return;
        if (window.location.hash === "#my-bookings") {
            const el = document.getElementById("my-bookings");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [loading, isLoadingData, user, studentUpcomingBookings.length]);

    const openEditMode = useCallback(() => {
        setEditMode(true);
        // Prefer currentUserProfile (profiles table) for name - stays in sync after updates
        setEditedFirstName(
            (currentUserProfile?.first_name as string) || (userMetadata?.first_name as string) || ""
        );
        setEditedLastName(
            (currentUserProfile?.last_name as string) || (userMetadata?.last_name as string) || ""
        );
        setEditedCity((userMetadata?.city as string) || "");
        setEditedQualifications((userMetadata?.qualifications as string) || "");
        if (role === "teacher" && teacherProfile) {
            setEditedHourlyRate(teacherProfile.hourly_rate != null ? String(teacherProfile.hourly_rate) : "");
            setEditedPriceNote(teacherProfile.price_note || "");
            setEditedOffersOnline(teacherProfile.offers_online_lessons);
            setPriceNegotiable(teacherProfile.price_note === "По договаряне");
            setEditedDescription(teacherProfile.description || "");
        } else if (role === "teacher") {
            setEditedHourlyRate("");
            setEditedPriceNote("");
            setEditedOffersOnline(false);
            setPriceNegotiable(false);
            setEditedDescription("");
        }
    }, [userMetadata, currentUserProfile, role, teacherProfile]);

    const closeChangePassword = useCallback(() => {
        setShowChangePassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
    }, []);

    const closeDeleteAccount = useCallback(() => {
        setShowDeleteAccount(false);
        setDeletePassword("");
        setDeleteConfirmText("");
    }, []);

    const currentAvatarUrl = avatarUrl || (userMetadata?.avatar_url as string | undefined) || null;

    return {
        user,
        role,
        loading,
        isLoadingData,
        currentStreak,
        longestStreak,
        earnedPoints,
        totalEvents,
        upcomingEvents,
        recentActivity,
        allEvents,
        editMode,
        setEditMode,
        editedFirstName,
        setEditedFirstName,
        editedLastName,
        setEditedLastName,
        editedCity,
        setEditedCity,
        editedQualifications,
        setEditedQualifications,
        loadingUpdate,
        showAllEvents,
        setShowAllEvents,
        uploadingAvatar,
        showChangePassword,
        setShowChangePassword,
        currentPassword,
        setCurrentPassword,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        passwordError,
        setPasswordError,
        changingPassword,
        showDeleteAccount,
        setShowDeleteAccount,
        deletePassword,
        setDeletePassword,
        deleteConfirmText,
        setDeleteConfirmText,
        deletingAccount,
        teacherProfile,
        editedHourlyRate,
        setEditedHourlyRate,
        editedPriceNote,
        setEditedPriceNote,
        editedOffersOnline,
        setEditedOffersOnline,
        editedDescription,
        setEditedDescription,
        priceNegotiable,
        setPriceNegotiable,
        teacherAvailability,
        teacherBookingSettings,
        teacherBlockedSlots,
        teacherExceptions,
        savingAvailability,
        pendingBookings,
        futurePendingBookings,
        studentUpcomingBookings,
        actingOnBookingId,
        userMetadata,
        displayName,
        memberSince,
        currentAvatarUrl,
        navigate,
        loadUserData,
        handleSignOut,
        handleDeleteAccount,
        formatDate,
        formatFullDate,
        handleUpdateProfile,
        handleSaveAvailability,
        handleConfirmBooking,
        handleCancelBooking,
        handleCancelMyBooking,
        handleDeleteEvent,
        handleAvatarUpload,
        validatePassword,
        handleChangePassword,
        handleRemoveAvatar,
        openEditMode,
        closeChangePassword,
        closeDeleteAccount,
    };
}
