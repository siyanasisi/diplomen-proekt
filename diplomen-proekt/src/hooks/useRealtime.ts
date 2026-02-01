import { useEffect, useRef } from "react";
import { supabase } from "../supabase-client";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Message, Conversation, ChatRole } from "../types/chat";
import {
    getMyMessagesColumn,
    getOtherMessagesColumn,
    getReadAtUpdate,
    isMessageForMe,
} from "../types/chat";

export function useRealtime(
    user: { id: string } | null,
    role: string | null,
    selectedConv: Conversation | null,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>,
    scrollToBottom: (force?: boolean) => void,
    debouncedLoadConversations: () => void
) {
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!user || !role || !selectedConv) {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            return;
        }
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        const channel = supabase
            .channel(`chat-${user.id}-${selectedConv.otherUserId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `${getMyMessagesColumn(role as ChatRole)}=eq.${user.id}.and.${getOtherMessagesColumn(role as ChatRole)}=eq.${selectedConv.otherUserId}`,
                },
                async (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    });
                    setTimeout(() => scrollToBottom(false), 50);
                    setTimeout(() => scrollToBottom(false), 150);
                    if (isMessageForMe(newMsg, role as ChatRole)) {
                        const readAt = new Date().toISOString();
                        const readUpdate = getReadAtUpdate(role as ChatRole, readAt);
                        await supabase.from("messages").update(readUpdate).eq("id", newMsg.id);
                        setMessages((prev) => prev.map((m) => (m.id === newMsg.id ? { ...m, ...readUpdate } : m)));
                        setConversations((prev) =>
                            prev.map((conv) => (conv.otherUserId === selectedConv?.otherUserId ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - 1) } : conv))
                        );
                    }
                    debouncedLoadConversations();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                    filter: `${getMyMessagesColumn(role as ChatRole)}=eq.${user.id}.and.${getOtherMessagesColumn(role as ChatRole)}=eq.${selectedConv.otherUserId}`,
                },
                async (payload) => {
                    const updatedMsg = payload.new as Message;
                    const oldMsg = payload.old as Message;
                    const readStatusChanged =
                        (role === "student" && updatedMsg.read_by_teacher_at !== oldMsg.read_by_teacher_at) ||
                        (role === "teacher" && updatedMsg.read_by_student_at !== oldMsg.read_by_student_at);
                    if (readStatusChanged) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === updatedMsg.id
                                    ? { ...m, read_by_student_at: updatedMsg.read_by_student_at, read_by_teacher_at: updatedMsg.read_by_teacher_at, read_at: updatedMsg.read_at }
                                    : m
                            )
                        );
                    }
                }
            )
            .subscribe();
        channelRef.current = channel;
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user, role, selectedConv, setMessages, setConversations, scrollToBottom, debouncedLoadConversations]);
}
