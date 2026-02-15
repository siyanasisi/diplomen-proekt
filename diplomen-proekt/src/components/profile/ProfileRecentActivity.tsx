import type { CalendarEvent } from "../../hooks/useProfile";

interface ProfileRecentActivityProps {
    events: CalendarEvent[];
    formatDate: (dateStr: string) => string;
}

export function ProfileRecentActivity({ events, formatDate }: ProfileRecentActivityProps) {
    return (
        <section>
            <h3 className="text-xl font-bold mb-4 text-slate-800">Последна активност</h3>

            {events.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {events.map((event, index) => (
                        <div key={index} className="relative">
                            <div className="absolute -left-[23px] top-1 w-6 h-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10">
                                <div className="w-2 h-2 bg-slate-400 rounded-full" />
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {formatDate(event.date)}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {event.event_text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <span className="material-icons text-slate-400 text-2xl">history</span>
                    </div>
                    <p className="text-sm text-slate-500">Все още няма активност</p>
                </div>
            )}
        </section>
    );
}
