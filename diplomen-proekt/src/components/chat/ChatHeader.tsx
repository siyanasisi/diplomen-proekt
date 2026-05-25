import { AvatarImage } from "../AvatarImage";
import type { Conversation } from "../../types/chat";
import { getDisplayName, isConversationUserOnline, formatLastSeen } from "../../types/chat";

interface ChatHeaderProps {
    selectedConv: Conversation;
    setSelectedConv: (c: Conversation | null) => void;
    chatHeaderMoreOpen: boolean;
    setChatHeaderMoreOpen: (v: boolean) => void;
    chatHeaderInfoOpen: boolean;
    setChatHeaderInfoOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
    chatHeaderMoreRef: React.RefObject<HTMLDivElement | null>;
    isStudent: boolean;
    onNavigateToProfile: (userId: string) => void;
    onOpenBlock: () => void;
    onOpenDeleteChat: () => void;
}

export function ChatHeader({
    selectedConv,
    setSelectedConv,
    chatHeaderMoreOpen,
    setChatHeaderMoreOpen,
    chatHeaderInfoOpen,
    setChatHeaderInfoOpen,
    chatHeaderMoreRef,
    isStudent,
    onNavigateToProfile,
    onOpenBlock,
    onOpenDeleteChat,
}: ChatHeaderProps) {
    const isOnline = isConversationUserOnline(selectedConv);
    const statusLabel = isOnline ? "Онлайн" : `Последна активност: ${formatLastSeen(selectedConv.otherUserLastSeenAt ?? null)}`;
    return (
        <header className="chat-header-bar flex-none flex items-center min-h-[64px]" style={{ padding: '0.875rem 1.5rem', gap: '0.875rem' }}>
            <button
                type="button"
                onClick={() => setSelectedConv(null)}
                className="md:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Назад към списъка"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div className="chat-header-avatar-wrap relative flex-shrink-0 rounded-full" style={{ width: '2.75rem', height: '2.75rem' }}>
                <AvatarImage
                    url={selectedConv.otherUserAvatarUrl}
                    fallback={
                        <div className="chat-header-avatar rounded-full flex items-center justify-center text-white font-semibold bg-slate-400" style={{ width: '2.75rem', height: '2.75rem', fontSize: '0.875rem' }}>
                            {getDisplayName(selectedConv).charAt(0).toUpperCase()}
                        </div>
                    }
                    imgClassName="chat-header-avatar w-11 h-11 rounded-full object-cover"
                />
                <span
                    className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`}
                    style={{ width: '0.625rem', height: '0.625rem' }}
                    title={statusLabel}
                    aria-hidden
                />
            </div>
            <div className="flex-1 min-w-0" style={{ marginLeft: '0.25rem' }}>
                <h2 className="text-slate-900 truncate" style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {getDisplayName(selectedConv)}
                </h2>
                <p className="text-slate-500 truncate" style={{ fontSize: '0.8125rem', marginTop: '0.125rem' }} title={statusLabel}>
                    {statusLabel}
                </p>
            </div>
            <div className="flex items-center shrink-0" style={{ gap: '0.5rem', marginRight: '0.5rem' }}>
                <button
                    type="button"
                    onClick={() => { setChatHeaderMoreOpen(false); setChatHeaderInfoOpen((v) => !v); }}
                    className={`chat-header-btn p-3.5 rounded-xl text-slate-500 ${chatHeaderInfoOpen ? "bg-slate-100 text-slate-700" : ""}`}
                    aria-label="Информация"
                    title="Информация за разговора"
                    aria-expanded={chatHeaderInfoOpen}
                >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <div className="relative" ref={chatHeaderMoreRef}>
                    <button
                        type="button"
                        onClick={() => setChatHeaderMoreOpen(!chatHeaderMoreOpen)}
                        className="chat-header-btn p-3.5 rounded-xl text-slate-500"
                        aria-label="Още"
                        aria-expanded={chatHeaderMoreOpen}
                    >
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </button>
                    {chatHeaderMoreOpen && (
                        <div className="chat-header-more-dropdown absolute right-0 top-full mt-2 py-2 min-w-[200px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                            {isStudent && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateToProfile(selectedConv.otherUserId)}
                                    className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                >
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </span>
                                    Виж профил
                                </button>
                            )}
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                type="button"
                                onClick={onOpenBlock}
                                className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                </span>
                                Блокирай
                            </button>
                            <button
                                type="button"
                                onClick={onOpenDeleteChat}
                                className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </span>
                                Изтрий чат
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
