import type { CalendarEvent } from "../../hooks/useProfile";

interface ProfileEventsProps {
    role: string | null;
    events: CalendarEvent[];
    showAllEvents: boolean;
    allEventsCount: number;
    onToggleShowAll: () => void;
    onNavigateHome: () => void;
    formatDate: (dateStr: string) => string;
    formatFullDate: (dateStr: string) => string;
    onDeleteEvent: (eventId: string) => void;
}

export function ProfileEvents({
    role,
    events,
    showAllEvents,
    allEventsCount,
    onToggleShowAll,
    onNavigateHome,
    formatFullDate,
    onDeleteEvent,
}: ProfileEventsProps) {
    const isTeacher = role === "teacher";
    const title = isTeacher ? "Събития" : "Предстоящи събития";

    return (
        <section>
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600 }}>{title}</h3>
                <div className="flex items-center" style={{ gap: '0.5rem' }}>
                    {isTeacher && allEventsCount > 0 && (
                        <button
                            onClick={onToggleShowAll}
                            className="text-purple-700 hover:text-purple-800"
                            style={{ fontSize: '0.8125rem', fontWeight: 600 }}
                        >
                            {showAllEvents ? "Предстоящи" : "Всички"} →
                        </button>
                    )}
                    {!isTeacher && (
                        <button
                            onClick={onNavigateHome}
                            className="text-purple-700 hover:text-purple-800"
                            style={{ fontSize: '0.8125rem', fontWeight: 600 }}
                        >
                            Виж всички →
                        </button>
                    )}
                </div>
            </div>

            {events.length > 0 ? (
                <div className="bg-white border border-slate-200 overflow-hidden divide-y divide-slate-100" style={{ borderRadius: '1rem' }}>
                    {events.map((event, index) => {
                        const [, monthStr, dayStr] = event.date.split("-");
                        return (
                            <div
                                key={event.id || index}
                                className="group flex items-center hover:bg-slate-50 transition-colors"
                                style={{ padding: '1.125rem 1.25rem', gap: '1rem' }}
                            >
                                <div className="flex items-center justify-center bg-purple-700 text-white shrink-0" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem' }}>
                                    <div className="text-center">
                                        <span style={{ fontSize: '0.625rem', fontWeight: 700, display: 'block', opacity: 0.8 }}>{monthStr}</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>{dayStr}</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-400 uppercase" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                                        {formatFullDate(event.date)}
                                    </p>
                                    <p className="text-slate-900 truncate" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                                        {event.event_text}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500"
                                    style={{ padding: '0.375rem' }}
                                    title="Изтрий събитие"
                                >
                                    <span className="material-icons" style={{ fontSize: '1.25rem' }}>delete_outline</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 text-center" style={{ borderRadius: '1rem', padding: '3.5rem 2rem' }}>
                    <span className="material-icons text-slate-300" style={{ fontSize: '2.75rem', marginBottom: '0.75rem', display: 'block' }}>calendar_month</span>
                    <p className="text-slate-500" style={{ fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
                        {showAllEvents ? "Няма събития" : "Няма предстоящи събития"}
                    </p>
                    <button
                        onClick={onNavigateHome}
                        className="bg-purple-700 hover:bg-purple-800 text-white inline-flex items-center transition-colors"
                        style={{ gap: '0.375rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}
                    >
                        <span className="material-icons" style={{ fontSize: '1.125rem' }}>add</span>
                        Добави събитие
                    </button>
                </div>
            )}
        </section>
    );
}
