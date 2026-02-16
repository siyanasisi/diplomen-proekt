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

function getDateDisplay(dateStr: string): string {
    const [, month, day] = dateStr.split("-");
    return `${day}.${month}`;
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
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <div className="flex items-center gap-3">
                    {isTeacher && allEventsCount > 0 && (
                        <button
                            onClick={onToggleShowAll}
                            className="text-xs font-bold text-purple-700 uppercase tracking-wider hover:underline"
                        >
                            {showAllEvents ? "Предстоящи" : "Всички"}
                        </button>
                    )}
                    {!isTeacher && (
                        <a
                            onClick={(e) => { e.preventDefault(); onNavigateHome(); }}
                            className="text-xs font-bold text-purple-700 uppercase tracking-wider hover:underline cursor-pointer"
                            href="#"
                        >
                            Виж всички
                        </a>
                    )}
                </div>
            </div>

            {events.length > 0 ? (
                <div className="space-y-3">
                    {events.map((event, index) => (
                        <div
                            key={event.id || index}
                            className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm group"
                        >
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center justify-center bg-purple-700 text-white w-16 h-16 rounded-2xl shrink-0">
                                    <span className="text-2xl font-black leading-tight">
                                        {getDateDisplay(event.date)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1">
                                        {formatFullDate(event.date)}
                                    </p>
                                    <p className="font-bold text-slate-800 text-sm leading-tight break-words">
                                        {event.event_text}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteEvent(event.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl hover:bg-red-50 text-red-500 flex-shrink-0 self-center"
                                    title="Изтрий събитие"
                                >
                                    <span className="material-icons text-lg">delete_outline</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <span className="material-icons text-slate-400 text-2xl">event_available</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        {showAllEvents ? "Няма събития" : "Няма предстоящи събития"}
                    </p>
                    <button
                        onClick={onNavigateHome}
                        className="px-5 py-2.5 bg-purple-700 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-purple-700/20 inline-flex items-center gap-2"
                    >
                        <span className="material-icons text-sm">add</span>
                        Добави събитие
                    </button>
                </div>
            )}
        </section>
    );
}
