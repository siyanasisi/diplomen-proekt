import { useEffect, useState, useRef, useCallback, startTransition } from "react";
import { supabase, ensureValidSession } from "../supabase-client";
import type { Message, Conversation, ChatRole } from "../types/chat";
import {
    getMyMessagesColumn,
    getOtherMessagesColumn,
    isUnreadForMe,
    getReadAtUpdate,
    MESSAGES_PAGE_SIZE,
} from "../types/chat";

export function useMessages(
    selectedConv: Conversation | null,
    user: { id: string } | null,
    role: string | null,
    messagesContainerRef: React.RefObject<HTMLDivElement | null>,
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>,
    showToast: (msg: string) => void
) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messagesLoadError, setMessagesLoadError] = useState(false);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [olderMessagesLoadError, setOlderMessagesLoadError] = useState(false);
    const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(true);

    const messagesRef = useRef<Message[]>([]);
    const pendingScrollRestoreRef = useRef<{ oldScrollHeight: number; oldScrollTop: number } | null>(null);
    const loadOlderRequestedRef = useRef(false);
    const didPrependOlderRef = useRef(false);
    const loadingForRef = useRef<string | null>(null);
    const selectedConvRef = useRef<Conversation | null>(null);

    messagesRef.current = messages;
    selectedConvRef.current = selectedConv;

    const loadMessages = useCallback(
        async (conv: Conversation) => {
            if (!user || !role || !conv) return;
            const otherUserId = conv.otherUserId;
            loadingForRef.current = otherUserId;
            setLoadingMessages(true);
            setMessagesLoadError(false);
            setOlderMessagesLoadError(false);
            try {
                const myCol = getMyMessagesColumn(role as ChatRole);
                const otherCol = getOtherMessagesColumn(role as ChatRole);
                const [, { data, error }] = await Promise.all([
                    ensureValidSession(),
                    supabase.from("messages").select("*").eq(myCol, user.id).eq(otherCol, conv.otherUserId).order("created_at", { ascending: false }).limit(MESSAGES_PAGE_SIZE),
                ]);

                if (loadingForRef.current !== otherUserId) return;

                if (error) {
                    console.error("[useMessages] Error loading messages:", error);
                    setMessages([]);
                    setMessagesLoadError(true);
                    showToast("Съобщенията не можаха да се заредят.");
                    return;
                }

                const raw = (data as Message[]) || [];
                const msgIds = raw.map((m) => m.id);
                let hiddenIds: string[] = [];
                if (msgIds.length > 0) {
                    try {
                        const { data: hiddenData } = await supabase
                            .from("user_hidden_messages")
                            .select("message_id")
                            .eq("user_id", user.id)
                            .in("message_id", msgIds);
                        hiddenIds = (hiddenData ?? []).map((r: { message_id: string }) => r.message_id);
                    } catch (err) {
                        console.error("[useMessages] Failed to load hidden message ids:", err);
                    }
                }
                const visible = raw.filter((m) => !hiddenIds.includes(m.id));
                const msgs = [...visible].reverse();
                setMessages(msgs);
                setHasMoreOlderMessages(raw.length === MESSAGES_PAGE_SIZE);

                const readAt = new Date().toISOString();
                const unreadIds = msgs.filter((m) => isUnreadForMe(m, role as ChatRole)).map((m) => m.id);
                
                startTransition(() => {
                    setConversations((prev) => prev.map((c) => (c.otherUserId === conv.otherUserId ? { ...c, unreadCount: 0 } : c)));
                });

                if (unreadIds.length > 0) {
                    const readUpdate = getReadAtUpdate(role as ChatRole, readAt);
                    const myCol = getMyMessagesColumn(role as ChatRole);

                    const { error: updateError, data: updateData } = await supabase
                        .from("messages")
                        .update(readUpdate)
                        .in("id", unreadIds)
                        .eq(myCol, user.id)
                        .select();

                    if (!updateError && updateData && updateData.length > 0) {
                        startTransition(() => {
                            setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, ...readUpdate } : m)));
                        });
                    } else if (updateError) {
                        console.error("[useMessages] Failed to mark messages as read:", updateError);
                    }
                }
                window.dispatchEvent(new CustomEvent("chat-unread-updated"));
            } catch (error) {
                console.error("[useMessages] Failed to load messages:", error);
                setMessages([]);
                setMessagesLoadError(true);
                showToast("Съобщенията не можаха да се заредят.");
            } finally {
                if (loadingForRef.current === otherUserId) setLoadingMessages(false);
            }
        },
        [user, role, setConversations, showToast]
    );

    const loadOlderMessages = useCallback(async () => {
        if (!user || !role || !selectedConv || loadingOlderMessages || !hasMoreOlderMessages) return;
        const current = messagesRef.current;
        if (current.length === 0) return;
        const oldest = current[0];
        if (loadOlderRequestedRef.current) return;
        loadOlderRequestedRef.current = true;
        setLoadingOlderMessages(true);
        setOlderMessagesLoadError(false);
        const container = messagesContainerRef.current;
        const oldScrollHeight = container?.scrollHeight ?? 0;
        const oldScrollTop = container?.scrollTop ?? 0;

        try {
            await ensureValidSession();
            const myCol = getMyMessagesColumn(role as ChatRole);
            const otherCol = getOtherMessagesColumn(role as ChatRole);
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq(myCol, user.id)
                .eq(otherCol, selectedConv.otherUserId)
                .lt("created_at", oldest.created_at)
                .order("created_at", { ascending: false })
                .limit(MESSAGES_PAGE_SIZE);

            if (error) {
                setOlderMessagesLoadError(true);
                showToast("По-старите съобщения не можаха да се заредят.");
                return;
            }
            const raw = (data as Message[]) || [];
            const olderIds = raw.map((m) => m.id);
            let hiddenOlderIds: string[] = [];
            if (olderIds.length > 0) {
                try {
                    const { data: hiddenData } = await supabase
                        .from("user_hidden_messages")
                        .select("message_id")
                        .eq("user_id", user.id)
                        .in("message_id", olderIds);
                    hiddenOlderIds = (hiddenData ?? []).map((r: { message_id: string }) => r.message_id);
                } catch (err) {
                    console.error("[useMessages] Failed to load hidden ids for older messages:", err);
                }
            }
            const olderVisible = raw.filter((m) => !hiddenOlderIds.includes(m.id));
            const older = [...olderVisible].reverse();
            setHasMoreOlderMessages(raw.length === MESSAGES_PAGE_SIZE);
            if (older.length > 0) {
                pendingScrollRestoreRef.current = { oldScrollHeight, oldScrollTop };
                didPrependOlderRef.current = true;
                setMessages((prev) => [...older, ...prev]);
            } else {
                setHasMoreOlderMessages(false);
            }
        } catch (err) {
            console.error("[useMessages] Failed to load older messages:", err);
            setOlderMessagesLoadError(true);
            showToast("По-старите съобщения не можаха да се заредят.");
        } finally {
            setLoadingOlderMessages(false);
            loadOlderRequestedRef.current = false;
        }
    }, [user, role, selectedConv, loadingOlderMessages, hasMoreOlderMessages, messagesContainerRef, showToast]);

    useEffect(() => {
        if (!pendingScrollRestoreRef.current || !messagesContainerRef.current) return;
        const pending = pendingScrollRestoreRef.current;
        pendingScrollRestoreRef.current = null;
        requestAnimationFrame(() => {
            const container = messagesContainerRef.current;
            if (!container) return;
            const added = container.scrollHeight - pending.oldScrollHeight;
            container.scrollTop = pending.oldScrollTop + added;
        });
    }, [messages.length, messagesContainerRef]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || !hasMoreOlderMessages || loadingOlderMessages) return;
        const handleScrollForOlder = () => {
            if (container.scrollTop < 200 && hasMoreOlderMessages && !loadingOlderMessages) loadOlderMessages();
        };
        container.addEventListener("scroll", handleScrollForOlder, { passive: true });
        return () => container.removeEventListener("scroll", handleScrollForOlder);
    }, [hasMoreOlderMessages, loadingOlderMessages, loadOlderMessages, messagesContainerRef]);

    const selectedOtherUserId = selectedConv?.otherUserId ?? null;

    useEffect(() => {
        if (!selectedConv || !user || !role) {
            loadingForRef.current = null;
            setMessages([]);
            setMessagesLoadError(false);
            setLoadingMessages(false);
            return;
        }
        // clear previous chat immediately 
        didPrependOlderRef.current = false;
        pendingScrollRestoreRef.current = null;
        loadOlderRequestedRef.current = false;
        setMessages([]);
        setMessagesLoadError(false);
        setLoadingMessages(true);
        const conv = selectedConvRef.current;
        if (conv) loadMessages(conv);
    }, [selectedOtherUserId, user, role, loadMessages]);

    return {
        messages,
        setMessages,
        loadMessages,
        loadOlderMessages,
        loadingMessages,
        messagesLoadError,
        loadingOlderMessages,
        olderMessagesLoadError,
        hasMoreOlderMessages,
        setHasMoreOlderMessages,
        setLoadingOlderMessages,
        loadOlderRequestedRef,
        didPrependOlderRef,
    };
}
