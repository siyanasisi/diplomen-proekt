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
}

export function ProfileAvailability({
    initialAvailability,
    initialSettings,
    initialBlocked,
    initialExceptions,
    onSave,
    saving,
}: ProfileAvailabilityProps) {
    return (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-8 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
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
