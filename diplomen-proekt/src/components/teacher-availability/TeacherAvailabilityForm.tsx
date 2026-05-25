import { useState, useEffect, useMemo } from "react";
import { getDayNameBg } from "../../utils/teacherSlots";
import { AlertBanner } from "../ui/feedback/AlertBanner";
import { TeacherWeeklySchedule } from "../teacher/TeacherWeeklySchedule";
import type {
  TeacherAvailabilityRow,
  TeacherBookingSettingsRow,
  TeacherBlockedSlotRow,
  TeacherScheduleExceptionRow,
} from "../../types/teacher";

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const DURATIONS = [30, 45, 60] as const;
const BUFFERS = [0, 5, 10, 15] as const;
const BUFFERS_TEACHER = [0, 10, 15] as const;

export interface TeacherAvailabilityFormData {
  availability: { day_of_week: number; start_time: string; end_time: string }[];
  settings: {
    lesson_duration_minutes: 30 | 45 | 60;
    buffer_minutes: 0 | 5 | 10 | 15;
    auto_accept_bookings: boolean;
  };
  blockedSlots: { day_of_week: number; start_time: string; end_time: string }[];
  exceptions: {
    exception_date: string;
    is_fully_unavailable: boolean;
    override_start_time: string | null;
    override_end_time: string | null;
  }[];
}

interface TeacherAvailabilityFormProps {
  initialAvailability: TeacherAvailabilityRow[];
  initialSettings: TeacherBookingSettingsRow | null;
  initialBlocked: TeacherBlockedSlotRow[];
  initialExceptions: TeacherScheduleExceptionRow[];
  onSave: (data: TeacherAvailabilityFormData) => Promise<void>;
  saving: boolean;
  variant?: "default" | "teacher";
}

