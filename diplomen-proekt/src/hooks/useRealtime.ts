import { useEffect, useRef, startTransition } from "react";
import { supabase } from "../supabase-client";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Message, Conversation, ChatRole } from "../types/chat";
import {
    getMyMessagesColumn,
    getOtherMessagesColumn,
    getOtherUserId,
    getReadAtUpdate,
    isMessageForMe,
} from "../types/chat";

export function useRealtime(
    user: { id: string } | null,
    role: string | null,
    selectedConv: Conversation | null,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
) {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const selectedOtherIdRef = useRef<string | null>(null);

    useEffect(() => {
        selectedOtherIdRef.current = selectedConv?.otherUserId ?? null;
    }, [selectedConv?.otherUserId]);

    useEffect(() => {
        if (!user || !role || !selectedConv) {
            selectedOtherIdRef.current = null;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            return;
        }
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        const otherUserId = selectedConv.otherUserId;
        selectedOtherIdRef.current = otherUserId;

        const channel = supabase
            .channel(`chat-${user.id}-${otherUserId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `${getMyMessagesColumn(role as ChatRole)}=eq.${user.id}.and.${getOtherMessagesColumn(role as ChatRole)}=eq.${otherUserId}`,
                },
                async (payload) => {
                    const newMsg = payload.new as Message;
                    const msgOtherId = getOtherUserId(newMsg, role as ChatRole);
                    if (selectedOtherIdRef.current !== msgOtherId) return;
                    const isForMe = isMessageForMe(newMsg, role as ChatRole);
                    const readAt = new Date().toISOString();
                    const readUpdate = isForMe ? getReadAtUpdate(role as ChatRole, readAt) : null;
                    const msgToAdd = readUpdate ? { ...newMsg, ...readUpdate } : newMsg;
                    
                    startTransition(() => {
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === newMsg.id)) return prev;
                            return [...prev, msgToAdd].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                        });
                        if (isForMe) {
                            // reset unread count for this conversation when a new message is received 
                            setConversations((prev) =>
                                prev.map((c) => (c.otherUserId === otherUserId ? { ...c, unreadCount: 0 } : c))
                            );
                        }
                    });
                    
                    if (isForMe && readUpdate) {
                        // wait for the update to complete
                        const myCol = getMyMessagesColumn(role as ChatRole);
                        await supabase.from("messages").update(readUpdate).eq("id", newMsg.id).eq(myCol, user.id);
                        window.dispatchEvent(new CustomEvent("chat-unread-updated"));
                    }
                }
            )
            .subscribe();
        channelRef.current = channel;
        return () => {
            selectedOtherIdRef.current = null;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user, role, selectedConv?.otherUserId, setMessages, setConversations]);
}
