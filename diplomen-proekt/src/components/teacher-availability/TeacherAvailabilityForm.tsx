import { useState, useEffect } from "react";
import { getDayNameBg } from "../../utils/teacherSlots";
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

  const teacherContent = (
    <>
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          Работно време (Дни и часове)
        </p>
        <div className="space-y-2">
          {availability.map((a, i) => (
            <div
              key={a.day_of_week}
              className={`flex flex-wrap items-center gap-4 p-3 rounded-xl transition-colors ${
                a.enabled
                  ? "hover:bg-slate-50"
                  : "bg-slate-50"
              }`}
            >
              <label className="flex items-center gap-3 min-w-[120px]">
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
                  className="rounded text-[#6D28D9] focus:ring-[#6D28D9] h-5 w-5"
                />
                <span className={`font-medium text-sm ${!a.enabled ? "text-slate-400" : ""}`}>
                  {getDayNameBg(a.day_of_week)}
                </span>
              </label>
              {a.enabled ? (
                <div className="flex items-center gap-2">
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
                    className="bg-transparent border border-slate-200 rounded-lg text-sm focus:ring-[#6D28D9] focus:border-[#6D28D9] px-2 py-1"
                  />
                  <span className="text-slate-400">–</span>
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
                    className="bg-transparent border border-slate-200 rounded-lg text-sm focus:ring-[#6D28D9] focus:border-[#6D28D9] px-2 py-1"
                  />
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Неработен ден</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Продължителност на урок
          </p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  duration === d
                    ? "bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/20"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                {d} мин
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Буфер между уроци
          </p>
          <div className="flex gap-2">
            {bufferOptions.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBuffer(b)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  buffer === b
                    ? "bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/20"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                {b} мин
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || availability.every((a) => !a.enabled)}
          className="w-full py-3 bg-[#6D28D9] text-white rounded-xl font-bold hover:bg-[#8B5CF6] transition-all shadow-lg shadow-[#6D28D9]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Запазване..." : "Запази наличност"}
        </button>
      </div>
    </>
  );

  if (isTeacher) {
    return <div className="space-y-6">{teacherContent}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-purple-700 mb-3 uppercase tracking-wide">
          Работно време (дни и часове)
        </h3>
        <p className="text-xs text-slate-600 mb-3">
          Изберете дни от седмицата и начален/краен час. 
        </p>
        <div className="space-y-2">
          {availability.map((a, i) => (
            <div key={a.day_of_week} className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 w-28">
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
                />
                <span className="text-sm font-medium text-slate-700">
                  {getDayNameBg(a.day_of_week)}
                </span>
              </label>
              {a.enabled && (
                <>
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
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  />
                  <span className="text-slate-500">–</span>
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
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">
          Продължителност на урок
        </h3>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                duration === d
                  ? "bg-purple-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {d} мин
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">
          Буфер между уроци
        </h3>
        <div className="flex gap-2">
          {BUFFERS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBuffer(b)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                buffer === b
                  ? "bg-purple-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {b} мин
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">
          Автоматично приемане на часове
        </h3>
        <p className="text-xs text-slate-600 mb-2">
          Ако е включено, записаните от учениците часове се приемат веднага. Ако е изключено, ще трябва да ги потвърдите от профила си.
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoAcceptBookings}
            onChange={(e) => setAutoAcceptBookings(e.target.checked)}
            className="rounded border-slate-300 text-purple-700 focus:ring-purple-500"
          />
          <span className="text-sm font-medium text-slate-700">
            Приемам автоматично нови записани часове
          </span>
        </label>
      </div>

      <div>
        <h3 className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">
          Почивки / блокирани часове
        </h3>
        <p className="text-xs text-slate-600 mb-2">
          Напр. обедна почивка 12:00–13:00 в избрани дни.
        </p>
        <div className="space-y-2">
          {blockedSlots.map((b, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                value={b.day_of_week}
                onChange={(e) =>
                  updateBlocked(i, "day_of_week", Number(e.target.value))
                }
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
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
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm w-24"
              />
              <span className="text-slate-500">–</span>
              <input
                type="time"
                value={b.end_time}
                onChange={(e) => updateBlocked(i, "end_time", e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm w-24"
              />
              <button
                type="button"
                onClick={() => removeBlocked(i)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Премахни
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addBlocked}
            className="text-sm font-semibold text-purple-700 hover:text-purple-800"
          >
            + Добави почивка
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">
          Изключения по дата
        </h3>
        <p className="text-xs text-slate-600 mb-2">
          Напр. „няма да работя на тази дата“ или различен график за един ден.
        </p>
        <div className="space-y-2">
          {exceptions.map((e, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <input
                type="date"
                value={e.exception_date}
                onChange={(ev) =>
                  updateException(i, "exception_date", ev.target.value)
                }
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={e.is_fully_unavailable}
                  onChange={(ev) =>
                    updateException(i, "is_fully_unavailable", ev.target.checked)
                  }
                />
                Цял ден неизползваем
              </label>
              {!e.is_fully_unavailable && (
                <>
                  <input
                    type="time"
                    value={e.override_start_time ?? ""}
                    onChange={(ev) =>
                      updateException(i, "override_start_time", ev.target.value || null)
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm w-24"
                  />
                  <span className="text-slate-500">–</span>
                  <input
                    type="time"
                    value={e.override_end_time ?? ""}
                    onChange={(ev) =>
                      updateException(i, "override_end_time", ev.target.value || null)
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm w-24"
                  />
                </>
              )}
              <button
                type="button"
                onClick={() => removeException(i)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Премахни
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addException}
            className="text-sm font-semibold text-purple-700 hover:text-purple-800"
          >
            + Добави изключение
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || availability.every((a) => !a.enabled)}
        className="px-5 py-2.5 bg-purple-900 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        {saving ? "Запазване..." : "Запази наличност"}
      </button>
    </div>
  );
}