export function TeacherAvailabilityForm({
  initialAvailability,
  initialSettings,
  initialBlocked,
  initialExceptions,
  onSave,
  saving,
  variant = "default",
}: TeacherAvailabilityFormProps) {
  const isTeacher = variant === "teacher";
  const bufferOptions = isTeacher ? BUFFERS_TEACHER : BUFFERS;
  const [availability, setAvailability] = useState<
    { day_of_week: number; start_time: string; end_time: string; enabled: boolean }[]
  >(
    DAYS.map((d) => {
      const existing = initialAvailability.find((a) => a.day_of_week === d);
      return {
        day_of_week: d,
        start_time: existing?.start_time?.slice(0, 5) ?? "09:00",
        end_time: existing?.end_time?.slice(0, 5) ?? "17:00",
        enabled: !!existing,
      };
    })
  );
  const [duration, setDuration] = useState<30 | 45 | 60>(
    initialSettings?.lesson_duration_minutes ?? 45
  );
  const [buffer, setBuffer] = useState<0 | 5 | 10 | 15>(
    initialSettings?.buffer_minutes ?? 0
  );
  const [autoAcceptBookings, setAutoAcceptBookings] = useState<boolean>(
    initialSettings?.auto_accept_bookings ?? false
  );
  const [blockedSlots, setBlockedSlots] = useState<
    { day_of_week: number; start_time: string; end_time: string }[]
  >(
    initialBlocked.map((b) => ({
      day_of_week: b.day_of_week,
      start_time: (b.start_time ?? "").slice(0, 5) || "12:00",
      end_time: (b.end_time ?? "").slice(0, 5) || "13:00",
    }))
  );
  const [exceptions, setExceptions] = useState<
    {
      exception_date: string;
      is_fully_unavailable: boolean;
      override_start_time: string | null;
      override_end_time: string | null;
    }[]
  >(
    initialExceptions.map((e) => ({
      exception_date: String(e.exception_date).slice(0, 10),
      is_fully_unavailable: e.is_fully_unavailable,
      override_start_time: e.override_start_time?.slice(0, 5) ?? null,
      override_end_time: e.override_end_time?.slice(0, 5) ?? null,
    }))
  );

  useEffect(() => {
    setAvailability(
      DAYS.map((d) => {
        const existing = initialAvailability.find((a) => a.day_of_week === d);
        return {
          day_of_week: d,
          start_time: existing?.start_time?.slice(0, 5) ?? "09:00",
          end_time: existing?.end_time?.slice(0, 5) ?? "17:00",
          enabled: !!existing,
        };
      })
    );
    setDuration(initialSettings?.lesson_duration_minutes ?? 45);
    const buf = initialSettings?.buffer_minutes ?? 0;
    setBuffer(isTeacher && buf === 5 ? 10 : buf);
    setAutoAcceptBookings(initialSettings?.auto_accept_bookings ?? false);
    setBlockedSlots(
      initialBlocked.map((b) => ({
        day_of_week: b.day_of_week,
        start_time: (b.start_time ?? "").slice(0, 5) || "12:00",
        end_time: (b.end_time ?? "").slice(0, 5) || "13:00",
      }))
    );
    setExceptions(
      initialExceptions.map((e) => ({
        exception_date: String(e.exception_date).slice(0, 10),
        is_fully_unavailable: e.is_fully_unavailable,
        override_start_time: e.override_start_time?.slice(0, 5) ?? null,
        override_end_time: e.override_end_time?.slice(0, 5) ?? null,
      }))
    );
  }, [
    initialAvailability,
    initialSettings,
    initialBlocked,
    initialExceptions,
    isTeacher,
  ]);

  const handleSave = () => {
    const data: TeacherAvailabilityFormData = {
      availability: availability
        .filter((a) => a.enabled)
        .map((a) => ({
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
        })),
      settings: {
        lesson_duration_minutes: duration,
        buffer_minutes: buffer,
        auto_accept_bookings: autoAcceptBookings,
      },
      blockedSlots,
      exceptions,
    };
    onSave(data);
  };

  const addBlocked = () => {
    setBlockedSlots((prev) => [
      ...prev,
      { day_of_week: 1, start_time: "12:00", end_time: "13:00" },
    ]);
  };
  const removeBlocked = (i: number) => {
    setBlockedSlots((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateBlocked = (
    i: number,
    field: "day_of_week" | "start_time" | "end_time",
    value: number | string
  ) => {
    setBlockedSlots((prev) =>
      prev.map((b, idx) =>
        idx === i ? { ...b, [field]: value } : b
      )
    );
  };

  const addException = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    setExceptions((prev) => [
      ...prev,
      {
        exception_date: dateStr,
        is_fully_unavailable: true,
        override_start_time: null,
        override_end_time: null,
      },
    ]);
  };
  const removeException = (i: number) => {
    setExceptions((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateException = (
    i: number,
    field: string,
    value: string | boolean | null
  ) => {
    setExceptions((prev) =>
      prev.map((e, idx) =>
        idx === i ? { ...e, [field]: value } : e
      )
    );
  };

  const dayRow = (a: typeof availability[0], i: number) => (
    <div
      key={a.day_of_week}
      className={`flex flex-wrap items-center transition-colors ${a.enabled ? "hover:bg-white/60" : ""}`}
      style={{
        padding: '0.875rem 1.25rem',
        gap: '1.25rem',
        borderBottom: i < availability.length - 1 ? '1px solid #f1f5f9' : 'none',
        background: a.enabled ? 'transparent' : '#f8fafc',
      }}
    >
      <label className="flex items-center cursor-pointer" style={{ gap: '0.75rem', minWidth: '9rem' }}>
        <input
          type="checkbox"
          checked={a.enabled}
          onChange={(e) =>
            setAvailability((prev) =>
              prev.map((p, j) =>
                j === i ? { ...p, enabled: e.target.checked } : p
              )
            )
          }
          className="rounded text-purple-700 focus:ring-purple-600"
          style={{ width: '1.125rem', height: '1.125rem' }}
        />
        <span className={`font-semibold ${a.enabled ? "text-slate-700" : "text-slate-400"}`} style={{ fontSize: '0.9375rem' }}>
          {getDayNameBg(a.day_of_week)}
        </span>
      </label>
      {a.enabled ? (
        <div className="flex items-center" style={{ gap: '0.625rem' }}>
          <input
            type="time"
            value={a.start_time}
            onChange={(e) =>
              setAvailability((prev) =>
                prev.map((p, j) =>
                  j === i ? { ...p, start_time: e.target.value } : p
                )
              )
            }
            className="bg-white border border-slate-200 text-slate-700 focus:ring-purple-600 focus:border-purple-600"
            style={{ borderRadius: '0.625rem', fontSize: '0.875rem', padding: '0.5rem 0.625rem' }}
          />
          <span className="text-slate-300 font-medium">–</span>
          <input
            type="time"
            value={a.end_time}
            onChange={(e) =>
              setAvailability((prev) =>
                prev.map((p, j) =>
                  j === i ? { ...p, end_time: e.target.value } : p
                )
              )
            }
            className="bg-white border border-slate-200 text-slate-700 focus:ring-purple-600 focus:border-purple-600"
            style={{ borderRadius: '0.625rem', fontSize: '0.875rem', padding: '0.5rem 0.625rem' }}
          />
        </div>
      ) : (
        <span className="text-slate-400 italic" style={{ fontSize: '0.8125rem' }}>Неработен ден</span>
      )}
    </div>
  );

  const durationBufferSection = (
    <div className="border-t border-slate-100" style={{ paddingTop: '1.5rem' }}>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <p className="text-slate-400 uppercase tracking-wider" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            Продължителност на урок
          </p>
          <div className="flex" style={{ gap: '0.5rem' }}>
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`font-semibold transition-all ${
                  duration === d
                    ? "bg-purple-700 text-white shadow-md shadow-purple-700/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                }`}
                style={{ padding: '0.625rem 1.125rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}
              >
                {d} мин
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <p className="text-slate-400 uppercase tracking-wider" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            Буфер между уроци
          </p>
          <div className="flex" style={{ gap: '0.5rem' }}>
            {bufferOptions.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBuffer(b)}
                className={`font-semibold transition-all ${
                  buffer === b
                    ? "bg-purple-700 text-white shadow-md shadow-purple-700/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                }`}
                style={{ padding: '0.625rem 1.125rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}
              >
                {b} мин
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const saveButton = (
    <div style={{ paddingTop: '0.5rem' }}>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || availability.every((a) => !a.enabled)}
        className="w-full bg-purple-700 text-white font-bold hover:bg-purple-800 transition-all shadow-md shadow-purple-700/20 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ padding: '0.875rem 0', borderRadius: '0.875rem', fontSize: '0.9375rem' }}
      >
        {saving ? "Запазване..." : "Запази наличност"}
      </button>
    </div>
  );

  const enabledAvailability = useMemo(
    () =>
      availability
        .filter((a) => a.enabled)
        .map((a) => ({
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
        })),
    [availability]
  );

  const teacherContent = (
    <>
      <AlertBanner variant="info">
        <p style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
          <strong>Седмичен график</strong> — задавате работни дни и часове веднъж; те се повтарят
          автоматично всяка седмица. Не е нужно да попълвате график всеки месец. За отделни дати
          (почивка, празник) използвайте изключения по-долу.
        </p>
      </AlertBanner>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p className="text-slate-400 uppercase tracking-wider" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          Работно време (дни и часове)
        </p>
        <div className="bg-slate-50 border border-slate-100" style={{ borderRadius: '0.875rem', overflow: 'hidden' }}>
          {availability.map((a, i) => dayRow(a, i))}
        </div>
      </div>

      {enabledAvailability.length > 0 && (
        <div
          className="border border-purple-100 bg-purple-50/40"
          style={{ borderRadius: "0.875rem", padding: "1rem 1.125rem" }}
        >
          <p
            className="text-purple-800 uppercase"
            style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.75rem" }}
          >
            Преглед на седмичния график
          </p>
          <TeacherWeeklySchedule
            availability={enabledAvailability}
            lessonMinutes={duration}
            compact
          />
        </div>
      )}

      {durationBufferSection}
      {saveButton}
    </>
  );

  if (isTeacher) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>{teacherContent}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Schedule days */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <p className="text-slate-400 uppercase tracking-wider" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Работно време (дни и часове)
          </p>
          <p className="text-slate-500" style={{ fontSize: '0.8125rem' }}>
            Изберете дни от седмицата и начален/краен час. Шаблонът важи всяка седмица.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-100" style={{ borderRadius: '0.875rem', overflow: 'hidden' }}>
          {availability.map((a, i) => dayRow(a, i))}
        </div>
      </div>

      {durationBufferSection}

      {/* Auto-accept */}
      <div className="border-t border-slate-100" style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p className="text-slate-400 uppercase tracking-wider" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          Автоматично приемане на часове
        </p>
        <p className="text-slate-500" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
          Ако е включено, записаните от учениците часове се приемат веднага. Ако е изключено, ще трябва да ги потвърдите от профила си.
        </p>
        <label className="flex items-center cursor-pointer" style={{ gap: '0.75rem' }}>
          <input
            type="checkbox"
            checked={autoAcceptBookings}
            onChange={(e) => setAutoAcceptBookings(e.target.checked)}
            className="rounded text-purple-700 focus:ring-purple-600"
            style={{ width: '1.125rem', height: '1.125rem' }}
          />
          <span className="text-slate-700 font-medium" style={{ fontSize: '0.9375rem' }}>
            Приемам автоматично нови записани часове
          </span>
        </label>
      </div>

      {/* Blocked slots */}
      <div className="border-t border-slate-100" style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <p className="text-slate-400 uppercase tracking-wider" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Почивки / блокирани часове
          </p>
          <p className="text-slate-500" style={{ fontSize: '0.8125rem' }}>
            Напр. обедна почивка 12:00–13:00 в избрани дни.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {blockedSlots.map((b, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center bg-slate-50 border border-slate-100"
              style={{ gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem' }}
            >
              <select
                value={b.day_of_week}
                onChange={(e) =>
                  updateBlocked(i, "day_of_week", Number(e.target.value))
                }
                className="bg-white border border-slate-200 text-slate-700 focus:ring-purple-600 focus:border-purple-600"
                style={{ borderRadius: '0.625rem', fontSize: '0.875rem', padding: '0.5rem 0.625rem' }}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {getDayNameBg(d)}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={b.start_time}
                onChange={(e) => updateBlocked(i, "start_time", e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 focus:ring-purple-600 focus:border-purple-600"
                style={{ borderRadius: '0.625rem', fontSize: '0.875rem', padding: '0.5rem 0.625rem' }}
              />
              <span className="text-slate-300 font-medium">–</span>
              <input
                type="time"
                value={b.end_time}
                onChange={(e) => updateBlocked(i, "end_time", e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 focus:ring-purple-600 focus:border-purple-600"
                style={{ borderRadius: '0.625rem', fontSize: '0.875rem', padding: '0.5rem 0.625rem' }}
              />
              <button
                type="button"
                onClick={() => removeBlocked(i)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                style={{ padding: '0.375rem', borderRadius: '0.5rem' }}
                aria-label="Премахни"
              >
                <span className="material-icons" style={{ fontSize: '1.125rem' }}>close</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addBlocked}
            className="text-purple-700 hover:text-purple-800 hover:bg-purple-50 transition-colors font-semibold flex items-center self-start"
            style={{ gap: '0.375rem', fontSize: '0.875rem', padding: '0.5rem 0.75rem', borderRadius: '0.625rem' }}
          >
            <span className="material-icons" style={{ fontSize: '1rem' }}>add</span>
            Добави почивка
          </button>
        </div>
      </div>

      {/* Exceptions */}
      <div className="border-t border-slate-100" style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <p className="text-slate-400 uppercase tracking-wider" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Изключения по дата
          </p>
          <p className="text-slate-500" style={{ fontSize: '0.8125rem' }}>
            Напр. „няма да работя на тази дата" или различен график за един ден.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {exceptions.map((e, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center bg-slate-50 border border-slate-100"
              style={{ gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem' }}
            >
              <input
                type="date"
                value={e.exception_date}
                onChange={(ev) =>
                  updateException(i, "exception_date", ev.target.value)
                }
                className="bg-white border border-slate-200 text-slate-700 focus:ring-purple-600 focus:border-purple-600"
                style={{ borderRadius: '0.625rem', fontSize: '0.875rem', padding: '0.5rem 0.625rem' }}
              />
              <label className="flex items-center cursor-pointer" style={{ gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={e.is_fully_unavailable}
                  onChange={(ev) =>
                    updateException(i, "is_fully_unavailable", ev.target.checked)
                  }
                  className="rounded text-purple-700 focus:ring-purple-600"
                  style={{ width: '1rem', height: '1rem' }}
                />
                <span className="text-slate-600 font-medium" style={{ fontSize: '0.875rem' }}>Цял ден неизползваем</span>
              </label>
              {!e.is_fully_unavailable && (
                <div className="flex items-center" style={{ gap: '0.625rem' }}>
                  <input
                    type="time"
                    value={e.override_start_time ?? ""}
                    onChange={(ev) =>
                      updateException(i, "override_start_time", ev.target.value || null)
                    }
                    className="bg-white border border-slate-200 text-slate-700 focus:ring-purple-600 focus:border-purple-600"
                    style={{ borderRadius: '0.625rem', fontSize: '0.875rem', padding: '0.5rem 0.625rem' }}
                  />
                  <span className="text-slate-300 font-medium">–</span>
                  <input
                    type="time"
                    value={e.override_end_time ?? ""}
                    onChange={(ev) =>
                      updateException(i, "override_end_time", ev.target.value || null)
                    }
                    className="bg-white border border-slate-200 text-slate-700 focus:ring-purple-600 focus:border-purple-600"
                    style={{ borderRadius: '0.625rem', fontSize: '0.875rem', padding: '0.5rem 0.625rem' }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeException(i)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                style={{ padding: '0.375rem', borderRadius: '0.5rem' }}
                aria-label="Премахни"
              >
                <span className="material-icons" style={{ fontSize: '1.125rem' }}>close</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addException}
            className="text-purple-700 hover:text-purple-800 hover:bg-purple-50 transition-colors font-semibold flex items-center self-start"
            style={{ gap: '0.375rem', fontSize: '0.875rem', padding: '0.5rem 0.75rem', borderRadius: '0.625rem' }}
          >
            <span className="material-icons" style={{ fontSize: '1rem' }}>add</span>
            Добави изключение
          </button>
        </div>
      </div>

      {saveButton}
    </div>
  );
}
