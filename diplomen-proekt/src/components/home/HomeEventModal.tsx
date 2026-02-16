import type { StudyPlan } from "../../lib/topics";

interface HomeEventModalProps {
    selectedDay: string;
    eventText: string;
    setEventText: (v: string) => void;
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
    eventText,
    setEventText,
    eventsForDate,
    studyPlan,
    role,
    onClose,
    onSave,
    onDelete,
    onMarkCompleted,
    onMarkMissed,
}: HomeEventModalProps) {
    const studyDay = studyPlan?.plan.find((d) => d.date === selectedDay);
    const hasStudyTopics = studyDay && studyDay.topics.length > 0;
    const hasEvent = eventsForDate(selectedDay).length > 0;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-300 border border-purple-900/20 my-8">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {hasEvent ? "Редактирай събитие" : hasStudyTopics ? "Учебни теми" : "Ново събитие"}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all duration-300 hover:scale-110">
                            <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-500 bg-gradient-to-r from-slate-50 to-purple-900/10 px-4 py-2.5 rounded-xl border border-purple-900/20">
                        <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold text-slate-700">{selectedDay}</span>
                    </div>
                </div>

                {/* study plan topics */}
                {hasStudyTopics && studyDay && (
                    <div className="mb-6 space-y-4">
                        <div className="space-y-3">
                            {studyDay.topics.map((topic, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl border-2 ${topic.subject === "Български език" ? "border-purple-200 bg-purple-50" : "border-amber-200 bg-amber-50"}`}
                                >
                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${topic.subject === "Български език" ? "bg-purple-200 text-purple-700" : "bg-amber-200 text-amber-700"}`}>
                                        {topic.subject}
                                    </span>
                                    <h4 className="mt-2 font-semibold text-slate-900">{topic.name}</h4>
                                    <p className="text-sm text-slate-600 mt-1">Включва учене и преговор</p>
                                </div>
                            ))}
                        </div>
                        {role === "student" && (
                            <div className="flex gap-3 pt-2 border-t border-slate-200">
                                {!studyDay.missed && (
                                    <button
                                        onClick={() => {
                                            onMarkMissed(selectedDay);
                                            onClose();
                                        }}
                                        className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm"
                                    >
                                        Маркирай като пропуснат
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        onMarkCompleted(selectedDay);
                                        onClose();
                                    }}
                                    className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-colors text-sm ${studyDay.completed ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
                                >
                                    {studyDay.completed ? "Маркирай като незавършен" : "Завърши деня"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* event textarea */}
                {(hasEvent || !hasStudyTopics) && (
                    <>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {hasEvent ? "Събитие" : "Добави събитие"}
                        </label>
                        <textarea
                            value={eventText}
                            onChange={(e) => setEventText(e.target.value)}
                            placeholder="Напр: Учене за матура, Преговор на материал..."
                            className="w-full border-2 border-slate-200 focus:border-purple-900 rounded-2xl px-5 py-4 mb-6 h-36 text-base focus:ring-4 focus:ring-purple-900/10 outline-none resize-none font-medium text-slate-700 placeholder-slate-400"
                            autoFocus={!hasStudyTopics}
                        />
                    </>
                )}

                <div className="flex items-center justify-between gap-3">
                    {hasEvent && (
                        <button
                            onClick={onDelete}
                            className="px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Изтрий събитие
                        </button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
                        >
                            Затвори
                        </button>
                        {(hasEvent || eventText.trim()) && (
                            <button
                                onClick={onSave}
                                className="px-6 py-3 text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white rounded-xl shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Запази
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
