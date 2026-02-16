import type { CalendarEvent } from "../../hooks/useProfile";

interface ProfileRecentActivityProps {
    events: CalendarEvent[];
    formatDate: (dateStr: string) => string;
}

export function ProfileRecentActivity({ events, formatDate }: ProfileRecentActivityProps) {
    return (
        <section>
            <h3 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '1rem' }}>Последна активност</h3>

            {events.length > 0 ? (
                <div className="bg-white border border-slate-200 overflow-hidden divide-y divide-slate-100" style={{ borderRadius: '1rem' }}>
                    {events.map((event, index) => {
                        const [, monthStr, dayStr] = event.date.split("-");
                        return (
                            <div
                                key={index}
                                className="flex items-center"
                                style={{ padding: '1.125rem 1.25rem', gap: '1rem' }}
                            >
                                <div className="shrink-0 text-center bg-slate-50 border border-slate-100" style={{ width: '3.5rem', borderRadius: '0.625rem', padding: '0.5rem 0' }}>
                                    <p className="text-slate-900" style={{ fontSize: '1.125rem', fontWeight: 700 }}>{dayStr}</p>
                                    <p className="text-slate-500 uppercase" style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.04em' }}>{monthStr}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-400 uppercase" style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                                        {formatDate(event.date)}
                                    </p>
                                    <p className="text-slate-900 truncate" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                                        {event.event_text}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 text-center" style={{ borderRadius: '1rem', padding: '3rem' }}>
                    <span className="material-icons text-slate-300" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>history</span>
                    <p className="text-slate-500" style={{ fontSize: '0.9375rem' }}>Все още няма активност</p>
                </div>
            )}
        </section>
    );
}
