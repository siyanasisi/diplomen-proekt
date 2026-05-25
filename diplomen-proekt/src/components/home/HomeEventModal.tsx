import type { StudyPlan } from "../../lib/topics";

interface HomeEventModalProps {
    selectedDay: string;
    selectedEventId: string | null;
    eventText: string;
    setEventText: (v: string) => void;
    onSelectEvent: (eventId: string | null, text: string) => void;
    eventsForDate: (dateKey: string) => { id: string; event_text: string }[];
    studyPlan: StudyPlan | null;
    role: string | null;
    onClose: () => void;
    onSave: () => void;
    onDelete: () => void;
    onMarkCompleted: (date: string) => void;
    onMarkMissed: (date: string) => void;
}

export function HomeEventModal({
    selectedDay,
    selectedEventId,
    eventText,
    setEventText,
    onSelectEvent,
    eventsForDate,
    studyPlan,
    role,
    onClose,
    onSave,
    onDelete,
    onMarkCompleted,
    onMarkMissed,
}: HomeEventModalProps) {
    const dayEvents = eventsForDate(selectedDay);
    const studyDay = studyPlan?.plan.find((d) => d.date === selectedDay);
    const hasStudyTopics = studyDay && studyDay.topics.length > 0;
    const hasEvent = dayEvents.length > 0;
    const selectedIndex = dayEvents.findIndex((ev) => ev.id === selectedEventId);
    const canGoPrev = selectedIndex > 0;
    const canGoNext = selectedIndex >= 0 && selectedIndex < dayEvents.length - 1;

    const handlePrevEvent = () => {
        if (!canGoPrev) return;
        const prevEvent = dayEvents[selectedIndex - 1];
        if (!prevEvent) return;
        onSelectEvent(prevEvent.id, prevEvent.event_text);
    };

    const handleNextEvent = () => {
        if (!canGoNext) return;
        const nextEvent = dayEvents[selectedIndex + 1];
        if (!nextEvent) return;
        onSelectEvent(nextEvent.id, nextEvent.event_text);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" style={{ padding: '1.5rem' }}>
            <div className="bg-white w-full shadow-xl" style={{ maxWidth: '36rem', borderRadius: '1rem', padding: '2rem', margin: '2rem 0' }}>
                {/* header */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                        <h3 className="text-slate-900" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                            {hasEvent ? "Редактирай събитие" : hasStudyTopics ? "Учебни теми" : "Ново събитие"}
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all" style={{ padding: '0.375rem', borderRadius: '0.5rem' }}>
                            <span className="material-icons" style={{ fontSize: '1.25rem' }}>close</span>
                        </button>
                    </div>
                    <div className="flex items-center bg-slate-50 border border-slate-100" style={{ gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                        <span className="material-icons text-purple-700" style={{ fontSize: '1rem' }}>calendar_today</span>
                        <span className="text-slate-700" style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedDay}</span>
                    </div>
                </div>

                {/* study plan topics */}
                {hasStudyTopics && studyDay && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="flex flex-col" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                            {studyDay.topics.map((topic, idx) => (
                                <div
                                    key={idx}
                                    className={`border ${topic.subject === "Български език" ? "border-purple-200 bg-purple-50" : "border-amber-200 bg-amber-50"}`}
                                    style={{ borderRadius: '0.75rem', padding: '1rem' }}
                                >
                                    <span
                                        className={topic.subject === "Български език" ? "bg-purple-200 text-purple-700" : "bg-amber-200 text-amber-700"}
                                        style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '0.25rem', display: 'inline-block' }}
                                    >
                                        {topic.subject}
                                    </span>
                                    <h4 className="text-slate-900" style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.5rem' }}>{topic.name}</h4>
                                    <p className="text-slate-500" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Включва учене и преговор</p>
                                </div>
                            ))}
                        </div>
                        {role === "student" && (
                            <div className="flex border-t border-slate-100" style={{ gap: '0.625rem', paddingTop: '1rem' }}>
                                {!studyDay.missed && (
                                    <button
                                        onClick={() => { onMarkMissed(selectedDay); onClose(); }}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white transition-colors"
                                        style={{ padding: '0.625rem', borderRadius: '0.625rem', fontSize: '0.8125rem', fontWeight: 600 }}
                                    >
                                        Маркирай като пропуснат
                                    </button>
                                )}
                                <button
                                    onClick={() => { onMarkCompleted(selectedDay); onClose(); }}
                                    className={`flex-1 transition-colors ${studyDay.completed ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
                                    style={{ padding: '0.625rem', borderRadius: '0.625rem', fontSize: '0.8125rem', fontWeight: 600 }}
                                >
                                    {studyDay.completed ? "Маркирай като незавършен" : "Завърши деня"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* event textarea */}
                <div>
                    {dayEvents.length > 1 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: '0.375rem', gap: '0.5rem' }}>
                                <p className="text-slate-500" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    Събития за деня
                                </p>
                                {selectedIndex >= 0 && (
                                    <div className="flex items-center" style={{ gap: '0.375rem' }}>
                                        <button
                                            type="button"
                                            onClick={handlePrevEvent}
                                            disabled={!canGoPrev}
                                            className="text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            style={{ borderRadius: '0.375rem', padding: '0.125rem' }}
                                            aria-label="Предишно събитие"
                                        >
                                            <span className="material-icons" style={{ fontSize: '1rem' }}>chevron_left</span>
                                        </button>
                                        <span className="text-slate-500" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                            Събитие {selectedIndex + 1} от {dayEvents.length}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleNextEvent}
                                            disabled={!canGoNext}
                                            className="text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            style={{ borderRadius: '0.375rem', padding: '0.125rem' }}
                                            aria-label="Следващо събитие"
                                        >
                                            <span className="material-icons" style={{ fontSize: '1rem' }}>chevron_right</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap" style={{ gap: '0.375rem' }}>
                                {dayEvents.map((ev, idx) => (
                                    <button
                                        key={ev.id}
                                        type="button"
                                        onClick={() => onSelectEvent(ev.id, ev.event_text)}
                                        className={`transition-colors ${
                                            selectedEventId === ev.id
                                                ? "bg-purple-700 text-white"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                        style={{ padding: '0.3125rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}
                                    >
                                        Събитие {idx + 1}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => onSelectEvent(null, "")}
                                    className={`transition-colors ${
                                        selectedEventId == null
                                            ? "bg-purple-700 text-white"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                    style={{ padding: '0.3125rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                    + Ново
                                </button>
                            </div>
                        </div>
                    )}
                    <label className="text-slate-700" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                        {selectedEventId ? "Събитие" : "Добави събитие"}
                    </label>
                    <textarea
                        value={eventText}
                        onChange={(e) => setEventText(e.target.value)}
                        placeholder="Напр: Учене за матура, Преговор на материал..."
                        className="w-full border border-slate-200 focus:border-purple-500 text-slate-700 placeholder-slate-400 outline-none resize-none"
                        style={{ borderRadius: '0.625rem', padding: '0.875rem', marginBottom: '1.5rem', height: '8rem', fontSize: '0.875rem', fontWeight: 500 }}
                        autoFocus={!hasStudyTopics}
                    />
                </div>

                {/* actions */}
                <div className="flex items-center justify-between" style={{ gap: '0.75rem' }}>
                    {hasEvent && (
                        <button
                            onClick={onDelete}
                            className="text-red-600 hover:bg-red-50 flex items-center transition-colors"
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, gap: '0.375rem' }}
                        >
                            <span className="material-icons" style={{ fontSize: '1rem' }}>delete</span>
                            Изтрий
                        </button>
                    )}
                    <div className="flex ml-auto" style={{ gap: '0.5rem' }}>
                        <button
                            onClick={onClose}
                            className="text-slate-600 hover:bg-slate-50 transition-colors"
                            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
                        >
                            Затвори
                        </button>
                        <button
                            onClick={onSave}
                            disabled={!eventText.trim() && !hasEvent}
                            className="bg-purple-700 hover:bg-purple-800 text-white flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, gap: '0.375rem' }}
                        >
                            <span className="material-icons" style={{ fontSize: '1rem' }}>check</span>
                            Запази
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
