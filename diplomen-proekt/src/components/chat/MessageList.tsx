// loading/error states, date groups, bubbles, edit/delete menu, scroll-to-bottom FAB

import { useMemo } from "react";
import { AvatarImage } from "../AvatarImage";
import type { Message, Conversation, ChatRole } from "../../types/chat";
import {
    isFromMe,
    getReadAtForMyMessage,
    getDisplayName,
    groupMessagesByDate,
    groupMessagesBySender,
    formatDateLabel,
    formatTime,
    formatFullDate,
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
}

function MessageStatus({ message, role }: { message: Message; role: ChatRole }) {
    if (!isFromMe(message, role)) return null;
    const readStatus = getReadAtForMyMessage(message, role);
    const seen = !!(readStatus && typeof readStatus === "string" && readStatus.length > 0);
    const label = seen ? "Прочетено" : "Изпратено";
    return (
        <span
            className="ml-1 inline-flex items-center gap-0.5 shrink-0 opacity-90"
            key={`status-${message.id}-${seen ? "read" : "sent"}`}
            title={label}
            aria-label={label}
        >
            {seen ? (
                <span className="inline-flex items-center gap-0.5 text-inherit" aria-hidden>
                    <svg className="shrink-0 w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <svg className="shrink-0 w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </span>
            ) : (
                <span className="text-inherit" aria-hidden>
                    <svg className="shrink-0 w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </span>
            )}
        </span>
    );
}

export function MessageList(props: MessageListProps) {
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
    } = props;

    const r = role as ChatRole;
    const dateGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

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
                            {groupMessagesBySender(dateMessages, r).map((group, gIdx) => (
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
                                            const readKey = getReadAtForMyMessage(msg, r);
                                            const isEditing = editingMessageId === msg.id;
                                            const isDeleted = !!msg.deleted_at;
                                            return (
                                                <div
                                                    key={`${msg.id}-${readKey || "unread"}`}
                                                    className={`flex items-end gap-1.5 ${group.isMine ? "justify-end" : "justify-start"} ${mIdx > 0 ? "mt-2.5" : ""} group/row`}
                                                >
                                                    {group.isMine && !isDeleted && !isEditing && !msg.optimistic && !msg.sendFailed && (
                                                        <div className="opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0 flex items-center pb-1 relative" ref={messageMenuOpenId === msg.id ? messageMenuRef : undefined}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setMessageMenuOpenId(messageMenuOpenId === msg.id ? null : msg.id)}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 touch-manipulation"
                                                                aria-label="Действия със съобщението"
                                                            >
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                                            </button>
                                                            {messageMenuOpenId === msg.id && (
                                                                <div className="absolute right-full top-0 mr-1 py-1 min-w-[150px] bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                                                                    <button type="button" onClick={() => handleEditStart(msg)} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 rounded-t-lg flex items-center gap-2">
                                                                        <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                        Редактирай
                                                                    </button>
                                                                    <button type="button" onClick={() => { setMessageMenuOpenId(null); setDeleteMessageConfirm(msg); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2">
                                                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                        Изтрий
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className={`shrink-0 max-w-full px-5 py-4 text-[17px] leading-[1.5] relative ${group.isMine ? "chat-bubble-mine" : "chat-bubble-other"} ${msg.optimistic ? "opacity-80" : ""}`}>
                                                        {isDeleted ? (
                                                            <p className="text-[15px] italic opacity-80">Съобщението е изтрито</p>
                                                        ) : isEditing ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={editingDraft}
                                                                    onChange={(e) => setEditingDraft(e.target.value)}
                                                                    className="w-full min-h-[80px] px-3 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 resize-none text-[16px] focus:outline-none focus:ring-2 focus:ring-white/50"
                                                                    placeholder="Текст на съобщението"
                                                                    autoFocus
                                                                />
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button type="button" onClick={handleEditCancel} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/20">Отказ</button>
                                                                    <button type="button" onClick={handleEditSave} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/30 hover:bg-white/40 text-white">Запази</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {msg.message ? <p className="whitespace-pre-wrap break-words">{msg.message}</p> : null}
                                                                {msg.attachment_url && (
                                                                    <div className="mt-2 rounded-lg overflow-hidden max-w-[280px]">
                                                                        {/\.(jpe?g|png|gif|webp)(\?|$)/i.test(msg.attachment_url) ? (
                                                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block rounded-lg ring-1 ring-white/20 overflow-hidden">
                                                                                <img src={msg.attachment_url} alt="Прикачена снимка" className="max-h-[240px] w-auto object-contain rounded-lg" />
                                                                            </a>
                                                                        ) : (
                                                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors max-w-full ${group.isMine ? "bg-white/20 text-white hover:bg-white/30 ring-1 ring-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-200/80"}`}>
                                                                                <svg className="w-4 h-4 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                                <span className="truncate">Отвори прикачен файл</span>
                                                                                <svg className="w-3.5 h-3.5 shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                        {isLast && !isEditing && (
                                                            <div className={`mt-2.5 flex items-center justify-end gap-2 min-h-[22px] ${group.isMine ? "text-white/90" : "text-slate-400"}`}>
                                                                {msg.optimistic ? (
                                                                    <span className="text-[12px] opacity-90 inline-flex items-center gap-1">
                                                                        <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden>
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                        </svg>
                                                                        Изпраща се...
                                                                    </span>
                                                                ) : msg.sendFailed ? (
                                                                    <span className="inline-flex items-center gap-2 flex-wrap justify-end">
                                                                        <span className="text-[12px] opacity-90">Неуспешно изпращане</span>
                                                                        <button type="button" onClick={() => handleRetrySend(msg)} className="text-[12px] font-medium underline underline-offset-1 hover:no-underline opacity-95">Опитай отново</button>
                                                                    </span>
                                                                ) : (
                                                                    <>
                                                                        {msg.is_edited && <span className="text-[11px] opacity-75">редактирано</span>}
                                                                        <span className="text-[13px] font-medium tabular-nums" title={formatFullDate(msg.created_at)}>{formatTime(msg.created_at)}</span>
                                                                        {group.isMine && !isDeleted && <MessageStatus message={msg} role={r} />}
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
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
                                                        {(user?.user_metadata as { first_name?: string } | undefined)?.first_name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? "?"}
                                                    </div>
                                                }
                                                imgClassName="w-9 h-9 rounded-full object-cover ring-2 ring-white/30"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
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
