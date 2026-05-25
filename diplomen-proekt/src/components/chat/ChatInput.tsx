// text input, attach file, emoji picker, send button

import type { Message } from "../../types/chat";
import { formatFileNameForDisplay, MAX_ATTACHMENT_SIZE_BYTES, EMOJI_LIST } from "../../types/chat";

interface ChatInputProps {
    newMessage: string;
    setNewMessage: (s: string) => void;
    sending: boolean;
    attachmentFile: File | null;
    setAttachmentFile: (f: File | null) => void;
    emojiPickerOpen: boolean;
    setEmojiPickerOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
    replyingTo: Message | null;
    setReplyingTo: (m: Message | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    emojiPickerRef: React.RefObject<HTMLDivElement | null>;
    inputRef: React.RefObject<HTMLInputElement | null>;
    handleSend: () => void;
    handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleAttachmentClick: () => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleEmojiSelect: (emoji: string) => void;
}

export function ChatInput({
    newMessage,
    setNewMessage,
    sending,
    attachmentFile,
    setAttachmentFile,
    emojiPickerOpen,
    setEmojiPickerOpen,
    replyingTo,
    setReplyingTo,
    fileInputRef,
    emojiPickerRef,
    inputRef,
    handleSend,
    handleKeyPress,
    handleAttachmentClick,
    handleFileChange,
    handleEmojiSelect,
}: ChatInputProps) {
    const maxMb = MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024);

    return (
        <div className="chat-input-wrap flex-none w-full border-t border-slate-200/80" style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <div className="chat-input-inner w-full max-w-3xl mx-auto">
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    aria-hidden
                />
                {replyingTo && (
                    <div className="mb-2 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200">
                        <p className="text-[13px] text-slate-600 truncate flex-1">
                            <span className="font-medium text-slate-700">Отговор на:</span> {replyingTo.message?.trim() || "Прикачен файл"}
                        </p>
                        <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="shrink-0 p-1 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                            aria-label="Отмени отговора"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="chat-input-row flex items-center border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-200/50 focus-within:shadow-sm transition-all duration-200" style={{ gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '1rem' }}>
                    <button
                        type="button"
                        onClick={handleAttachmentClick}
                        className="chat-input-icon-btn shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-slate-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                        aria-label="Прикачи файл"
                        title="Прикачи файл"
                        disabled={sending}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>
                    <div className="relative shrink-0" ref={emojiPickerRef}>
                        <button
                            type="button"
                            onClick={() => setEmojiPickerOpen((open) => !open)}
                            className="chat-input-icon-btn shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-slate-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                            aria-label="Емотикон"
                            title="Емотикон"
                            disabled={sending}
                            aria-expanded={emojiPickerOpen}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        {emojiPickerOpen && (
                            <div className="absolute bottom-full left-0 mb-2 p-3 rounded-lg bg-white border border-slate-200 shadow-lg z-50 grid grid-cols-5 gap-1.5 min-w-[200px]">
                                {EMOJI_LIST.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleEmojiSelect(emoji)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-slate-100 transition-colors"
                                        aria-label={`Вмъкни ${emoji}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Напишете съобщение..."
                        disabled={sending}
                        className="chat-input-field flex-1 min-w-0 px-4 py-3 rounded-lg border-0 bg-transparent text-slate-800 placeholder-slate-400 text-[16px] leading-relaxed outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={(!newMessage.trim() && !attachmentFile) || sending}
                        className="chat-send-btn shrink-0 flex items-center justify-center disabled:cursor-not-allowed"
                        style={{ minWidth: '6.5rem', height: '3rem', padding: '0 1.25rem', borderRadius: '0.75rem', fontSize: '0.9375rem', fontWeight: 600, gap: '0.5rem' }}
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="hidden sm:inline">Изпрати</span>
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
                {attachmentFile && (
                    <div className="mt-2 flex items-center gap-2 pl-1">
                        <span className="text-[12px] text-slate-600 truncate max-w-[200px]" title={attachmentFile.name}>
                            Прикачен: {formatFileNameForDisplay(attachmentFile.name)}
                        </span>
                        <button
                            type="button"
                            onClick={() => setAttachmentFile(null)}
                            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                            aria-label="Премахни файл"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <p className="chat-input-hint mt-1.5 pl-1 text-[12px] text-slate-400">
                    Enter за изпращане • Макс. прикачен файл {maxMb} MB
                </p>
            </div>
        </div>
    );
}
