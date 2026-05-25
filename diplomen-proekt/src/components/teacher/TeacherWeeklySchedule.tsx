import { getDayNameBg } from "../../utils/teacherSlots";

export type WeeklyScheduleDay = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type TeacherWeeklyScheduleProps = {
  availability: WeeklyScheduleDay[];
  lessonMinutes?: number | null;
  compact?: boolean;
};

export function TeacherWeeklySchedule({
  availability,
  lessonMinutes,
  compact = false,
}: TeacherWeeklyScheduleProps) {
  const sorted = [...availability].sort((a, b) => a.day_of_week - b.day_of_week);

  if (sorted.length === 0) {
    return (
      <p className="text-slate-500" style={{ fontSize: "0.875rem" }}>
        Няма зададено работно време.
      </p>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: compact ? "0.375rem" : "0.5rem" }}>
      {sorted.map((a) => (
        <div
          key={a.day_of_week}
          className="flex items-center justify-between bg-slate-50 border border-slate-100"
          style={{
            padding: compact ? "0.5rem 0.75rem" : "0.625rem 0.875rem",
            borderRadius: "0.625rem",
          }}
        >
          <span className="text-slate-800 font-semibold capitalize" style={{ fontSize: "0.875rem" }}>
            {getDayNameBg(a.day_of_week)}
          </span>
          <span className="text-slate-600 tabular-nums" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
            {String(a.start_time).slice(0, 5)} – {String(a.end_time).slice(0, 5)}
          </span>
        </div>
      ))}
      {lessonMinutes != null && lessonMinutes > 0 && (
        <p className="text-slate-500" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
          Продължителност на урок: {lessonMinutes} мин · графикът се повтаря всяка седмица
        </p>
      )}
    </div>
  );
}
