import { useEffect, useState, useRef, useCallback } from "react";
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
    scrollToBottom: (force?: boolean) => void,
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

    messagesRef.current = messages;

    const loadMessages = useCallback(
        async (conv: Conversation) => {
            if (!user || !role || !conv) return;
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

                if (error) {
                    console.error("Error loading messages:", error);
                    setMessages([]);
                    setMessagesLoadError(true);
                    showToast("Съобщенията не можаха да се заредят.");
                    return;
                }

                const raw = (data as Message[]) || [];
                const msgs = [...raw].reverse();
                setMessages(msgs);
                setHasMoreOlderMessages(raw.length === MESSAGES_PAGE_SIZE);
                setTimeout(() => scrollToBottom(true), 100);
                setTimeout(() => scrollToBottom(true), 250);

                const readAt = new Date().toISOString();
                const unreadIds = msgs.filter((m) => isUnreadForMe(m, role as ChatRole)).map((m) => m.id);
                if (unreadIds.length > 0) {
                    const readUpdate = getReadAtUpdate(role as ChatRole, readAt);
                    setConversations((prev) => prev.map((c) => (c.otherUserId === conv.otherUserId ? { ...c, unreadCount: 0 } : c)));
                    supabase
                        .from("messages")
                        .update(readUpdate)
                        .in("id", unreadIds)
                        .then(({ error: updateError }) => {
                            if (!updateError)
                                setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, ...readUpdate } : m)));
                        });
                }
            } catch (error) {
                console.error("Failed to load messages:", error);
                setMessages([]);
                setMessagesLoadError(true);
                showToast("Съобщенията не можаха да се заредят.");
            } finally {
                setLoadingMessages(false);
            }
        },
        [user, role, scrollToBottom, setConversations, showToast]
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
            const older = [...raw].reverse();
            setHasMoreOlderMessages(raw.length === MESSAGES_PAGE_SIZE);
            if (older.length > 0) {
                pendingScrollRestoreRef.current = { oldScrollHeight, oldScrollTop };
                didPrependOlderRef.current = true;
                setMessages((prev) => [...older, ...prev]);
            } else {
                setHasMoreOlderMessages(false);
            }
        } catch {
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

    useEffect(() => {
        if (selectedConv && user && role) loadMessages(selectedConv);
        else {
            setMessages([]);
            setMessagesLoadError(false);
        }
    }, [selectedConv, user, role, loadMessages]);

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
