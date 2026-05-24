import { useEffect, useRef, useState, type RefObject } from 'react';
import type { useTeacherBooking } from '../../hooks/useTeacherBooking';
import type { BookingFormState } from '../../types/teacher';
import { getDayNameBg } from '../../utils/teacherSlots';
import { DatePickerCalendar } from '../ui/DatePickerCalendar';
import { getTodayDateKey } from '../../lib/calendar';

const MODAL_LABEL = 'block text-slate-700 text-[0.8125rem] font-semibold mb-1.5';
const MODAL_TEXTAREA =
  'w-full border border-slate-200 focus:border-purple-500 text-slate-700 placeholder-slate-400 outline-none text-sm font-medium resize-none';
const MODAL_FIELD_STYLE = { borderRadius: '0.625rem', padding: '0.75rem 0.875rem' } as const;

const SLOT_PILL_RADIUS = '9999px';

type TeacherBooking = ReturnType<typeof useTeacherBooking>;

type BookingSlotPickerProps = {
  booking: TeacherBooking;
  minDate: string;
  selectedSummaryRef?: RefObject<HTMLDivElement | null>;
};

export function BookingSlotPicker({ booking, minDate, selectedSummaryRef }: BookingSlotPickerProps) {
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const calendarWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDateCalendar) return;
    const onPointerDown = (e: MouseEvent) => {
      if (calendarWrapRef.current && !calendarWrapRef.current.contains(e.target as Node)) {
        setShowDateCalendar(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showDateCalendar]);

  const weekRangeLabel =
    `${booking.weekDates[0]?.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' })} – ${booking.weekDates[6]?.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })} г.`;

  const handlePickDate = (dateKey: string) => {
    booking.goToDate(new Date(dateKey + 'T12:00'));
    setShowDateCalendar(false);
  };

  return (
    <div className="space-y-5">
      {booking.earliestFreeSlot && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-100 bg-purple-50/50"
          style={{ padding: '0.875rem 1rem' }}
        >
          <p className="text-sm text-slate-700 leading-relaxed">
            <span className="font-semibold text-purple-800">Най-ранен свободен час:</span>{' '}
            {new Date(booking.earliestFreeSlot.date + 'T12:00').toLocaleDateString('bg-BG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            в {booking.earliestFreeSlot.time}
          </p>
          <button
            type="button"
            onClick={() => {
              const slot = booking.earliestFreeSlot;
              if (!slot) return;
              booking.goToDate(new Date(slot.date + 'T12:00'));
              booking.setBookingForm((prev) => ({ ...prev, date: slot.date, time: slot.time }));
            }}
            className="text-sm font-semibold text-purple-700 hover:text-purple-900 transition-colors shrink-0"
          >
            Отиди там
          </button>
        </div>
      )}

      <div>
        <h3
          className="text-slate-900"
          style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '1rem' }}
        >
          Изберете ден и час
        </h3>

        <div className="flex items-center justify-between gap-2 flex-wrap" style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={booking.goPrevWeek}
            disabled={!booking.canGoPrevWeek}
            className="flex items-center justify-center border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-600 transition-colors disabled:opacity-35 disabled:pointer-events-none shrink-0"
            style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem' }}
            aria-label="Предишна седмица"
          >
            <span className="material-icons" style={{ fontSize: '1.25rem' }}>chevron_left</span>
          </button>

          <div className="flex flex-col items-center flex-1 min-w-0" style={{ gap: '0.625rem' }}>
            <p className="text-slate-800 tabular-nums text-center" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {weekRangeLabel}
            </p>
            <div className="relative" ref={calendarWrapRef}>
              <button
                type="button"
                onClick={() => setShowDateCalendar((v) => !v)}
                className={`inline-flex items-center bg-white border transition-colors ${
                  showDateCalendar
                    ? 'border-purple-400 text-purple-800 bg-purple-50'
                    : 'border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
                }`}
                style={{
                  gap: '0.375rem',
                  padding: '0.4375rem 0.875rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                <span className="material-icons text-purple-700" style={{ fontSize: '1.0625rem' }}>
                  calendar_today
                </span>
                Друга дата
              </button>
              {showDateCalendar && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 z-20 mt-2 w-[min(100vw-2rem,22rem)] shadow-xl"
                  style={{ top: '100%' }}
                >
                  <DatePickerCalendar
                    value=""
                    onChange={handlePickDate}
                    minDate={minDate || getTodayDateKey()}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={booking.goNextWeek}
            disabled={!booking.canGoNextWeek}
            className="flex items-center justify-center border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-600 transition-colors disabled:opacity-35 disabled:pointer-events-none shrink-0"
            style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem' }}
            aria-label="Следваща седмица"
          >
            <span className="material-icons" style={{ fontSize: '1.25rem' }}>chevron_right</span>
          </button>
        </div>

        <div
          className="overflow-x-auto pb-1 flex gap-3 scrollbar-none -mx-0.5"
          style={{ scrollPaddingInline: '0.5rem' }}
        >
          {booking.weekDates.map((d) => {
            const dateKey = booking.formatDateKey(d);
            const daySlots = booking.slotsByDay.get(dateKey) ?? [];
            const isExpanded = booking.expandedDays.has(dateKey);
            const visibleSlots = isExpanded ? daySlots : daySlots.slice(0, booking.INITIAL_SLOTS_PER_DAY);
            const hasMore = daySlots.length > booking.INITIAL_SLOTS_PER_DAY && !isExpanded;
            const dayName = getDayNameBg(d.getDay() === 0 ? 7 : d.getDay());
            const dateStr = `${d.getDate().toString().padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
            const hasFreeSlots = daySlots.some((s) => s.status === 'free');
            const isDaySelected = booking.bookingForm.date === dateKey;

            return (
              <div
                key={dateKey}
                className={`flex-shrink-0 w-[8.5rem] sm:w-[9.25rem] flex flex-col overflow-hidden border transition-colors ${
                  hasFreeSlots
                    ? isDaySelected
                      ? 'border-purple-300 bg-white shadow-sm shadow-purple-100/80'
                      : 'border-slate-200 bg-white'
                    : 'border-slate-100 bg-slate-50/80'
                }`}
                style={{ borderRadius: '0.75rem' }}
              >
                <div
                  className={`border-b ${hasFreeSlots ? 'border-slate-100 bg-white' : 'border-slate-100 bg-slate-50/60'}`}
                  style={{ padding: '0.625rem 0.75rem' }}
                >
                  <p className="font-semibold text-slate-900 capitalize leading-tight" style={{ fontSize: '0.8125rem' }}>
                    {dayName}
                  </p>
                  <p className="text-slate-500 tabular-nums" style={{ fontSize: '0.6875rem', marginTop: '0.125rem' }}>
                    {dateStr}
                  </p>
                </div>
                <div style={{ padding: '0.5rem 0.5rem 0.625rem', minHeight: '6.5rem' }}>
                  <div className="grid grid-cols-2" style={{ gap: '0.375rem' }}>
                    {visibleSlots.map((slot) => {
                      const isFree = slot.status === 'free';
                      const selected =
                        booking.bookingForm.date === dateKey && booking.bookingForm.time === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() =>
                            isFree &&
                            booking.setBookingForm((prev: BookingFormState) => ({
                              ...prev,
                              date: dateKey,
                              time: slot.time,
                            }))
                          }
                          disabled={!isFree}
                          className={`border text-center transition-all ${
                            selected
                              ? 'bg-purple-700 text-white border-purple-700 shadow-sm shadow-purple-700/25'
                              : isFree
                                ? 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50 hover:border-purple-400'
                                : 'bg-slate-50/90 text-slate-300 border-slate-100 cursor-not-allowed'
                          }`}
                          style={{
                            borderRadius: SLOT_PILL_RADIUS,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '0.375rem 0.25rem',
                            lineHeight: 1.2,
                          }}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => booking.setExpandedDays((prev) => new Set(prev).add(dateKey))}
                      className="w-full mt-2 bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                      style={{
                        borderRadius: SLOT_PILL_RADIUS,
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.375rem 0.5rem',
                      }}
                    >
                      Още
                    </button>
                  )}
                  {daySlots.length === 0 && (
                    <p className="text-slate-400 text-center" style={{ fontSize: '0.6875rem', padding: '1.25rem 0' }}>
                      Няма слотове
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {booking.bookingForm.date && booking.bookingForm.time && (
        <div ref={selectedSummaryRef} className="border-t border-slate-100 space-y-3" style={{ paddingTop: '1.25rem' }}>
          <div
            className="flex items-start gap-2 rounded-xl border border-purple-100 bg-purple-50/80"
            style={{ padding: '0.75rem 0.875rem' }}
          >
            <span className="material-icons text-purple-700 shrink-0" style={{ fontSize: '1.125rem' }}>
              check_circle
            </span>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Избрахте:{' '}
              {new Date(booking.bookingForm.date + 'T12:00').toLocaleDateString('bg-BG', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              в {booking.bookingForm.time}
            </p>
          </div>
          <div>
            <label className={MODAL_LABEL}>Съобщение (по избор)</label>
            <textarea
              value={booking.bookingForm.message}
              onChange={(e) =>
                booking.setBookingForm((prev: BookingFormState) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Добавете допълнителна информация..."
              rows={3}
              className={MODAL_TEXTAREA}
              style={{ ...MODAL_FIELD_STYLE, minHeight: '5.5rem' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
