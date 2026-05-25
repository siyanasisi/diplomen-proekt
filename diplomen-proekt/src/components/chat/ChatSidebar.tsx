// search, avatars, last message, unread count

import { AvatarImage } from "../AvatarImage";
import type { Conversation } from "../../types/chat";
import { getDisplayName, formatDateShort, isConversationUserOnline } from "../../types/chat";

interface ChatSidebarProps {
    conversations: Conversation[];
    selectedConv: Conversation | null;
    setSelectedConv: (c: Conversation | null) => void;
    loadingConversations: boolean;
    conversationSearch: string;
    setConversationSearch: (s: string) => void;
    filteredConversations: Conversation[];
    isStudent: boolean;
}

export function ChatSidebar({
    conversations,
    selectedConv,
    setSelectedConv,
    loadingConversations,
    conversationSearch,
    setConversationSearch,
    filteredConversations,
    isStudent,
}: ChatSidebarProps) {
    return (
        <aside
            className={`chat-sidebar-aside w-full md:w-[360px] lg:w-[400px] xl:w-[420px] h-full min-h-0 max-h-[100dvh] flex flex-col shrink-0 ${selectedConv ? "hidden md:flex" : "flex"}`}
            aria-label="Списък със съобщения"
        >
            <div className="chat-sidebar-top shrink-0 flex flex-col z-10">
                <div className="safe-area-sidebar" style={{ padding: '1.25rem 1.25rem 1rem' }}>
                    <div className="flex items-center" style={{ gap: '0.75rem' }}>
                        <div className="flex items-center justify-center bg-purple-50 text-purple-700" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem' }}>
                            <span className="material-icons" style={{ fontSize: '1.25rem' }}>chat</span>
                        </div>
                        <div>
                            <h1 className="text-slate-900" style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Съобщения</h1>
                            <p className="text-slate-500" style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '0.125rem' }}>
                                {conversations.length === 0
                                    ? "Все още нямате чатове"
                                    : `${conversations.length} ${conversations.length === 1 ? "чат" : "чата"}`}
                            </p>
                        </div>
                    </div>
                </div>
                {conversations.length > 0 && (
                    <div className="px-3 sm:px-4 pb-4 sm:pb-5 pt-1 sm:pt-2">
                        <div className="chat-sidebar-search-wrap">
                            <span className="chat-sidebar-search-icon" aria-hidden>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="search"
                                value={conversationSearch}
                                onChange={(e) => setConversationSearch(e.target.value)}
                                placeholder="Търси по име или съобщение..."
                                className="chat-sidebar-search w-full rounded-lg text-slate-800 text-[14px] sm:text-[15px] placeholder:text-slate-400 focus:outline-none"
                                aria-label="Търси разговори"
                                autoComplete="off"
                            />
                            {conversationSearch ? (
                                <button
                                    type="button"
                                    onClick={() => setConversationSearch("")}
                                    className="chat-sidebar-search-clear"
                                    aria-label="Изчисти търсенето"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden chat-sidebar-scroll overscroll-contain">
                {loadingConversations ? (
                    <div className="py-2 px-2 sm:px-3 mt-3 sm:mt-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 rounded-xl mx-0.5 sm:mx-1 mb-1.5 sm:mb-2">
                                <div className="chat-skeleton-avatar w-11 h-11 sm:w-12 sm:h-12 rounded-full shrink-0" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="chat-skeleton-line h-3.5 w-2/3 rounded-md" />
                                    <div className="chat-skeleton-line h-3 w-1/2 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center chat-sidebar-empty" style={{ padding: '2rem 1.25rem', minHeight: '11rem' }}>
                        <div style={{ maxWidth: '13rem' }}>
                            <div className="flex items-center justify-center bg-slate-100 text-slate-400 mx-auto" style={{ width: '3rem', height: '3rem', borderRadius: '0.625rem', marginBottom: '0.75rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.25rem' }}>chat_bubble_outline</span>
                            </div>
                            <p className="text-slate-700" style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Все още няма разговори</p>
                            <p className="text-slate-400" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                                {isStudent ? "Започнете разговор от профил на учител." : "Учениците ще могат да ви пишат от вашия профил."}
                            </p>
                        </div>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="px-4 sm:px-6 py-8 text-center">
                        <p className="text-[12px] sm:text-[13px] text-slate-500">Няма намерени разговори</p>
                        <button
                            type="button"
                            onClick={() => setConversationSearch("")}
                            className="mt-2 text-[13px] font-medium text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            Изчисти търсенето
                        </button>
                    </div>
                ) : (
                    <div className="py-2 px-2 sm:px-3 mt-3 sm:mt-4 pb-3 sm:pb-4">
                        {filteredConversations.map((conv) => {
                            const isActive = selectedConv?.otherUserId === conv.otherUserId;
                            const hasUnread = conv.unreadCount > 0;
                            const isOnline = isConversationUserOnline(conv);
                            return (
                                <button
                                    key={conv.otherUserId}
                                    onClick={() => setSelectedConv(conv)}
                                    className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-3 sm:gap-4 text-left chat-conv-item rounded-xl mx-0.5 sm:mx-1 min-h-[72px] sm:min-h-0 touch-manipulation ${isActive ? "chat-conv-item-active" : ""}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <AvatarImage
                                            url={conv.otherUserAvatarUrl}
                                            fallback={
                                                <div className="chat-avatar w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-[14px] sm:text-[15px] font-semibold">
                                                    {getDisplayName(conv).charAt(0).toUpperCase()}
                                                </div>
                                            }
                                            imgClassName="chat-avatar w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover"
                                        />
                                        <span
                                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`}
                                            title={isOnline ? "Онлайн" : "Офлайн"}
                                            aria-hidden
                                        />
                                        {hasUnread && conv.unreadCount === 1 && (
                                            <span className="chat-unread-dot absolute top-0 right-0 w-2.5 h-2.5 rounded-full" title="1 непрочетено" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
                                            <span className={`text-[14px] sm:text-[15px] truncate font-semibold ${hasUnread ? "text-slate-900" : "text-slate-800"}`}>
                                                {getDisplayName(conv)}
                                            </span>
                                            <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 min-w-[2.25rem] sm:min-w-[2.5rem] text-right" title={conv.lastTime}>
                                                {formatDateShort(conv.lastTime)}
                                            </span>
                                        </div>
                                        <p className={`text-[11px] sm:text-[12px] truncate mt-0.5 block ${hasUnread ? "text-slate-500 font-medium" : "text-slate-400"}`}>
                                            {conv.lastMessage || "Няма съобщения"}
                                        </p>
                                    </div>
                                    {hasUnread && conv.unreadCount > 1 && (
                                        <span className="chat-unread-badge shrink-0 min-w-[20px] sm:min-w-[22px] h-5 sm:h-6 px-1.5 sm:px-2 rounded-full text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
                                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}
