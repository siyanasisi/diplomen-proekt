import type {
  TeacherAvailabilityRow,
  TeacherBookingSettingsRow,
  TeacherBlockedSlotRow,
  TeacherScheduleExceptionRow,
  SlotInfo,
  SlotStatus,
} from "../types/teacher";

const DAY_NAMES_BG = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// 480 -> 08:00 
function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function getDayOfWeek(date: Date): number {
  const d = date.getDay(); 
  return d === 0 ? 7 : d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function slotStartsInWindow(
  startMin: number,
  endMin: number,
  duration: number,
  buffer: number
): number[] {
  const step = duration + buffer;
  const out: number[] = [];
  let t = startMin;
  while (t + duration <= endMin) {
    out.push(t);
    t += step;
  }
  return out;
}

function isInBlockedRange(t: number, duration: number, blocked: { start: number; end: number }[]): boolean {
  const tEnd = t + duration;
  for (const b of blocked) {
    if (t < b.end && tEnd > b.start) return true;
  }
  return false;
}

export function getDayNameBg(dayOfWeek: number): string {
  const idx = dayOfWeek === 7 ? 0 : dayOfWeek;
  return DAY_NAMES_BG[idx] ?? "";
}

export interface GenerateSlotsParams {
  availability: TeacherAvailabilityRow[];
  settings: TeacherBookingSettingsRow | null;
  blockedSlots: TeacherBlockedSlotRow[];
  exceptions: TeacherScheduleExceptionRow[];
  existingBookings: { lesson_date: string; lesson_time: string }[];
  weekStart: Date;
  daysCount?: number;
}

export function generateSlotsForWeek(params: GenerateSlotsParams): SlotInfo[] {
  const {
    availability,
    settings,
    blockedSlots,
    exceptions,
    existingBookings,
    weekStart,
    daysCount = 7,
  } = params;

  const duration = settings?.lesson_duration_minutes ?? 45;
  const buffer = settings?.buffer_minutes ?? 0;

  const availabilityByDay = new Map<number, TeacherAvailabilityRow>();
  for (const a of availability) {
    availabilityByDay.set(a.day_of_week, a);
  }

  const blockedByDay = new Map<number, { start: number; end: number }[]>();
  for (const b of blockedSlots) {
    if (!blockedByDay.has(b.day_of_week)) blockedByDay.set(b.day_of_week, []);
    blockedByDay.get(b.day_of_week)!.push({
      start: timeToMinutes(b.start_time),
      end: timeToMinutes(b.end_time),
    });
  }

  const exceptionsByDate = new Map<string, TeacherScheduleExceptionRow>();
  for (const e of exceptions) {
    exceptionsByDate.set(e.exception_date, e);
  }

  const bookedSet = new Set(
    existingBookings.map((b) => `${b.lesson_date}T${b.lesson_time}`)
  );

  const result: SlotInfo[] = [];
  for (let d = 0; d < daysCount; d++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + d);
    const dateKey = toDateKey(date);
    const dayOfWeek = getDayOfWeek(date);

    const exc = exceptionsByDate.get(dateKey);
    if (exc?.is_fully_unavailable) continue;

    let startMin: number;
    let endMin: number;
    if (exc && exc.override_start_time && exc.override_end_time) {
      startMin = timeToMinutes(exc.override_start_time);
      endMin = timeToMinutes(exc.override_end_time);
    } else {
      const av = availabilityByDay.get(dayOfWeek);
      if (!av) continue;
      startMin = timeToMinutes(av.start_time);
      endMin = timeToMinutes(av.end_time);
    }

    const blockedThisDay = blockedByDay.get(dayOfWeek) ?? [];
    const starts = slotStartsInWindow(startMin, endMin, duration, buffer);

    for (const s of starts) {
      const timeStr = minutesToTime(s);
      const slotKey = `${dateKey}T${timeStr}`;
      const isBooked = bookedSet.has(slotKey);
      const isBlocked = isInBlockedRange(s, duration, blockedThisDay);
      let status: SlotStatus = "free";
      if (isBooked) status = "booked";
      else if (isBlocked) status = "blocked";
      result.push({ date: dateKey, time: timeStr, status });
    }
  }
  return result;
}

export function getUniqueSortedTimes(slots: SlotInfo[]): string[] {
  const set = new Set(slots.map((s) => s.time));
  return Array.from(set).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}
