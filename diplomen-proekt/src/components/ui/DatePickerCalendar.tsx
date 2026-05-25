import { useEffect, useMemo, useState } from 'react';
import {
  DAY_NAMES_SHORT,
  MONTH_NAMES_BG,
  formatDateKeyLong,
  getMonthGrid,
  getTodayDateKey,
  parseDateKey,
  toDateKey,
} from '../../lib/calendar';

type DatePickerCalendarProps = {
  value: string;
  onChange: (dateKey: string) => void;
  minDate?: string;
  maxDate?: string;
};

export function DatePickerCalendar({ value, onChange, minDate, maxDate }: DatePickerCalendarProps) {
  const todayKey = getTodayDateKey();
  const min = minDate ?? todayKey;

  const initialView = value ? parseDateKey(value) : parseDateKey(min);
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  useEffect(() => {
    if (!value) return;
    const d = parseDateKey(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  const { startingDayOfWeek, daysInMonth } = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const canGoPrev = useMemo(() => {
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const lastDayPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
    const lastKeyPrev = toDateKey(prevYear, prevMonth, lastDayPrev);
    return lastKeyPrev >= min;
  }, [viewYear, viewMonth, min]);

  const goPrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const firstKeyNext = toDateKey(nextYear, nextMonth, 1);
    return firstKeyNext <= maxDate;
  }, [viewYear, viewMonth, maxDate]);

  const goNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDisabled = (dateKey: string) => {
    if (dateKey < min) return true;
    if (maxDate && dateKey > maxDate) return true;
    return false;
  };

  const handleSelect = (day: number) => {
    const dateKey = toDateKey(viewYear, viewMonth, day);
    if (isDisabled(dateKey)) return;
    onChange(dateKey);
  };

  return (
    <div
      className="bg-white border-2 border-slate-200/80"
      style={{ borderRadius: '0.875rem', padding: '1.25rem 1.125rem' }}
    >
      <div className="flex items-center justify-center" style={{ gap: '1.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={!canGoPrev}
          className="text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-30 disabled:pointer-events-none inline-flex items-center justify-center"
          style={{ padding: '0.375rem', borderRadius: '0.5rem' }}
          aria-label="Предишен месец"
        >
          <span className="material-icons" style={{ fontSize: '1.25rem' }}>chevron_left</span>
        </button>
        <h3 className="text-slate-900 text-center min-w-[10rem]" style={{ fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {MONTH_NAMES_BG[viewMonth]} {viewYear}
        </h3>
        <button
          type="button"
          onClick={goNextMonth}
          disabled={!canGoNext}
          className="text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-30 disabled:pointer-events-none inline-flex items-center justify-center"
          style={{ padding: '0.375rem', borderRadius: '0.5rem' }}
          aria-label="Следващ месец"
        >
          <span className="material-icons" style={{ fontSize: '1.25rem' }}>chevron_right</span>
        </button>
      </div>

      {value && (
        <div
          className="flex items-center justify-center gap-2 bg-purple-50 border border-purple-100 text-purple-900"
          style={{ marginBottom: '1rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
        >
          <span className="material-icons text-purple-700" style={{ fontSize: '1.125rem' }}>event</span>
          <span className="capitalize">{formatDateKeyLong(value)}</span>
        </div>
      )}

      <div className="grid grid-cols-7" style={{ gap: '0.25rem', marginBottom: '0.5rem' }}>
        {DAY_NAMES_SHORT.map((day) => (
          <div
            key={day}
            className="text-center text-slate-400 uppercase"
            style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.04em', padding: '0.5rem 0' }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7" style={{ gap: '0.25rem' }}>
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = toDateKey(viewYear, viewMonth, day);
          const disabled = isDisabled(dateKey);
          const isSelected = value === dateKey;
          const isToday = dateKey === todayKey;

          let cellClass =
            'relative aspect-square flex items-center justify-center transition-all font-medium ';
          if (disabled) {
            cellClass += 'text-slate-300 cursor-not-allowed';
          } else if (isSelected) {
            cellClass += 'bg-purple-700 text-white shadow-md shadow-purple-700/25';
          } else if (isToday) {
            cellClass += 'bg-purple-100 text-purple-800 ring-2 ring-purple-600/30 hover:bg-purple-200';
          } else {
            cellClass += 'text-slate-700 hover:bg-purple-50 hover:text-purple-800';
          }

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(day)}
              className={cellClass}
              style={{ borderRadius: '0.5rem', fontSize: '0.8125rem' }}
              aria-label={formatDateKeyLong(dateKey)}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="text-slate-400 text-center" style={{ fontSize: '0.75rem', marginTop: '1rem', lineHeight: 1.4 }}>
        Изберете ден от календара. Минималната дата е днес.
      </p>
    </div>
  );
}
