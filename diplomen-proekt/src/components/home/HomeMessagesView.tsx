import { ensureValidSession, supabase } from "../../supabase-client";
import type { HomeState } from "./types";

type HomeMessagesViewProps = {
    home: HomeState;
};

export function HomeMessagesView({ home }: HomeMessagesViewProps) {
    const {
        user,
        role,
        activeMenu,
        messages,
        setMessages,
        loadingMessages,
        loadMessages,
    } = home;

    if (activeMenu !== "messages" || role !== "teacher") return null;

    return (
        <div className="space-y-8">
            <div className="mb-10">
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Съобщения</h2>
                <p className="text-base font-semibold text-slate-600">Прегледайте съобщенията от ученици</p>
            </div>
            <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl p-7 shadow-md border-2 border-purple-200/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-3xl"></div>
                <div className="flex items-center justify-between mb-6 relative">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                        Всички съобщения ({messages.length})
                    </h3>
                    <button
                        onClick={loadMessages}
                        disabled={loadingMessages}
                        className="px-4 py-2 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg
                            className={`w-4 h-4 ${loadingMessages ? "animate-spin" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Обнови
                    </button>
                </div>
                <div className="space-y-3 relative">
                    {loadingMessages ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 border-4 border-purple-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-sm font-semibold text-slate-700">Зареждане на съобщения...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-200/40">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-normal text-slate-500">Няма получени съобщения</p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const messageDate = new Date(message.created_at);
                            const isRead = message.read_at !== null;

                            const markAsRead = async () => {
                                if (isRead || !user) return;

                                try {
                                    await ensureValidSession();
                                    const { error } = await supabase
                                        .from("messages")
                                        .update({ read_at: new Date().toISOString() })
                                        .eq("id", message.id);

                                    if (!error) {
                                        setMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === message.id
                                                    ? { ...msg, read_at: new Date().toISOString() }
                                                    : msg
                                            )
                                        );
                                    }
                                } catch (error) {
                                    console.error("Error marking message as read:", error);
                                }
                            };

                            return (
                                <div
                                    key={message.id}
                                    onClick={markAsRead}
                                    className={`group bg-gradient-to-br ${isRead ? "from-slate-50/60 to-white" : "from-purple-50/80 to-white"} hover:from-purple-100/70 hover:to-white border-2 ${isRead ? "border-slate-200/60" : "border-purple-300/60"} rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-purple-400/70 relative overflow-hidden cursor-pointer`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-200/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center text-white text-lg font-bold shadow-md">
                                                {(message.student_name ?? "У").charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="text-base font-bold text-slate-900">
                                                        {message.student_name ?? "Ученик"}
                                                    </p>
                                                    {message.student_email && (
                                                        <p className="text-xs font-medium text-slate-500">
                                                            {message.student_email}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!isRead && (
                                                        <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
                                                    )}
                                                    <span className="text-xs font-medium text-slate-500">
                                                        {messageDate.toLocaleDateString("bg-BG", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                {message.message}
                                            </p>
                                            {!isRead && (
                                                <p className="text-xs font-semibold text-purple-600 mt-2">
                                                    Кликнете, за да маркирате като прочетено
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
