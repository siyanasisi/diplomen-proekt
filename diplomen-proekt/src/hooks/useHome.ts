import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { StudyPlan as StudyPlanType } from "../lib/topics";
import type { KnowledgeLevel } from "../lib/topics";
import { normalizeExamSubject, hasPlanContent } from "../lib/topics";
import { rescheduleMissedDay } from "../lib/studyPlanGenerator";
import { mapStudyPlanTopicToCurriculum } from "../lib/studyPlanMapping";
import type {
    HomeMenuId,
    CalendarEventRow,
    HomeEventItem,
    TeacherMessage,
    StudentBooking,
    PendingBooking,
} from "../types/home";

const DZI_BEL_EXAM_DATE = new Date(2026, 4, 20);
const MONTH_NAMES = [
    "Януари", "Февруари", "Март", "Април", "Май", "Юни",
    "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември",
];
const DAY_NAMES = ["Нед", "Пон", "Вто", "Сря", "Чет", "Пет", "Съб"];

export function formatDateTimeLessons(lessonDate: string, lessonTime: string): string {
    const d = String(lessonDate).slice(0, 10);
    const t = String(lessonTime).slice(0, 5);
    return `${d} ${t}`;
}

export function formatDateLessons(lessonDate: string): string {
    const d = String(lessonDate).slice(0, 10);
    const [y, m, day] = d.split("-").map(Number);
    const date = new Date(y, (m ?? 1) - 1, day ?? 1);
    return date.toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function useHome() {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const showToast = useToast();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [eventsList, setEventsList] = useState<CalendarEventRow[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [eventText, setEventText] = useState("");
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [activeMenu, setActiveMenu] = useState<HomeMenuId>("dashboard");
    const [studyPlans, setStudyPlans] = useState<StudyPlanType[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [bookedLessonDates, setBookedLessonDates] = useState<string[]>([]);
    const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
    const [todayBookingsCount, setTodayBookingsCount] = useState(0);
    const [teacherPendingCount, setTeacherPendingCount] = useState(0);
    const [messages, setMessages] = useState<TeacherMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [studentBookings, setStudentBookings] = useState<StudentBooking[]>([]);
    const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [actingOnBookingId, setActingOnBookingId] = useState<string | null>(null);

    const plansWithId = studyPlans.filter(
        (p): p is StudyPlanType & { id: string } => p.id != null && p.id !== ""
    );
    const studyPlan =
        plansWithId.find((p) => p.id === selectedPlanId) ?? plansWithId[0] ?? null;
    const effectivePlanId = studyPlan?.id ?? plansWithId[0]?.id ?? "";

    const today = new Date();
    const daysUntilExam = Math.ceil(
        (DZI_BEL_EXAM_DATE.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const loadEvents = useCallback(async () => {
        if (!user) return;
        try {
            await ensureValidSession();
            const { data, error } = await supabase
                .from("calendar_events")
                .select("*")
                .eq("user_id", user.id)
                .order("date", { ascending: true })
                .order("created_at", { ascending: true });

            if (error) {
                if (error.code === "PGRST303" || error.message?.includes("JWT")) {
                    await supabase.auth.signOut();
                    navigate("/login");
                    return;
                }
                console.error("Error loading events:", error);
            } else if (data) {
                setEventsList(
                    (data as CalendarEventRow[]).map((e) => ({
                        id: e.id,
                        date: e.date,
                        event_text: e.event_text,
                    }))
                );
            }
        } catch (error) {
            console.error("Failed to ensure valid session:", error);
            await supabase.auth.signOut();
            navigate("/login");
        }
    }, [user, navigate]);

    const loadBookedLessonDates = useCallback(async () => {
        if (!user) return;
        try {
            await ensureValidSession();
            const statusFilter = ["pending", "confirmed"];
            const { data: asStudent } = await supabase
                .from("bookings")
                .select("lesson_date")
                .eq("student_id", user.id)
                .in("status", statusFilter);
            const { data: asTeacher } = await supabase
                .from("bookings")
                .select("lesson_date")
                .eq("teacher_id", user.id)
                .in("status", statusFilter);
            const toDateKey = (iso: string) => String(iso).split("T")[0].trim();
            const allDates = [...(asStudent ?? []), ...(asTeacher ?? [])]
                .map((r: { lesson_date: string }) => toDateKey(r.lesson_date))
                .filter(Boolean);
            setBookedLessonDates([...new Set(allDates)]);

            if (role === "student") {
                const todayKey = new Date().toISOString().slice(0, 10);
                const { count } = await supabase
                    .from("bookings")
                    .select("id", { count: "exact", head: true })
                    .eq("student_id", user.id)
                    .eq("status", "pending")
                    .gte("lesson_date", todayKey);
                setPendingBookingsCount(count ?? 0);

                const todayKeyOnly = new Date().toISOString().slice(0, 10);
                const { count: todayCount } = await supabase
                    .from("bookings")
                    .select("id", { count: "exact", head: true })
                    .eq("student_id", user.id)
                    .in("status", ["pending", "confirmed"])
                    .eq("lesson_date", todayKeyOnly);
                setTodayBookingsCount(todayCount ?? 0);
            } else if (role === "teacher") {
                setPendingBookingsCount(0);
                setTodayBookingsCount(0);
                const todayKey = new Date().toISOString().slice(0, 10);
                const { count: teacherPending } = await supabase
                    .from("bookings")
                    .select("id", { count: "exact", head: true })
                    .eq("teacher_id", user.id)
                    .eq("status", "pending")
                    .gte("lesson_date", todayKey);
                setTeacherPendingCount(teacherPending ?? 0);
            } else {
                setPendingBookingsCount(0);
                setTodayBookingsCount(0);
                setTeacherPendingCount(0);
            }
        } catch (e) {
            console.error("Failed to load booked lesson dates:", e);
        }
    }, [user, role]);

    const loadUserStats = useCallback(async () => {
        if (!user) return;
        try {
            await ensureValidSession();
            const { data, error } = await supabase
                .from("user_stats")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) {
                if (error.code === "PGRST303" || error.message?.includes("JWT")) {
                    await supabase.auth.signOut();
                    navigate("/login");
                    return;
                }
                console.error("Error loading stats:", error);
            } else if (data) {
                setCurrentStreak(data.current_streak || 0);
                setLongestStreak(data.longest_streak || 0);
            } else {
                setCurrentStreak(0);
                setLongestStreak(0);
            }
        } catch (error) {
            console.error("Failed to ensure valid session:", error);
            await supabase.auth.signOut();
            navigate("/login");
        }
    }, [user, navigate]);

    const loadStudyPlans = useCallback(async () => {
        if (!user) return;
        try {
            await ensureValidSession();
            const { data, error } = await supabase
                .from("study_plans")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error loading study plans:", error);
                return;
            }

            if (data && data.length > 0) {
                const todayKey = new Date().toISOString().slice(0, 10);
                const transformed: StudyPlanType[] = await Promise.all(
                    data.map(
                        async (row: {
                            id: string;
                            user_id: string;
                            preferences: {
                                exam_subject?: string;
                                exam_date: string;
                                study_days_per_week: number;
                                topics_per_day: number;
                                bel_level: string;
                                literature_level: string;
                            };
                            plan: StudyPlanType["plan"];
                            created_at?: string;
                            updated_at?: string;
                        }) => {
                            let planObj: StudyPlanType = {
                                id: row.id,
                                user_id: row.user_id,
                                preferences: {
                                    examSubject: normalizeExamSubject(
                                        row.preferences.exam_subject
                                    ),
                                    examDate: new Date(row.preferences.exam_date),
                                    studyDaysPerWeek:
                                        row.preferences.study_days_per_week,
                                    topicsPerDay: row.preferences.topics_per_day,
                                    belLevel: row.preferences.bel_level as KnowledgeLevel,
                                    literatureLevel:
                                        row.preferences.literature_level as KnowledgeLevel,
                                },
                                plan: row.plan,
                                created_at: row.created_at,
                                updated_at: row.updated_at,
                            };
                            const pastUnfinishedDates = row.plan
                                .filter(
                                    (d: {
                                        date: string;
                                        completed?: boolean;
                                        missed?: boolean;
                                        topics?: unknown[];
                                    }) =>
                                        d.date < todayKey &&
                                        !d.completed &&
                                        !d.missed &&
                                        (d.topics?.length ?? 0) > 0
                                )
                                .map((d: { date: string }) => d.date)
                                .sort();
                            for (const date of pastUnfinishedDates) {
                                planObj = rescheduleMissedDay(planObj, date);
                            }
                            if (pastUnfinishedDates.length > 0) {
                                await supabase
                                    .from("study_plans")
                                    .update({
                                        plan: planObj.plan,
                                        updated_at: new Date().toISOString(),
                                    })
                                    .eq("id", row.id)
                                    .eq("user_id", user.id);
                            }
                            return planObj;
                        }
                    )
                );
                setStudyPlans(transformed);
                const savedId =
                    typeof window !== "undefined"
                        ? sessionStorage.getItem("homeSelectedPlanId")
                        : null;
                const firstId = transformed[0].id!;
                const idToSelect: string =
                    savedId && transformed.some((p) => p.id === savedId)
                        ? savedId
                        : firstId;
                setSelectedPlanId(idToSelect);
                if (typeof window !== "undefined")
                    sessionStorage.setItem("homeSelectedPlanId", idToSelect);
            } else {
                setStudyPlans([]);
                setSelectedPlanId(null);
            }
        } catch (error) {
            console.error("Error loading study plans:", error);
        }
    }, [user]);

    const loadMessages = useCallback(async () => {
        if (!user || role !== "teacher") return;
        setLoadingMessages(true);
        try {
            await ensureValidSession();
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("teacher_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error loading messages:", error);
            } else if (data) {
                const messagesWithStudents = await Promise.all(
                    data.map(async (message) => {
                        const { data: studentData } = await supabase
                            .from("profiles")
                            .select("first_name, last_name, email")
                            .eq("id", message.student_id)
                            .single();
                        return {
                            ...message,
                            student_name: studentData
                                ? `${studentData.first_name || ""} ${studentData.last_name || ""}`.trim() ||
                                  studentData.email?.split("@")[0] ||
                                  "Ученик"
                                : "Ученик",
                            student_email: studentData?.email || null,
                        };
                    })
                );
                setMessages(messagesWithStudents);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    }, [user, role]);

    const loadLessonsData = useCallback(async () => {
        if (!user) return;
        setLessonsLoading(true);
        try {
            await ensureValidSession();
            const todayKey = new Date().toISOString().slice(0, 10);

            if (role === "student") {
                const { data: rows } = await supabase
                    .from("bookings")
                    .select(
                        "id, lesson_date, lesson_time, status, teacher_profile_id"
                    )
                    .eq("student_id", user.id)
                    .in("status", ["pending", "confirmed"])
                    .gte("lesson_date", todayKey)
                    .order("lesson_date", { ascending: true })
                    .order("lesson_time", { ascending: true });
                const raw = (rows ?? []) as {
                    id: string;
                    lesson_date: string;
                    lesson_time: string;
                    status: string;
                    teacher_profile_id: string;
                }[];
                const slotKey = (b: {
                    lesson_date: string;
                    lesson_time: string;
                }) =>
                    `${String(b.lesson_date).slice(0, 10)}-${String(b.lesson_time).slice(0, 5)}`;
                const list = raw.filter(
                    (b, i, arr) =>
                        arr.findIndex((x) => slotKey(x) === slotKey(b)) === i
                );
                if (list.length > 0) {
                    const ids = [...new Set(list.map((b) => b.teacher_profile_id))];
                    const { data: tp } = await supabase
                        .from("teacher_profiles")
                        .select("id, full_name, user_id")
                        .in("id", ids);
                    const map = new Map(
                        (tp ?? []).map(
                            (p: {
                                id: string;
                                full_name: string | null;
                                user_id: string;
                            }) => [p.id, { name: p.full_name ?? "Учител", userId: p.user_id }]
                        )
                    );
                    setStudentBookings(
                        list.map((b) => ({
                            ...b,
                            teacher_name:
                                map.get(b.teacher_profile_id)?.name ?? "Учител",
                            teacher_id:
                                map.get(b.teacher_profile_id)?.userId ?? "",
                        }))
                    );
                } else {
                    setStudentBookings([]);
                }
                setPendingBookings([]);
            } else if (role === "teacher") {
                const { data: rows } = await supabase
                    .from("bookings")
                    .select(
                        "id, lesson_date, lesson_time, message, student_id, status"
                    )
                    .eq("teacher_id", user.id)
                    .in("status", ["pending", "confirmed"])
                    .gte("lesson_date", todayKey)
                    .order("lesson_date", { ascending: true })
                    .order("lesson_time", { ascending: true });
                const raw = (rows ?? []) as {
                    id: string;
                    lesson_date: string;
                    lesson_time: string;
                    message: string | null;
                    student_id: string;
                    status: string;
                }[];
                const slotKeyT = (b: {
                    student_id: string;
                    lesson_date: string;
                    lesson_time: string;
                }) =>
                    `${b.student_id}-${String(b.lesson_date).slice(0, 10)}-${String(b.lesson_time).slice(0, 5)}`;
                const list = raw.filter(
                    (b, i, arr) =>
                        arr.findIndex((x) => slotKeyT(x) === slotKeyT(b)) === i
                );
                if (list.length > 0) {
                    const ids = [...new Set(list.map((b) => b.student_id))];
                    const { data: pr } = await supabase
                        .from("profiles")
                        .select("id, full_name")
                        .in("id", ids);
                    const map = new Map(
                        (pr ?? []).map((p: { id: string; full_name: string | null }) => [
                            p.id,
                            p.full_name ?? "Ученик",
                        ])
                    );
                    setPendingBookings(
                        list.map((b) => ({
                            ...b,
                            student_name: map.get(b.student_id) ?? "Ученик",
                            status: b.status,
                        }))
                    );
                } else {
                    setPendingBookings([]);
                }
                setStudentBookings([]);
            } else {
                setStudentBookings([]);
                setPendingBookings([]);
            }
        } catch (e) {
            console.error("Lessons load:", e);
        } finally {
            setLessonsLoading(false);
        }
    }, [user, role]);

    useEffect(() => {
        if (!user) {
            navigate("/login", { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user) {
            loadEvents();
            loadBookedLessonDates();
            loadUserStats();
            if (role === "teacher") loadMessages();
            if (role === "student") loadStudyPlans();
        }
    }, [user, role, loadEvents, loadBookedLessonDates, loadUserStats, loadMessages, loadStudyPlans]);

    useEffect(() => {
        if (user && location?.pathname === "/home") {
            loadBookedLessonDates();
        }
    }, [location?.pathname, user, loadBookedLessonDates]);

    useEffect(() => {
        if (user && activeMenu === "lessons") loadLessonsData();
    }, [user, activeMenu, loadLessonsData]);

    const handleCancelMyBooking = async (
        bookingId: string,
        teacherId: string,
        lessonDate: string,
        lessonTime: string
    ) => {
        if (!user || !confirm("Сигурни ли сте, че искате да откажете този час?"))
            return;
        try {
            const { error } = await supabase
                .from("bookings")
                .update({ status: "cancelled" })
                .eq("id", bookingId)
                .eq("student_id", user.id);
            if (error) throw error;
            const text = formatDateTimeLessons(lessonDate, lessonTime);
            if (teacherId) {
                await supabase.from("messages").insert({
                    student_id: user.id,
                    teacher_id: teacherId,
                    message: `Отмених записания час на ${text}.`,
                    is_from_student: true,
                });
            }
            showToast("Часът е отменен.");
            await loadLessonsData();
            await loadBookedLessonDates();
            await loadEvents();
        } catch (e) {
            console.error(e);
            showToast("Грешка при отказ.");
        }
    };

    const handleConfirmBooking = async (
        bookingId: string,
        studentId: string,
        lessonDate: string,
        lessonTime: string
    ) => {
        if (!user) return;
        setActingOnBookingId(bookingId);
        try {
            const { error } = await supabase
                .from("bookings")
                .update({ status: "confirmed" })
                .eq("id", bookingId)
                .eq("teacher_id", user.id);
            if (error) throw error;
            const text = formatDateTimeLessons(lessonDate, lessonTime);
            await supabase.from("messages").insert({
                student_id: studentId,
                teacher_id: user.id,
                message: `Вашият час на ${text} е потвърден. До скоро!`,
                is_from_student: false,
            });
            showToast("Часът е потвърден.");
            await loadLessonsData();
            loadBookedLessonDates();
        } catch (e) {
            console.error(e);
            showToast("Грешка при потвърждаване.");
        } finally {
            setActingOnBookingId(null);
        }
    };

    const handleCancelByTeacher = async (
        bookingId: string,
        studentId: string,
        lessonDate: string,
        lessonTime: string
    ) => {
        if (!user || !confirm("Сигурни ли сте, че искате да откажете този час?"))
            return;
        setActingOnBookingId(bookingId);
        try {
            const { error } = await supabase
                .from("bookings")
                .update({ status: "cancelled" })
                .eq("id", bookingId)
                .eq("teacher_id", user.id);
            if (error) throw error;
            const text = formatDateTimeLessons(lessonDate, lessonTime);
            await supabase.from("messages").insert({
                student_id: studentId,
                teacher_id: user.id,
                message: `Съжалявам, часът на ${text} е отменен. Можете да запишете друг час.`,
                is_from_student: false,
            });
            showToast("Часът е отказен.");
            await loadLessonsData();
            await loadBookedLessonDates();
            await loadEvents();
        } catch (e) {
            console.error(e);
            showToast("Грешка при отказ.");
        } finally {
            setActingOnBookingId(null);
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek };
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

    const goToPreviousMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        );
    };

    const goToNextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        );
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const formatDateKey = (day: number) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthStr = String(month + 1).padStart(2, "0");
        const dayStr = String(day).padStart(2, "0");
        return `${year}-${monthStr}-${dayStr}`;
    };

    const getTodayDateKey = () => {
        const t = new Date();
        const year = t.getFullYear();
        const month = String(t.getMonth() + 1).padStart(2, "0");
        const day = String(t.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const getTodayStudyTasks = () => {
        if (!studyPlan) return null;
        const todayKey = getTodayDateKey();
        return studyPlan.plan.find((day) => day.date === todayKey);
    };

    const getUpcomingStudyTopics = () => {
        if (!studyPlan) return [];
        const todayKey = getTodayDateKey();
        const todayDate = new Date(todayKey);
        const upcoming: Array<{
            date: string;
            studyDay: StudyPlanType["plan"][0];
        }> = [];
        for (let i = 1; i <= 5; i++) {
            const nextDate = new Date(todayDate);
            nextDate.setDate(todayDate.getDate() + i);
            const year = nextDate.getFullYear();
            const month = String(nextDate.getMonth() + 1).padStart(2, "0");
            const day = String(nextDate.getDate()).padStart(2, "0");
            const dateKey = `${year}-${month}-${day}`;
            const studyDay = studyPlan.plan.find((d) => d.date === dateKey);
            if (
                studyDay &&
                studyDay.topics.length > 0 &&
                !studyDay.completed &&
                !studyDay.missed
            ) {
                upcoming.push({ date: dateKey, studyDay });
                if (upcoming.length >= 5) break;
            }
        }
        return upcoming;
    };

    const getStudyPlanProgress = () => {
        if (!studyPlan) return null;
        const totalDays = studyPlan.plan.length;
        const completedDays = studyPlan.plan.filter((d) => d.completed).length;
        const totalTopics = studyPlan.plan.reduce(
            (sum, day) => sum + day.topics.length,
            0
        );
        const completedTopics = studyPlan.plan
            .filter((d) => d.completed)
            .reduce((sum, day) => sum + day.topics.length, 0);
        return {
            totalDays,
            completedDays,
            totalTopics,
            completedTopics,
            completionPercentage:
                totalDays > 0
                    ? Math.round((completedDays / totalDays) * 100)
                    : 0,
            topicsCompletionPercentage:
                totalTopics > 0
                    ? Math.round((completedTopics / totalTopics) * 100)
                    : 0,
        };
    };

    const studyPlanHasContent =
        studyPlan &&
        hasPlanContent(studyPlan.preferences.examSubject) &&
        studyPlan.plan.length > 0;

    const handleMarkStudyDayCompleted = async (date: string) => {
        if (!user || !studyPlan) return;
        try {
            await ensureValidSession();
            const updatedPlan = {
                ...studyPlan,
                plan: studyPlan.plan.map((d) =>
                    d.date === date
                        ? { ...d, completed: !d.completed, missed: false }
                        : d
                ),
            };
            const { error } = await supabase
                .from("study_plans")
                .update({
                    plan: updatedPlan.plan,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id)
                .eq("id", studyPlan.id);

            if (error) {
                console.error("Error updating study plan:", error);
                showToast("Възникна грешка при актуализирането на плана.");
            } else {
                setStudyPlans((prev) =>
                    prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
                );
            }
        } catch (error) {
            console.error("Failed to mark day as completed:", error);
            showToast("Възникна грешка. Моля, опитайте отново.");
        }
    };

    const handleMarkStudyDayMissed = async (date: string) => {
        if (!user || !studyPlan) return;
        const dayToMark = studyPlan.plan.find((d) => d.date === date);
        if (!dayToMark) return;
        if (dayToMark.completed) {
            showToast("Не можете да маркирате завършен ден като пропускан.");
            return;
        }
        if (dayToMark.missed) {
            showToast("Този ден вече е маркиран като пропускан.");
            return;
        }
        if (
            !confirm(
                "Сигурни ли сте, че искате да маркирате този ден като пропускан? Темите ще бъдат пренасрочени автоматично."
            )
        ) {
            return;
        }
        try {
            await ensureValidSession();
            const updatedPlan = rescheduleMissedDay(studyPlan, date);
            const missedDay = updatedPlan.plan.find((d) => d.date === date);
            if (!missedDay || !missedDay.missed) {
                showToast(
                    "Възникна грешка при маркирането на деня като пропускан."
                );
                return;
            }
            const { error } = await supabase
                .from("study_plans")
                .update({
                    plan: updatedPlan.plan,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id)
                .eq("id", studyPlan.id);

            if (error) {
                console.error("Error updating study plan:", error);
                showToast("Възникна грешка при актуализирането на плана.");
            } else {
                setStudyPlans((prev) =>
                    prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
                );
            }
        } catch (error) {
            console.error("Failed to mark day as missed:", error);
            showToast("Възникна грешка. Моля, опитайте отново.");
        }
    };

    const eventsForDate = (dateKey: string) =>
        eventsList.filter((e) => e.date === dateKey);
    const hasEventOnDate = (dateKey: string) => eventsForDate(dateKey).length > 0;
    const hasBookedLessonOnDate = (dateKey: string) =>
        bookedLessonDates.includes(dateKey);
    const hasDotOnDate = (dateKey: string) =>
        hasBookedLessonOnDate(dateKey) || hasEventOnDate(dateKey);

    const handleDayClick = (day: number) => {
        const dateKey = formatDateKey(day);
        setSelectedDay(dateKey);
        const dayEvents = eventsForDate(dateKey);
        const first = dayEvents[0];
        setSelectedEventId(first?.id ?? null);
        setEventText(first?.event_text ?? "");
    };

    const handleSaveEvent = async () => {
        if (!selectedDay || !user) return;
        try {
            await ensureValidSession();
            if (eventText.trim()) {
                let error;
                if (selectedEventId) {
                    const result = await supabase
                        .from("calendar_events")
                        .update({ event_text: eventText })
                        .eq("id", selectedEventId)
                        .eq("user_id", user.id);
                    error = result.error;
                } else {
                    const result = await supabase
                        .from("calendar_events")
                        .insert({
                            user_id: user.id,
                            date: selectedDay,
                            event_text: eventText,
                        });
                    error = result.error;
                }
                if (error) {
                    console.error("Error saving event:", error);
                    showToast(
                        "Грешка при запазване на събитието. Моля, опитайте отново."
                    );
                } else {
                    loadEvents();
                }
            } else {
                await handleDeleteEvent();
            }
            setSelectedDay(null);
            setSelectedEventId(null);
            setEventText("");
        } catch (error) {
            console.error("Failed to ensure valid session:", error);
            await supabase.auth.signOut();
            navigate("/login");
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedDay || !user) return;
        try {
            await ensureValidSession();
            if (selectedEventId) {
                const { error } = await supabase
                    .from("calendar_events")
                    .delete()
                    .eq("id", selectedEventId)
                    .eq("user_id", user.id);
                if (error) console.error("Error deleting event:", error);
                else loadEvents();
            } else {
                const { error } = await supabase
                    .from("calendar_events")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("date", selectedDay);
                if (error) console.error("Error deleting event:", error);
                else loadEvents();
            }
            setSelectedDay(null);
            setSelectedEventId(null);
            setEventText("");
        } catch (error) {
            console.error("Failed to ensure valid session:", error);
            await supabase.auth.signOut();
            navigate("/login");
        }
    };

    const getUpcomingEvents = (): HomeEventItem[] => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const regularEvents = eventsList
            .map((e) => {
                const [y, m, d] = e.date.split("-").map(Number);
                const eventDate = new Date(y, m - 1, d);
                eventDate.setHours(0, 0, 0, 0);
                return {
                    id: e.id,
                    date: eventDate,
                    dateStr: e.date,
                    event: e.event_text,
                    type: "event" as const,
                };
            })
            .filter((item) => item.date >= today);

        const studyPlanEvents: HomeEventItem[] = [];
        if (studyPlan) {
            studyPlan.plan.forEach((studyDay) => {
                if (
                    studyDay.topics.length > 0 &&
                    !studyDay.completed &&
                    !studyDay.missed
                ) {
                    const [year, month, day] = studyDay.date
                        .split("-")
                        .map(Number);
                    const studyDate = new Date(year, month - 1, day);
                    studyDate.setHours(0, 0, 0, 0);
                    if (studyDate >= today) {
                        const topicsText = studyDay.topics
                            .map((t) => `${t.subject}: ${t.name}`)
                            .join(", ");
                        studyPlanEvents.push({
                            id: `study-${studyDay.date}`,
                            date: studyDate,
                            dateStr: studyDay.date,
                            event: `📚 ${topicsText}`,
                            type: "study",
                        });
                    }
                }
            });
        }

        return [...regularEvents, ...studyPlanEvents]
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 10);
    };

    const getAllEvents = (): HomeEventItem[] => {
        const regularEvents = eventsList.map((e) => {
            const [y, m, d] = e.date.split("-").map(Number);
            return {
                id: e.id,
                date: new Date(y, m - 1, d),
                dateStr: e.date,
                event: e.event_text,
                type: "event" as const,
            };
        });

        const studyPlanEvents: HomeEventItem[] = [];
        if (studyPlan) {
            studyPlan.plan.forEach((studyDay) => {
                if (studyDay.topics.length > 0) {
                    const [year, month, day] = studyDay.date.split("-").map(Number);
                    const studyDate = new Date(year, month - 1, day);
                    const topicsText = studyDay.topics
                        .map((t) => `${t.subject}: ${t.name}`)
                        .join(", ");
                    const statusIcon = studyDay.completed
                        ? "✓"
                        : studyDay.missed
                          ? "✗"
                          : "📚";
                    studyPlanEvents.push({
                        id: `study-${studyDay.date}`,
                        date: studyDate,
                        dateStr: studyDay.date,
                        event: `${statusIcon} ${topicsText}`,
                        type: "study",
                    });
                }
            });
        }

        return [...regularEvents, ...studyPlanEvents]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 15);
    };

    const markMessageAsRead = async (message: TeacherMessage) => {
        if (message.read_at || !user) return;
        try {
            await ensureValidSession();
            const { error } = await supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", message.id);
            if (!error) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? { ...msg, read_at: new Date().toISOString() }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error("Error marking message as read:", error);
        }
    };

    return {
        user,
        role,
        navigate,
        activeMenu,
        setActiveMenu,
        currentDate,
        eventsList,
        selectedEventId,
        setSelectedEventId,
        selectedDay,
        setSelectedDay,
        eventText,
        setEventText,
        currentStreak,
        longestStreak,
        studyPlans,
        selectedPlanId,
        setSelectedPlanId,
        plansWithId,
        studyPlan,
        effectivePlanId,
        bookedLessonDates,
        pendingBookingsCount,
        todayBookingsCount,
        teacherPendingCount,
        messages,
        loadingMessages,
        studentBookings,
        pendingBookings,
        lessonsLoading,
        actingOnBookingId,
        daysUntilExam,
        daysInMonth,
        startingDayOfWeek,
        MONTH_NAMES,
        DAY_NAMES,
        loadEvents,
        loadMessages,
        loadLessonsData,
        loadBookedLessonDates,
        handleCancelMyBooking,
        handleConfirmBooking,
        handleCancelByTeacher,
        goToPreviousMonth,
        goToNextMonth,
        goToToday,
        formatDateKey,
        getTodayDateKey,
        getTodayStudyTasks,
        getUpcomingStudyTopics,
        getStudyPlanProgress,
        studyPlanHasContent,
        handleMarkStudyDayCompleted,
        handleMarkStudyDayMissed,
        eventsForDate,
        hasEventOnDate,
        hasBookedLessonOnDate,
        hasDotOnDate,
        handleDayClick,
        handleSaveEvent,
        handleDeleteEvent,
        getUpcomingEvents,
        getAllEvents,
        markMessageAsRead,
        mapStudyPlanTopicToCurriculum,
    };
}
