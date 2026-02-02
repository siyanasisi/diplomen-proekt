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
                <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 safe-area-sidebar">
                    <h1 className="text-[20px] sm:text-[22px] font-semibold text-slate-900 tracking-tight">
                        Съобщения
                    </h1>
                    <p className="text-[12px] sm:text-[13px] text-slate-400 mt-1.5">
                        {conversations.length === 0
                            ? "Все още нямате чатове"
                            : `${conversations.length} ${conversations.length === 1 ? "чат" : "чата"}`}
                    </p>
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
                    <div className="h-full flex items-center justify-center px-4 sm:px-5 text-center min-h-[180px] py-6 chat-sidebar-empty">
                        <div className="max-w-[200px]">
                            <div className="chat-empty-icon-wrap w-11 h-11 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-[13px] font-medium text-slate-600 mb-0.5">Все още няма разговори</p>
                            <p className="text-[12px] text-slate-400 leading-relaxed">
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
