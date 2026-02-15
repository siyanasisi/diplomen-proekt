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
    formatDate,
    formatFullDate,
    onDeleteEvent,
}: ProfileEventsProps) {
    const title = role === "teacher" ? "Събития" : "Предстоящи събития";
    const emptyMessage = showAllEvents ? "Няма събития" : "Няма предстоящи събития";

    return (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-10 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                        {title}
                    </h3>
                    <div className="flex items-center gap-3">
                        {role === "teacher" && allEventsCount > 0 && (
                            <button
                                onClick={onToggleShowAll}
                                className="text-sm font-bold text-slate-700 hover:text-purple-900 transition-all px-5 py-2.5 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 border-2 border-slate-200/60 hover:border-purple-300/60 hover:shadow-lg hover:-translate-y-0.5"
                            >
                                {showAllEvents ? "Предстоящи" : "Всички"}
                            </button>
                        )}
                        <button
                            onClick={onNavigateHome}
                            className="text-sm font-bold text-slate-700 hover:text-purple-900 transition-all flex items-center gap-2.5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 px-5 py-2.5 rounded-2xl border-2 border-slate-200/60 hover:border-purple-300/60 hover:shadow-lg hover:-translate-y-0.5 group/btn"
                        >
                            {role === "teacher" ? "Добави" : "Виж всички"}
                            <svg
                                className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {events.length > 0 ? (
                    <div className="space-y-3">
                        {events.map((event, index) => (
                            <div
                                key={event.id || index}
                                className="group/event bg-gradient-to-br from-white via-purple-50/50 to-white backdrop-blur-sm hover:from-purple-100/70 hover:via-purple-50/40 hover:to-white border-2 border-purple-200/50 hover:border-purple-400/70 rounded-2xl p-6 transition-all duration-700 cursor-pointer hover:shadow-2xl hover:shadow-purple-900/25 hover:-translate-y-2 hover:scale-[1.03] relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-200/40 opacity-0 group-hover/event:opacity-100 transition-opacity duration-700" />
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-black shadow-2xl bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900 group-hover/event:scale-125 group-hover/event:rotate-3 transition-all duration-700">
                                        <span className="uppercase leading-tight text-[10px]">
                                            {formatDate(event.date).split(" ")[1]}
                                        </span>
                                        <span className="text-xl font-black leading-none mt-0.5">
                                            {formatDate(event.date).split(" ")[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <p className="text-xs font-black text-purple-600 mb-2 uppercase tracking-widest">
                                            {formatFullDate(event.date)}
                                        </p>
                                        <p className="text-lg font-bold text-slate-900 group-hover/event:text-purple-900 transition-colors duration-300 break-words leading-relaxed">
                                            {event.event_text}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteEvent(event.id);
                                        }}
                                        className="opacity-0 group-hover/event:opacity-100 transition-all duration-500 p-3 rounded-2xl hover:bg-red-50 text-red-600 hover:scale-125 hover:rotate-12 border-2 border-transparent hover:border-red-200/60 flex-shrink-0"
                                        title="Изтрий събитие"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-200/60">
                            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <p className="text-sm font-normal text-slate-500 mb-4">{emptyMessage}</p>
                        <button
                            onClick={onNavigateHome}
                            className="px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 ease-out flex items-center gap-2.5 text-base shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-900/40 hover:-translate-y-1 hover:scale-[1.02] bg-gradient-to-r from-purple-900 to-purple-800 text-white mx-auto"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Добави събитие
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
