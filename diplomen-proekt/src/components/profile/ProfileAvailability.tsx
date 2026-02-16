import { TeacherAvailabilityForm } from "../teacher-availability/TeacherAvailabilityForm";
import type {
    TeacherAvailabilityRow,
    TeacherBookingSettingsRow,
    TeacherBlockedSlotRow,
    TeacherScheduleExceptionRow,
} from "../../types/teacher";
import type { TeacherAvailabilityFormData } from "../teacher-availability/TeacherAvailabilityForm";

interface ProfileAvailabilityProps {
    initialAvailability: TeacherAvailabilityRow[];
    initialSettings: TeacherBookingSettingsRow | null;
    initialBlocked: TeacherBlockedSlotRow[];
    initialExceptions: TeacherScheduleExceptionRow[];
    onSave: (data: TeacherAvailabilityFormData) => Promise<void>;
    saving: boolean;
    variant?: "default" | "teacher";
}

export function ProfileAvailability({
    initialAvailability,
    initialSettings,
    initialBlocked,
    initialExceptions,
    onSave,
    saving,
    variant = "default",
}: ProfileAvailabilityProps) {
    const isTeacher = variant === "teacher";

    if (isTeacher) {
        return (
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-purple-700/10 flex items-center justify-center text-purple-700">
                        <span className="material-icons">schedule</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Кога съм на разположение</h3>
                        <p className="text-xs text-slate-500">Настройте работните си дни и часове.</p>
                    </div>
                </div>
                <TeacherAvailabilityForm
                    initialAvailability={initialAvailability}
                    initialSettings={initialSettings}
                    initialBlocked={initialBlocked}
                    initialExceptions={initialExceptions}
                    onSave={onSave}
                    saving={saving}
                    variant="teacher"
                />
            </section>
        );
    }

    return (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-700/10 border-2 border-purple-200/40 p-8 hover:shadow-purple-700/20 hover:border-purple-300/60 transition-all duration-700">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-700 to-slate-900 bg-clip-text text-transparent">
                Кога съм на разположение
            </h3>
            <p className="text-sm text-slate-600 mb-6">
                Настройте работните си дни и часове, продължителност на урок и почивки. Учениците ще виждат само свободни
                слотове.
            </p>
            <TeacherAvailabilityForm
                initialAvailability={initialAvailability}
                initialSettings={initialSettings}
                initialBlocked={initialBlocked}
                initialExceptions={initialExceptions}
                onSave={onSave}
                saving={saving}
            />
        </div>
    );
}
