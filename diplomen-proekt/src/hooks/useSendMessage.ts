import { useState, useRef, useCallback } from "react";
import { supabase, ensureValidSession } from "../supabase-client";
import type { Message, Conversation, ChatRole } from "../types/chat";
import { buildMessagePayload, formatFileNameForDisplay, MAX_ATTACHMENT_SIZE_BYTES } from "../types/chat";

export function useSendMessage(
    selectedConv: Conversation | null,
    user: { id: string } | null,
    role: string | null,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    scrollToBottom: (force?: boolean) => void,
    loadConversations: () => void,
    showToast: (msg: string) => void
) {
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const handleSend = useCallback(async () => {
        if (!user || !role || !selectedConv || (!newMessage.trim() && !attachmentFile) || sending) return;
        setSending(true);
        let attachmentUrl: string | null = null;
        const optimisticId = `opt-${Date.now()}`;
        try {
            if (attachmentFile) {
                if (attachmentFile.size > MAX_ATTACHMENT_SIZE_BYTES) {
                    showToast(`Файлът надвишава лимита от ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB. Премахнете прикачването и изберете по-малък файл.`);
                    setSending(false);
                    return;
                }
                await ensureValidSession();
                const safeName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                const storagePath = `${user.id}/${Date.now()}_${safeName}`;
                const { data: uploadData, error: uploadError } = await supabase.storage.from("chat-attachments").upload(storagePath, attachmentFile, { upsert: false });
                if (uploadError) {
                    showToast(`Грешка при качване на файла: ${uploadError.message}`);
                    setSending(false);
                    return;
                }
                const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(uploadData.path);
                attachmentUrl = urlData.publicUrl;
            }

            const payload = {
                ...buildMessagePayload(role as ChatRole, user.id, selectedConv.otherUserId),
                message: newMessage.trim() || "",
                ...(attachmentUrl && { attachment_url: attachmentUrl }),
                ...(replyingTo?.id && { reply_to_id: replyingTo.id }),
            };
            const now = new Date().toISOString();
            const optimisticMsg: Message = {
                id: optimisticId,
                student_id: payload.student_id,
                teacher_id: payload.teacher_id,
                message: payload.message,
                created_at: now,
                read_at: null,
                read_by_student_at: null,
                read_by_teacher_at: null,
                is_from_student: payload.is_from_student,
                ...(attachmentUrl && { attachment_url: attachmentUrl }),
                ...(replyingTo && { reply_to_id: replyingTo.id, reply_to: replyingTo as Message }),
                optimistic: true,
            };

            setNewMessage("");
            setAttachmentFile(null);
            setReplyingTo(null);
            setMessages((prev) => [...prev, optimisticMsg].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));

            await ensureValidSession();
            const { data, error } = await supabase.from("messages").insert(payload).select("*").single();

            if (error) {
                const isBlocked = error.code === "P0001" || (error.message && error.message.includes("блокирал"));
                showToast(isBlocked ? "Не можете да изпращате съобщения – получателят ви е блокирал." : `Грешка при изпращане: ${error.message || "Неизвестна грешка"}`);
                setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, optimistic: false, sendFailed: true } : m)));
                setSending(false);
                return;
            }

            setMessages((prev) => prev.map((m) => (m.id === optimisticId ? (data as Message) : m)).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
            await supabase.from("hidden_conversations").delete().eq("user_id", user.id).eq("other_user_id", selectedConv.otherUserId);
            loadConversations();
            setTimeout(() => scrollToBottom(true), 50);
            setTimeout(() => scrollToBottom(true), 200);
        } catch (error: unknown) {
            showToast(`Грешка: ${error instanceof Error ? error.message : "Неизвестна грешка"}`);
            setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, optimistic: false, sendFailed: true } : m)));
        } finally {
            setSending(false);
        }
    }, [user, role, selectedConv, newMessage, attachmentFile, sending, setMessages, scrollToBottom, loadConversations, showToast]);

    const handleRetrySend = useCallback(
        async (msg: Message) => {
            if (!msg.sendFailed || !user || !role || !selectedConv) return;
            const optimisticId = msg.id;
            setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, optimistic: true, sendFailed: false } : m)));
            try {
                const payload = {
                    ...buildMessagePayload(role as ChatRole, user.id, selectedConv.otherUserId),
                    message: msg.message || "",
                    ...(msg.attachment_url && { attachment_url: msg.attachment_url }),
                };
                await ensureValidSession();
                const { data, error } = await supabase.from("messages").insert(payload).select("*").single();
                if (error) {
                    setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, optimistic: false, sendFailed: true } : m)));
                    const isBlocked = error.code === "P0001" || (error.message && error.message.includes("блокирал"));
                    showToast(isBlocked ? "Не можете да изпращате съобщения – получателят ви е блокирал." : `Грешка при изпращане: ${error.message || "Неизвестна грешка"}`);
                    return;
                }
                setMessages((prev) => prev.map((m) => (m.id === optimisticId ? (data as Message) : m)).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
                await supabase.from("hidden_conversations").delete().eq("user_id", user.id).eq("other_user_id", selectedConv.otherUserId);
                loadConversations();
            } catch (err: unknown) {
                setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, optimistic: false, sendFailed: true } : m)));
                showToast(`Грешка: ${err instanceof Error ? err.message : "Неизвестна грешка"}`);
            }
        },
        [user, role, selectedConv, setMessages, showToast, loadConversations]
    );

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const handleAttachmentClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) {
                setAttachmentFile(null);
                return;
            }
            if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
                showToast(`Файлът „${formatFileNameForDisplay(file.name)}“ надвишава лимита от ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB. Изберете по-малък файл.`);
                setAttachmentFile(null);
                return;
            }
            setAttachmentFile(file);
        },
        [showToast]
    );

    const handleEmojiSelect = useCallback((emoji: string) => {
        const input = inputRef.current;
        if (input) {
            const start = input.selectionStart ?? newMessage.length;
            const end = input.selectionEnd ?? newMessage.length;
            const before = newMessage.slice(0, start);
            const after = newMessage.slice(end);
            setNewMessage(before + emoji + after);
            requestAnimationFrame(() => {
                input.focus();
                const newPos = start + emoji.length;
                input.setSelectionRange(newPos, newPos);
            });
        } else {
            setNewMessage((prev) => prev + emoji);
        }
        setEmojiPickerOpen(false);
    }, [newMessage]);

    return {
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
        inputRef,
        emojiPickerRef,
        handleSend,
        handleRetrySend,
        handleKeyPress,
        handleAttachmentClick,
        handleFileChange,
        handleEmojiSelect,
    };
}
