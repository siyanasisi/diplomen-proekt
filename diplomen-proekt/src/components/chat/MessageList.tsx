import { useMemo } from "react";
import { AvatarImage } from "../AvatarImage";
import { useToast } from "../../context/ToastContext";
import { MessageBubble } from "./MessageBubble";
import type { Message, Conversation, ChatRole, MessageReaction } from "../../types/chat";
import {
    getDisplayName,
    groupMessagesByDate,
    groupMessagesBySender,
    formatDateLabel,
} from "../../types/chat";

interface MessageListProps {
    messages: Message[];
    loadingMessages: boolean;
    messagesLoadError: boolean;
    loadingOlderMessages: boolean;
    olderMessagesLoadError: boolean;
    hasMoreOlderMessages: boolean;
    selectedConv: Conversation | null;
    role: string | null;
    user: { email?: string; user_metadata?: Record<string, unknown> } | null;
    currentUserAvatarUrl: string | null;
    messagesContainerRef: React.RefObject<HTMLDivElement | null>;
    loadMessages: (conv: Conversation) => void;
    loadOlderMessages: () => void;
    editingMessageId: string | null;
    editingDraft: string;
    setEditingDraft: (s: string) => void;
    messageMenuOpenId: string | null;
    setMessageMenuOpenId: (id: string | null) => void;
    messageMenuRef: React.RefObject<HTMLDivElement | null>;
    handleEditStart: (msg: Message) => void;
    handleEditSave: () => void;
    handleEditCancel: () => void;
    setDeleteMessageConfirm: (m: Message | null) => void;
    handleRetrySend: (msg: Message) => void;
    showScrollFAB: boolean;
    handleScrollToBottomClick: () => void;
    setReplyingTo: (m: Message | null) => void;
    reactionsMap: Record<string, MessageReaction[]>;
    toggleReaction: (messageId: string, emoji: string) => Promise<boolean>;
}

