import { memo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Message, ChatRole, MessageReaction } from "../../types/chat";
import { getReadAtForMyMessage, formatTime, formatFullDate, REACTION_EMOJIS } from "../../types/chat";
import { isFromMe } from "../../types/chat";

function linkifyText(text: string): React.ReactNode {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (part.startsWith("http://") || part.startsWith("https://")) {
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline break-all hover:opacity-90"
                >
                    {part}
                </a>
            );
        }
        return part;
    });
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

export interface MessageBubbleProps {
    message: Message;
    allMessages?: Message[];
    isMine: boolean;
    isLast: boolean;
    role: ChatRole;
    isEditing: boolean;
    editingDraft: string;
    setEditingDraft: (s: string) => void;
    onEditStart: () => void;
    onEditSave: () => void;
    onEditCancel: () => void;
    onDeleteClick: () => void;
    onRetrySend: () => void;
    onReplyClick?: () => void;
    onCopyText: () => void;
    reactions?: MessageReaction[];
    toggleReaction?: (messageId: string, emoji: string) => Promise<boolean>;
    messageMenuOpenId: string | null;
    setMessageMenuOpenId: (id: string | null) => void;
    messageMenuRef: React.RefObject<HTMLDivElement | null>;
}

function MessageBubbleInner({
    message,
    allMessages = [],
    isMine,
    isLast,
    role,
    isEditing,
    editingDraft,
    setEditingDraft,
    onEditStart,
    onEditSave,
    onEditCancel,
    onDeleteClick,
    onRetrySend,
    onReplyClick,
    onCopyText,
    reactions = [],
    toggleReaction,
    messageMenuOpenId,
    setMessageMenuOpenId,
    messageMenuRef,
}: MessageBubbleProps) {
    const [showReactions, setShowReactions] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const dotsBtnRef = useRef<HTMLButtonElement>(null);
    const isDeleted = !!message.deleted_at;
    const showMenu = !isDeleted && !isEditing && !message.optimistic && !message.sendFailed;
    const isMenuOpen = messageMenuOpenId === message.id;
    const replyToMsg = message.reply_to ?? (message.reply_to_id ? allMessages.find((m) => m.id === message.reply_to_id) : null);

    const handleDotsClick = () => {
        if (isMenuOpen) {
            setMessageMenuOpenId(null);
            setMenuPos(null);
        } else {
            const rect = dotsBtnRef.current?.getBoundingClientRect();
            if (rect) {
                setMenuPos({ top: rect.bottom + 4, left: isMine ? rect.right : rect.left });
            }
            setMessageMenuOpenId(message.id);
        }
    };

    const menuDropdown = isMenuOpen && menuPos ? createPortal(
        <div
            ref={messageMenuRef}
            className="py-1 min-w-[150px] bg-white rounded-lg shadow-lg border border-slate-200"
            style={{
                position: "fixed",
                top: menuPos.top,
                left: isMine ? undefined : menuPos.left,
                right: isMine ? (window.innerWidth - menuPos.left) : undefined,
                zIndex: 9999,
            }}
        >
            {onReplyClick && (
                <button
                    type="button"
                    onClick={() => { setMessageMenuOpenId(null); setMenuPos(null); onReplyClick(); }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 rounded-t-lg flex items-center gap-2"
                >
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Отговори
                </button>
            )}
            {isMine && (
                <button
                    type="button"
                    onClick={onEditStart}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                >
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактирай
                </button>
            )}
            <button
                type="button"
                onClick={() => { onCopyText(); setMenuPos(null); }}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Копирай текст
            </button>
            <button
                type="button"
                onClick={() => { onDeleteClick(); setMenuPos(null); }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2"
            >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Изтрий
            </button>
        </div>,
        document.body
    ) : null;

    return (
        <div
            className={`flex items-end gap-1.5 ${isMine ? "justify-end" : "justify-start"} group/row`}
            style={toggleReaction ? { paddingBottom: '2.25rem' } : undefined}
            data-message-id={message.id}
        >
            {showMenu && (
                <div
                    className={`transition-opacity shrink-0 flex items-center pb-1 relative ${isMenuOpen ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"}`}
                    style={{ zIndex: 5 }}
                >
                    <button
                        ref={dotsBtnRef}
                        type="button"
                        onClick={handleDotsClick}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 touch-manipulation"
                        aria-label="Действия със съобщението"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </button>
                    {menuDropdown}
                </div>
            )}
            <div className={`shrink-0 max-w-full flex flex-col ${isMine ? "items-end" : "items-start"} relative`}>
                <div
                    className={`shrink-0 max-w-full text-[15px] leading-[1.5] ${isMine ? "chat-bubble-mine" : "chat-bubble-other"} ${message.optimistic ? "opacity-80" : ""}`}
                    style={{ padding: '0.75rem 1rem' }}
                >
                {isDeleted ? (
                    <p className="text-[14px] italic opacity-80">Съобщението е изтрито</p>
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
                            <button type="button" onClick={onEditCancel} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/20">
                                Отказ
                            </button>
                            <button type="button" onClick={onEditSave} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/30 hover:bg-white/40 text-white">
                                Запази
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {replyToMsg && (
                            <div className={`mb-2 pl-2.5 py-1.5 border-l-2 rounded-r ${isMine ? "border-white/45 bg-white/12" : "border-slate-300 bg-slate-50"}`}>
                                <p className="text-[11px] font-medium opacity-90 truncate max-w-[200px] text-inherit">
                                    {replyToMsg.message?.trim() || "Прикачен файл"}
                                </p>
                            </div>
                        )}
                        {message.message ? (
                            <p className="whitespace-pre-wrap break-words">{linkifyText(message.message)}</p>
                        ) : null}
                        {message.attachment_url && (
                            <div className="mt-2 rounded-lg overflow-hidden max-w-[280px]">
                                {/\.(jpe?g|png|gif|webp)(\?|$)/i.test(message.attachment_url) ? (
                                    <a
                                        href={message.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded-lg ring-1 ring-white/20 overflow-hidden"
                                    >
                                        <img
                                            src={message.attachment_url}
                                            alt="Прикачена снимка"
                                            className="max-h-[240px] w-auto object-contain rounded-lg"
                                        />
                                    </a>
                                ) : (
                                    <a
                                        href={message.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors max-w-full ${isMine ? "bg-white/20 text-white hover:bg-white/30 ring-1 ring-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-200/80"}`}
                                    >
                                        <svg className="w-4 h-4 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="truncate">Отвори прикачен файл</span>
                                        <svg className="w-3.5 h-3.5 shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        )}
                    </>
                )}
                {!isEditing && (
                    <div className={`mt-1.5 flex items-center justify-end gap-1.5 min-h-[18px] ${isMine ? "text-white/88" : "text-slate-400"}`}>
                        {message.optimistic ? (
                            <span className="text-[12px] opacity-90 inline-flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden>
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Изпраща се...
                            </span>
                        ) : message.sendFailed ? (
                            <span className="inline-flex items-center gap-2 flex-wrap justify-end">
                                <span className="text-[12px] opacity-90">Неуспешно изпращане</span>
                                <button type="button" onClick={onRetrySend} className="text-[12px] font-medium underline underline-offset-1 hover:no-underline opacity-95">
                                    Опитай отново
                                </button>
                            </span>
                        ) : (
                            <>
                                {message.is_edited && <span className="text-[10px] opacity-75">редактирано</span>}
                                {isLast && (
                                    <span className="text-[12px] font-medium tabular-nums" title={formatFullDate(message.created_at)}>
                                        {formatTime(message.created_at)}
                                    </span>
                                )}
                                {isMine && !isDeleted && <MessageStatus message={message} role={role} />}
                            </>
                        )}
                    </div>
                )}
                </div>
                {toggleReaction && (
                    <>
                        {reactions.length > 0 ? (
                            <div className="chat-reaction-pill-wrap">
                                <div className="chat-reaction-pill">
                                    {Object.entries(
                                        reactions.reduce<Record<string, number>>((acc, r) => {
                                            acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                                            return acc;
                                        }, {})
                                    ).map(([emoji, count]) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => toggleReaction?.(message.id, emoji)}
                                            className="chat-reaction-emoji-btn"
                                            title={count > 1 ? `${emoji} × ${count}` : emoji}
                                        >
                                            {emoji}
                                            {count > 1 && (
                                                <span className="ml-0.5 text-[10px] font-medium tabular-nums text-slate-500">
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowReactions((v) => !v)}
                                            className="chat-reaction-add-btn"
                                            aria-label="Добави реакция"
                                        >
                                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 8v8m-4-4h8" />
                                            </svg>
                                        </button>
                                        {showReactions && (
                                            <>
                                                <div className={`absolute bottom-full mb-1.5 py-2 px-2.5 rounded-2xl bg-white border border-slate-200 shadow-xl z-40 flex gap-0.5 ${isMine ? "right-0" : "left-0"}`}>
                                                    {REACTION_EMOJIS.map((e) => (
                                                        <button
                                                            key={e}
                                                            type="button"
                                                            onClick={() => { toggleReaction(message.id, e); setShowReactions(false); }}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-lg transition-transform active:scale-95"
                                                        >
                                                            {e}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="fixed inset-0 z-30" aria-hidden onClick={() => setShowReactions(false)} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`chat-reaction-pill-wrap chat-reaction-pill-wrap-only-hover ${isMine ? "chat-reaction-pill-mine" : "chat-reaction-pill-other"}`}>
                                <div className="chat-reaction-pill">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowReactions((v) => !v)}
                                            className="chat-reaction-add-btn"
                                            aria-label="Добави реакция"
                                        >
                                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 8v8m-4-4h8" />
                                            </svg>
                                        </button>
                                        {showReactions && (
                                            <>
                                                <div className={`absolute bottom-full mb-1.5 py-2 px-2.5 rounded-2xl bg-white border border-slate-200 shadow-xl z-40 flex gap-0.5 ${isMine ? "right-0" : "left-0"}`}>
                                                    {REACTION_EMOJIS.map((e) => (
                                                        <button
                                                            key={e}
                                                            type="button"
                                                            onClick={() => { toggleReaction(message.id, e); setShowReactions(false); }}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-lg transition-transform active:scale-95"
                                                        >
                                                            {e}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="fixed inset-0 z-30" aria-hidden onClick={() => setShowReactions(false)} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function arePropsEqual(prev: MessageBubbleProps, next: MessageBubbleProps): boolean {
    const prevReactions = prev.reactions ?? [];
    const nextReactions = next.reactions ?? [];
    const reactionsEqual =
        prevReactions.length === nextReactions.length &&
        prevReactions.every((r, i) => r.id === nextReactions[i]?.id);
    return (
        prev.message === next.message &&
        prev.isMine === next.isMine &&
        prev.isLast === next.isLast &&
        prev.role === next.role &&
        prev.isEditing === next.isEditing &&
        prev.editingDraft === next.editingDraft &&
        prev.messageMenuOpenId === next.messageMenuOpenId &&
        reactionsEqual
    );
}

const MessageBubble = memo(MessageBubbleInner, arePropsEqual);
export default MessageBubble;
export { MessageBubble };
