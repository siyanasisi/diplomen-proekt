import type {
  TeacherAvailabilityRow,
  TeacherBookingSettingsRow,
  TeacherBlockedSlotRow,
  TeacherScheduleExceptionRow,
  SlotInfo,
  SlotStatus,
  BookingSlotRow,
} from "../types/teacher";

const DAY_NAMES_BG = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];

function timeToMinutes(t: string): number {
  if (!t || typeof t !== "string") return 0;
  const parts = t.split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
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

export function getStartOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateKey(date: Date): string {
  return toDateKey(date);
}

export function normalizeSlotFromApi(b: BookingSlotRow): BookingSlotRow {
  return {
    lesson_date: String(b.lesson_date).slice(0, 10),
    lesson_time: String(b.lesson_time).slice(0, 5),
  };
}

export function normalizeBookingSlotInput(date: string, time: string): { date: string; time: string } {
  return {
    date: String(date).slice(0, 10),
    time: String(time).slice(0, 5),
  };
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
  const lastPossible = endMin - duration;
  if (lastPossible >= startMin && (out.length === 0 || out[out.length - 1] !== lastPossible)) {
    out.push(lastPossible);
    out.sort((a, b) => a - b);
  }
  return out;
}

function isInBlockedRange(t: number, duration: number, blocked: { start: number; end: number }[]): boolean {
  const tEnd = t + duration;
  for (const b of blocked) {
    if (tEnd <= b.start || t > b.end) continue;
    return true;
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
    const dateKey = String(e.exception_date).slice(0, 10);
    if (dateKey.length === 10) exceptionsByDate.set(dateKey, e);
  }

  const bookedSet = new Set(
    existingBookings.map((b) => {
      const d = String(b.lesson_date).slice(0, 10);
      const t = String(b.lesson_time).slice(0, 5);
      return `${d}T${t}`;
    })
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

/** last bookable date (inclusive) from today*/
export function getMaxBookingDateKey(weeksAhead = 12): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + weeksAhead * 7);
  return toDateKey(d);
}

export function formatWeeklyScheduleSummary(
  availability: { day_of_week: number; start_time: string; end_time: string }[],
  settings?: { lesson_duration_minutes: number; buffer_minutes: number } | null
): string {
  if (availability.length === 0) return "";
  const sorted = [...availability].sort((a, b) => a.day_of_week - b.day_of_week);
  const lines = sorted.map((a) => {
    const start = String(a.start_time).slice(0, 5);
    const end = String(a.end_time).slice(0, 5);
    return `${getDayNameBg(a.day_of_week)}: ${start} – ${end}`;
  });
  const parts = [lines.join("\n")];
  if (settings) {
    parts.push(
      `Урок: ${settings.lesson_duration_minutes} мин` +
        (settings.buffer_minutes > 0 ? ` · почивка ${settings.buffer_minutes} мин` : "")
    );
  }
  return parts.join("\n");
}
