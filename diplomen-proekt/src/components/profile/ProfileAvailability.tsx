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
            <section className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '2.25rem 2.5rem' }}>
                <div className="flex items-center" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
                    <div className="flex items-center justify-center bg-purple-50 text-purple-700" style={{ width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem' }}>
                        <span className="material-icons" style={{ fontSize: '1.5rem' }}>schedule</span>
                    </div>
                    <div>
                        <h3 className="text-slate-900" style={{ fontSize: '1.1875rem', fontWeight: 700 }}>Кога съм на разположение</h3>
                        <p className="text-slate-500" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Настройте работните си дни и часове.</p>
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
        <section className="bg-white border border-slate-200" style={{ borderRadius: '1rem', padding: '2.25rem 2.5rem' }}>
            <div className="flex items-center" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="flex items-center justify-center bg-purple-50 text-purple-700" style={{ width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem' }}>
                    <span className="material-icons" style={{ fontSize: '1.5rem' }}>schedule</span>
                </div>
                <div>
                    <h3 className="text-slate-900" style={{ fontSize: '1.1875rem', fontWeight: 700 }}>Кога съм на разположение</h3>
                    <p className="text-slate-500" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                        Настройте работните си дни и часове, продължителност на урок и почивки.
                    </p>
                </div>
            </div>
            <TeacherAvailabilityForm
                initialAvailability={initialAvailability}
                initialSettings={initialSettings}
                initialBlocked={initialBlocked}
                initialExceptions={initialExceptions}
                onSave={onSave}
                saving={saving}
            />
        </section>
    );
}
