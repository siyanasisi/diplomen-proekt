import { supabase } from "../supabase-client";

export type BookingEmailType =
  | "new_booking"
  | "booking_confirmed"
  | "booking_cancelled";

interface SendBookingEmailParams {
  type: BookingEmailType;
  student_id: string;
  teacher_id: string;
  lesson_date: string;
  lesson_time: string;
  teacher_name?: string;
  student_name?: string;
  cancelled_by?: "student" | "teacher";
  auto_confirmed?: boolean;
}

/**
 * Fire-and-forget email notification for booking events.
 * Never throws — failures are logged silently so the main
 * booking flow is never blocked by email delivery issues.
 */
export async function sendBookingEmail(
  params: SendBookingEmailParams
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-booking-email", {
      body: params,
    });
    if (error) {
      console.error("Failed to send booking email:", error);
    }
  } catch (err) {
    console.error("Failed to send booking email:", err);
  }
}
