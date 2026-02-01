import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "../supabase-client";
import type { Message } from "../types/chat";

export function useMessageActions(
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    loadConversations: () => void,
    showToast: (msg: string) => void,
    selectedConvOtherUserId: string | undefined
) {
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingDraft, setEditingDraft] = useState("");
    const [messageMenuOpenId, setMessageMenuOpenId] = useState<string | null>(null);
    const [deleteMessageConfirm, setDeleteMessageConfirm] = useState<Message | null>(null);
    const messageMenuRef = useRef<HTMLDivElement>(null);

    const handleEditStart = useCallback((msg: Message) => {
        setEditingMessageId(msg.id);
        setEditingDraft(msg.message || "");
        setMessageMenuOpenId(null);
    }, []);

    const handleEditSave = useCallback(async () => {
        if (!editingMessageId) return;
        const trimmed = editingDraft.trim();
        if (!trimmed) {
            setEditingMessageId(null);
            setEditingDraft("");
            return;
        }
        try {
            const { error } = await supabase
                .from("messages")
                .update({ message: trimmed, updated_at: new Date().toISOString(), is_edited: true })
                .eq("id", editingMessageId);
            if (error) {
                showToast(`Грешка при запазване: ${error.message}`);
                return;
            }
            setMessages((prev) =>
                prev.map((m) => (m.id === editingMessageId ? { ...m, message: trimmed, updated_at: new Date().toISOString(), is_edited: true } : m))
            );
            setEditingMessageId(null);
            setEditingDraft("");
            showToast("Редакцията е запазена.");
        } catch {
            showToast("Грешка при запазване.");
        }
    }, [editingMessageId, editingDraft, setMessages, showToast]);

    const handleEditCancel = useCallback(() => {
        setEditingMessageId(null);
        setEditingDraft("");
    }, []);

    const handleDeleteMessage = useCallback(
        async (msg: Message) => {
            setDeleteMessageConfirm(null);
            setMessageMenuOpenId(null);
            try {
                const { error } = await supabase.from("messages").update({ deleted_at: new Date().toISOString() }).eq("id", msg.id);
                if (error) {
                    showToast(`Грешка при изтриване: ${error.message}`);
                    return;
                }
                setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, deleted_at: new Date().toISOString() } : m)));
                loadConversations();
                showToast("Съобщението е изтрито.");
            } catch {
                showToast("Грешка при изтриване.");
            }
        },
        [setMessages, loadConversations, showToast]
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (messageMenuRef.current && !messageMenuRef.current.contains(e.target as Node)) setMessageMenuOpenId(null);
        };
        if (messageMenuOpenId) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [messageMenuOpenId]);

    useEffect(() => {
        setEditingMessageId(null);
        setEditingDraft("");
        setMessageMenuOpenId(null);
        setDeleteMessageConfirm(null);
    }, [selectedConvOtherUserId]);

    return {
        editingMessageId,
        editingDraft,
        setEditingDraft,
        messageMenuOpenId,
        setMessageMenuOpenId,
        messageMenuRef,
        deleteMessageConfirm,
        setDeleteMessageConfirm,
        handleEditStart,
        handleEditSave,
        handleEditCancel,
        handleDeleteMessage,
    };
}
