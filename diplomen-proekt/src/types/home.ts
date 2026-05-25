export type CalendarViewMode = "agenda" | "month";

export type HomeMenuId =
    | "dashboard"
    | "find-teacher"
    | "study-plan"
    | "calendar"
    | "events"
    | "settings"
    | "lessons"
    | "messages";

export type CalendarEventRow = {
    id: string;
    date: string;
    event_text: string;
};

export type HomeEventItem = {
    id: string;
    date: Date;
    dateStr: string;
    event: string;
    type: "event" | "study";
};

export type TeacherMessage = {
    id: string;
    student_id: string;
    teacher_id: string;
    message: string;
    created_at: string;
    read_at?: string | null;
    student_name?: string;
    student_email?: string | null;
};

export type StudentBooking = {
    id: string;
    lesson_date: string;
    lesson_time: string;
    status: string;
    teacher_profile_id: string;
    teacher_name?: string;
    teacher_id?: string;
};

export type PendingBooking = {
    id: string;
    lesson_date: string;
    lesson_time: string;
    message: string | null;
    student_id: string;
    status: string;
    student_name?: string;
};
