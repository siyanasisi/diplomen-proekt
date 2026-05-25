export interface Teacher {
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
    hourly_rate?: number | null;
    price_note?: string | null;
    offers_online_lessons?: boolean;
}

export interface TeacherReview {
    id: string;
    teacher_id: string;
    author_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    author_name?: string;
    author_avatar_url?: string | null;
}

export type TeacherSortOption = "rating" | "name" | "online_first";

export interface TeacherAvailabilityRow {
  id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string; 
  end_time: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeacherBookingSettingsRow {
  id: string;
  teacher_id: string;
  lesson_duration_minutes: 30 | 45 | 60;
  buffer_minutes: 0 | 5 | 10 | 15;
  auto_accept_bookings: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeacherBlockedSlotRow {
  id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at?: string;
}

export interface TeacherScheduleExceptionRow {
  id: string;
  teacher_id: string;
  exception_date: string; // YYYY-MM-DD
  is_fully_unavailable: boolean;
  override_start_time: string | null;
  override_end_time: string | null;
  created_at?: string;
}

export type SlotStatus = "free" | "blocked" | "booked";

export interface SlotInfo {
  date: string;   // YYYY-MM-DD
  time: string;  // HH:MM
  status: SlotStatus;
}

export interface BookingFormState {
  date: string;
  time: string;
  message: string;
}

export interface BookingSlotRow {
  lesson_date: string;
  lesson_time: string;
}
