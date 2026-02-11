import type { HomeState } from "./types";

type HomeEventsViewProps = {
    variant: "teacher" | "student";
    home: HomeState;
};

export function HomeEventsView({ variant, home }: HomeEventsViewProps) {
    const {
        activeMenu,
        getAllEvents,
        setActiveMenu,
        setSelectedDay,
        setSelectedEventId,
        setEventText,
    } = home;

    if (activeMenu !== "events") return null;

    return (
        <div className="space-y-8">
            <div className="mb-10">
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Събития</h2>
                <p className={variant === "teacher" ? "text-base font-semibold text-slate-600" : "text-base font-bold text-purple-700"}>
                    Прегледайте всички ваши събития
                </p>
            </div>
            <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                <div className="flex items-center justify-between mb-6 relative">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Всички събития</h3>
                </div>
                <div className="space-y-3">
                    {getAllEvents().length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-normal text-slate-500">Няма събития. Добавете ново събитие от календара.</p>
                        </div>
                    ) : (
                        getAllEvents().map(({ id, date, dateStr, event }) => (
                            <div
                                key={id}
                                className="group bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl p-4.5 transition-all duration-300 cursor-pointer hover:shadow-sm hover:border-slate-300/60"
                                onClick={() => {
                                    setActiveMenu("calendar");
                                    setSelectedDay(dateStr);
                                    setSelectedEventId(id);
                                    setEventText(event);
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-purple-600 mt-1" aria-hidden />
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-semibold shadow-sm bg-purple-900">
                                        <span className="uppercase leading-tight">
                                            {date.toLocaleDateString("bg-BG", { month: "short" })}
                                        </span>
                                        <span className="text-base font-bold leading-none mt-0.5">{date.getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                                            {date.toLocaleDateString("bg-BG", { weekday: "long" })}
                                        </p>
                                        <p className="text-base font-medium text-slate-900 line-clamp-1">
                                            {event}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
