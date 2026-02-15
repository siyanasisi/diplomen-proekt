import type { CalendarEvent } from "../../hooks/useProfile";

interface ProfileRecentActivityProps {
    events: CalendarEvent[];
    formatDate: (dateStr: string) => string;
}

export function ProfileRecentActivity({ events, formatDate }: ProfileRecentActivityProps) {
    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-purple-900/5 border border-slate-200/60 p-8 hover:shadow-2xl hover:shadow-purple-900/10 transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-purple-50/10 pointer-events-none" />
            <div className="relative">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Последна активност</h3>

                {events.length > 0 ? (
                    <div className="space-y-4">
                        {events.map((event, index) => (
                            <div
                                key={index}
                                className="group bg-gradient-to-br from-slate-50/60 to-white backdrop-blur-sm hover:from-slate-100/60 hover:to-slate-50/30 border border-slate-200/60 rounded-2xl p-5 transition-all duration-500 cursor-pointer hover:shadow-xl hover:border-slate-300/80 hover:-translate-y-1 hover:scale-[1.02]"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-xl bg-gradient-to-br from-slate-500 via-slate-600 to-slate-500 group-hover:scale-110 transition-transform duration-500">
                                        <span className="uppercase leading-tight text-[10px]">
                                            {formatDate(event.date).split(" ")[1]}
                                        </span>
                                        <span className="text-lg font-black leading-none mt-0.5">
                                            {formatDate(event.date).split(" ")[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                                            {formatDate(event.date)}
                                        </p>
                                        <p className="text-base font-semibold text-slate-900 break-words leading-relaxed">
                                            {event.event_text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200/60 shadow-lg">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <p className="text-sm font-normal text-slate-500">Все още няма активност</p>
                    </div>
                )}
            </div>
        </div>
    );
}
