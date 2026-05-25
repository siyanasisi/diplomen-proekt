export const MONTH_NAMES_BG = [
  'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
  'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември',
];

export const DAY_NAMES_SHORT = ['Нед', 'Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб'];

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getTodayDateKey(): string {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getMonthGrid(year: number, month: number) {
  const startingDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { startingDayOfWeek, daysInMonth };
}

export function formatDateKeyLong(key: string): string {
  const date = parseDateKey(key);
  return date.toLocaleDateString('bg-BG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export type CalendarBounds = {
  min: Date;
  max: Date;
};

export function getStudyPlanCalendarBounds(
  examDate: Date | string,
  planDates: string[] = []
): CalendarBounds {
  const today = parseDateKey(getTodayDateKey());
  const exam =
    examDate instanceof Date ? new Date(examDate) : new Date(examDate);
  exam.setHours(0, 0, 0, 0);

  let max = exam;
  for (const key of planDates) {
    const d = parseDateKey(key);
    if (d > max) max = d;
  }

  return { min: today, max };
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function clampMonthToBounds(date: Date, bounds: CalendarBounds): Date {
  const monthStart = startOfMonth(date);
  const minMonth = startOfMonth(bounds.min);
  const maxMonth = startOfMonth(bounds.max);
  if (monthStart < minMonth) return new Date(minMonth);
  if (monthStart > maxMonth) return new Date(maxMonth);
  return monthStart;
}

export function canGoToPreviousMonth(
  currentDate: Date,
  bounds: CalendarBounds
): boolean {
  const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  return startOfMonth(prev) >= startOfMonth(bounds.min);
}

export function canGoToNextMonth(
  currentDate: Date,
  bounds: CalendarBounds
): boolean {
  const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  return startOfMonth(next) <= startOfMonth(bounds.max);
}

export function formatBoundsRangeLabel(bounds: CalendarBounds): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${fmt(bounds.min)} – ${fmt(bounds.max)}`;
}

export function countStudyDaysInMonth(
  planDayKeys: Set<string>,
  year: number,
  month: number
): number {
  let count = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    if (planDayKeys.has(toDateKey(year, month, day))) count++;
  }
  return count;
}