export function MessageList(props: MessageListProps) {
    const showToast = useToast();
    const {
        messages,
        loadingMessages,
        messagesLoadError,
        loadingOlderMessages,
        olderMessagesLoadError,
        hasMoreOlderMessages,
        selectedConv,
        role,
        user,
        currentUserAvatarUrl,
        messagesContainerRef,
        loadMessages,
        loadOlderMessages,
        editingMessageId,
        editingDraft,
        setEditingDraft,
        messageMenuOpenId,
        setMessageMenuOpenId,
        messageMenuRef,
        handleEditStart,
        handleEditSave,
        handleEditCancel,
        setDeleteMessageConfirm,
        handleRetrySend,
        showScrollFAB,
        handleScrollToBottomClick,
        setReplyingTo,
        reactionsMap,
        toggleReaction,
    } = props;

    const r = role as ChatRole;
    const dateGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

    const renderOneGroup = (group: { isMine: boolean; messages: Message[] }, dateKey: string, gIdx: number) => (
        <div
            key={`${dateKey}-${gIdx}-${group.isMine}-${group.messages[0]?.id}`}
            className={`flex flex-row w-full items-end gap-3 ${group.isMine ? "justify-end" : "justify-start"} ${gIdx > 0 ? "mt-4" : ""}`}
        >
            {!group.isMine && selectedConv && (
                <div className="flex-shrink-0 w-8 h-8 mt-1">
                    <AvatarImage
                        url={selectedConv.otherUserAvatarUrl}
                        fallback={
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-medium bg-slate-400">
                                {getDisplayName(selectedConv).charAt(0).toUpperCase()}
                            </div>
                        }
                        imgClassName="w-8 h-8 rounded-full object-cover"
                    />
                </div>
            )}
            <div className={`space-y-0.5 max-w-[90%] sm:max-w-[85%] ${group.isMine ? "chat-bubbles-mine order-1" : ""}`}>
                {group.messages.map((msg, mIdx) => {
                    const isLast = mIdx === group.messages.length - 1;
                    return (
                        <div key={msg.id} className={mIdx > 0 ? "mt-2.5" : ""}>
                            <MessageBubble
                                message={msg}
                                allMessages={messages}
                                isMine={group.isMine}
                                isLast={isLast}
                                role={r}
                                isEditing={editingMessageId === msg.id}
                                editingDraft={editingDraft}
                                setEditingDraft={setEditingDraft}
                                onEditStart={() => handleEditStart(msg)}
                                onEditSave={handleEditSave}
                                onEditCancel={handleEditCancel}
                                onDeleteClick={() => { setMessageMenuOpenId(null); setDeleteMessageConfirm(msg); }}
                                onRetrySend={() => handleRetrySend(msg)}
                                onReplyClick={() => setReplyingTo(msg)}
                                reactions={reactionsMap[msg.id] ?? []}
                                toggleReaction={toggleReaction}
                                onCopyText={async () => {
                                    try {
                                        await navigator.clipboard.writeText(msg.message ?? "");
                                        showToast("Копирано");
                                        setMessageMenuOpenId(null);
                                    } catch {
                                        showToast("Копирането не успя.");
                                    }
                                }}
                                messageMenuOpenId={messageMenuOpenId}
                                setMessageMenuOpenId={setMessageMenuOpenId}
                                messageMenuRef={messageMenuRef}
                            />
                        </div>
                    );
                })}
            </div>
            {group.isMine && (
                <div className="flex-shrink-0 w-9 h-9 mt-1 order-2">
                    <AvatarImage
                        url={currentUserAvatarUrl}
                        fallback={
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-medium chat-avatar-mine">
                                {(user?.user_metadata as { first_name?: string } | undefined)?.first_name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                        }
                        imgClassName="w-9 h-9 rounded-full object-cover ring-2 ring-white/30"
                    />
                </div>
            )}
        </div>
    );

    if (loadingMessages) {
        return (
            <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden chat-messages-scroll px-4 py-4 relative basis-0">
                <div className="chat-message-column w-full min-h-full max-w-3xl ml-auto pr-0">
                    <div className="space-y-3 py-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[75%] rounded-2xl px-4 py-3 space-y-2">
                                    <div className="chat-skeleton-line h-3.5 w-full rounded-lg" />
                                    <div className="chat-skeleton-line h-3.5 w-4/5 rounded-lg" />
                                    <div className="chat-skeleton-line h-3 w-12 rounded-lg ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (messagesLoadError) {
        return (
            <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden chat-messages-scroll px-4 py-4 relative basis-0">
                <div className="chat-message-column w-full min-h-full max-w-3xl ml-auto pr-0">
                    <div className="h-full min-h-[240px] flex items-center justify-center text-center px-4">
                        <div className="max-w-[280px]">
                            <div className="chat-empty-icon-wrap w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-red-50">
                                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-base font-semibold text-slate-800 mb-1">Съобщенията не можаха да се заредят</p>
                            <p className="text-[13px] text-slate-500 leading-relaxed mb-4">Моля, опитайте отново.</p>
                            {selectedConv && (
                                <button
                                    type="button"
                                    onClick={() => loadMessages(selectedConv)}
                                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                                >
                                    Опитай отново
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden chat-messages-scroll px-4 py-4 relative basis-0">
                <div className="chat-message-column w-full min-h-full max-w-3xl ml-auto pr-0">
                    <div className="h-full min-h-[240px] flex items-center justify-center text-center px-4">
                        <div className="max-w-[240px]">
                            <div className="chat-empty-icon-wrap w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                </svg>
                            </div>
                            <p className="text-base font-semibold text-slate-800 mb-1">Няма съобщения</p>
                            <p className="text-[13px] text-slate-500 leading-relaxed">Напишете първото си съобщение.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden chat-messages-scroll px-4 py-4 relative basis-0">
            <div className="chat-message-column w-full min-h-full max-w-3xl ml-auto pr-0">
                <div className="w-full space-y-0 pb-2">
                    {loadingOlderMessages && (
                        <div className="flex justify-center py-3">
                            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" aria-hidden />
                            <span className="sr-only">Зареждане на по-стари съобщения...</span>
                        </div>
                    )}
                    {olderMessagesLoadError && !loadingOlderMessages && (
                        <div className="flex flex-col items-center gap-2 py-3">
                            <p className="text-xs text-slate-500">По-старите съобщения не можаха да се заредят.</p>
                            <button type="button" onClick={loadOlderMessages} className="text-xs font-medium text-slate-700 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                                Опитай отново
                            </button>
                        </div>
                    )}
                    {hasMoreOlderMessages && !loadingOlderMessages && !olderMessagesLoadError && (
                        <p className="text-center text-xs text-slate-400 py-1">Дръпнете нагоре за по-стари съобщения</p>
                    )}
                    {Object.entries(dateGroups).map(([dateKey, dateMessages]) => (
                        <div key={dateKey} className="chat-date-group">
                            <div className="chat-date-separator gap-3">
                                <span className="chat-date-line" aria-hidden />
                                <span className="chat-date-pill shrink-0">{formatDateLabel(dateKey)}</span>
                                <span className="chat-date-line" aria-hidden />
                            </div>
                            {groupMessagesBySender(dateMessages, r).map((group, gIdx) => renderOneGroup(group, dateKey, gIdx))}
                        </div>
                    ))}
                </div>
            </div>
            {showScrollFAB && (
                <button
                    type="button"
                    onClick={handleScrollToBottomClick}
                    className="chat-scroll-fab absolute bottom-4 left-1/2 px-3 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5"
                    aria-label="Към новите съобщения"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Ново
                </button>
            )}
        </div>
    );
}
