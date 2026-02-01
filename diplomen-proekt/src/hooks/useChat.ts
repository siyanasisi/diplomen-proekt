import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Message, Conversation, ChatRole } from "../types/chat";
import {
    getMyMessagesColumn,
    getOtherMessagesColumn,
    getOtherUserId,
    isUnreadForMe,
    getReadAtUpdate,
    isMessageForMe,
    buildMessagePayload,
    formatFileNameForDisplay,
    MESSAGES_PAGE_SIZE,
    MAX_ATTACHMENT_SIZE_BYTES,
} from "../types/chat";

// conversations, messages, send, realtime, block/delete, scroll
export function useChat() {
    const { user, role, currentUserProfile } = useAuth();
    const navigate = useNavigate();
    const showToast = useToast();

    // refs for scroll, input, file input, emoji picker, menus
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
    const isNearBottomRef = useRef(true);
    const loadConversationsTimeoutRef = useRef<number | null>(null);
    const scrollTimeoutRef = useRef<number | null>(null);
    const pendingScrollRestoreRef = useRef<{ oldScrollHeight: number; oldScrollTop: number } | null>(null);
    const loadOlderRequestedRef = useRef(false);
    const messagesRef = useRef<Message[]>([]);
    const didPrependOlderRef = useRef(false);

    // conversations and selected chat
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    // messages and loading/error states
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messagesLoadError, setMessagesLoadError] = useState(false);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [olderMessagesLoadError, setOlderMessagesLoadError] = useState(false);
    const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(true);
    // input and send
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [showScrollFAB, setShowScrollFAB] = useState(false);
    const [conversationSearch, setConversationSearch] = useState("");
    // header menus (more options, info panel)
    const [chatHeaderMoreOpen, setChatHeaderMoreOpen] = useState(false);
    const [chatHeaderInfoOpen, setChatHeaderInfoOpen] = useState(false);
    const chatHeaderMoreRef = useRef<HTMLDivElement>(null);
    const chatHeaderInfoRef = useRef<HTMLDivElement>(null);
    // attachment and emoji
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    // edit/delete message menu
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingDraft, setEditingDraft] = useState("");
    const [messageMenuOpenId, setMessageMenuOpenId] = useState<string | null>(null);
    const messageMenuRef = useRef<HTMLDivElement>(null);
    // confirm modals (block, delete chat, delete message)
    const [confirmAction, setConfirmAction] = useState<"block" | "delete_chat" | null>(null);
    const [deleteMessageConfirm, setDeleteMessageConfirm] = useState<Message | null>(null);

    // redirect to login if not authenticated
    useEffect(() => {
        if (!user) navigate("/login", { replace: true });
    }, [user, navigate]);

    // allow page scroll (chat layout may lock it)
    useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, []);

    // escape: close one layer at a time; skip only when focus is in main chat input

    const checkIfNearBottom = useCallback(() => {
        if (!messagesContainerRef.current) return false;
        const container = messagesContainerRef.current;
        return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    }, []);

    // scroll message list to bottom (used after new messages, on FAB click)
    const scrollToBottom = useCallback((force = false) => {
        if (!messagesContainerRef.current) return;
        const container = messagesContainerRef.current;
        if (force || isNearBottomRef.current) {
            const scroll = () => {
                if (container) container.scrollTop = container.scrollHeight;
            };
            scroll();
            requestAnimationFrame(() => {
                scroll();
                setTimeout(() => scroll(), 10);
                setTimeout(() => scroll(), 50);
                setTimeout(() => scroll(), 100);
                setTimeout(() => scroll(), 200);
            });
        }
    }, []);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const near = checkIfNearBottom();
                    isNearBottomRef.current = near;
                    setShowScrollFAB(!near);
                    ticking = false;
                });
                ticking = true;
            }
        };
        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [checkIfNearBottom]);

    useEffect(() => {
        if (didPrependOlderRef.current) {
            didPrependOlderRef.current = false;
            return;
        }
        if (messages.length > 0 && !loadingMessages) {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            [0, 50, 100, 200].forEach((delay) => {
                scrollTimeoutRef.current = window.setTimeout(() => scrollToBottom(true), delay);
            });
        }
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, [messages.length, loadingMessages, scrollToBottom]);

    // load conversation list (with profiles for names/avatars)
    const loadConversations = useCallback(async () => {
        if (!user || !role) return;
        setLoadingConversations(true);
        try {
            const myCol = getMyMessagesColumn(role as ChatRole);
            const messagesQuery = supabase
                .from("messages")
                .select("id, student_id, teacher_id, message, created_at, is_from_student, read_by_student_at, read_by_teacher_at, read_at, deleted_at, attachment_url")
                .eq(myCol, user.id)
                .order("created_at", { ascending: false })
                .limit(500);

            const [, blockRes, hiddenRes, messagesRes] = await Promise.all([
                ensureValidSession(),
                supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id),
                supabase.from("hidden_conversations").select("other_user_id").eq("user_id", user.id),
                messagesQuery,
            ]);

            const blockedIds = new Set(blockRes.error ? [] : (blockRes.data ?? []).map((r: { blocked_id: string }) => r.blocked_id));
            const hiddenOtherIds = new Set(hiddenRes.error ? [] : (hiddenRes.data ?? []).map((r: { other_user_id: string }) => r.other_user_id));
            const { data, error } = messagesRes;

            if (error) {
                console.error("Error loading conversations:", error);
                setConversations([]);
                setLoadingConversations(false);
                return;
            }
            if (!data || data.length === 0) {
                setConversations([]);
                setLoadingConversations(false);
                return;
            }

            const groups = new Map<string, Message[]>();
            (data as Message[]).forEach((msg) => {
                const otherId = getOtherUserId(msg, role as ChatRole);
                if (!groups.has(otherId)) groups.set(otherId, []);
                groups.get(otherId)!.push(msg);
            });

            const allOtherUserIds = Array.from(groups.keys());
            const userNamesMap = new Map<string, { name: string; email?: string; avatarUrl?: string }>();
            const defaultName = role === "student" ? "Учител" : "Ученик";

            if (allOtherUserIds.length > 0) {
                try {
                    const [teacherRes, profilesRes] = await Promise.all([
                        role === "student"
                            ? supabase.from("teacher_profiles").select("user_id, full_name, email, profile_picture").in("user_id", allOtherUserIds)
                            : Promise.resolve({ data: [] as { user_id: string; full_name?: string | null; email?: string | null; profile_picture?: string | null }[] }),
                        supabase.from("profiles").select("id, first_name, last_name, email, avatar_url").in("id", allOtherUserIds),
                    ]);

                    (teacherRes.data ?? []).forEach((t: { user_id: string; full_name?: string | null; email?: string | null; profile_picture?: string | null }) => {
                        if (t.user_id)
                            userNamesMap.set(t.user_id, {
                                name: t.full_name || defaultName,
                                email: t.email ?? undefined,
                                avatarUrl: t.profile_picture ?? undefined,
                            });
                    });

                    const profileRows = profilesRes.data ?? [];
                    if (profilesRes.error && profileRows.length === 0) {
                        const fallback = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", allOtherUserIds);
                        (fallback.data ?? []).forEach((row: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null }) => {
                            if (row?.id) {
                                const fromParts = `${row.first_name || ""} ${row.last_name || ""}`.trim();
                                const name = fromParts || (row.email?.split("@")[0] ?? null) || defaultName;
                                userNamesMap.set(row.id, { name, email: row.email ?? undefined, avatarUrl: undefined });
                            }
                        });
                    } else {
                        profileRows.forEach((row: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; avatar_url?: string | null }) => {
                            if (row?.id) {
                                const fromParts = `${row.first_name || ""} ${row.last_name || ""}`.trim();
                                const name = fromParts || (row.email?.split("@")[0] ?? null) || defaultName;
                                const avatarUrl = row.avatar_url ?? undefined;
                                if (!userNamesMap.has(row.id)) userNamesMap.set(row.id, { name, email: row.email ?? undefined, avatarUrl });
                            }
                        });
                    }
                } catch (err) {
                    console.error("Error batch loading user names:", err);
                }
            }

            const convs: Conversation[] = [];
            for (const [otherUserId, msgs] of groups.entries()) {
                if (blockedIds.has(otherUserId) || hiddenOtherIds.has(otherUserId)) continue;
                msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                const nonDeleted = msgs.filter((m) => !m.deleted_at);
                const lastMsg = nonDeleted[nonDeleted.length - 1] ?? msgs[msgs.length - 1];
                const unreadCount = msgs.filter((m) => !m.deleted_at && isUnreadForMe(m, role as ChatRole)).length;
                const userInfo = userNamesMap.get(otherUserId) || { name: defaultName, email: undefined, avatarUrl: undefined };
                convs.push({
                    otherUserId,
                    otherUserName: userInfo.name,
                    otherUserEmail: userInfo.email,
                    otherUserAvatarUrl: userInfo.avatarUrl,
                    lastMessage: lastMsg?.deleted_at ? "Съобщението е изтрито" : (lastMsg?.message?.trim() || (lastMsg?.attachment_url ? "📎 Прикачен файл" : "")),
                    lastTime: lastMsg?.created_at ?? "",
                    unreadCount,
                });
            }
            convs.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
            setConversations(convs);
            setSelectedConv((prev) => {
                if (convs.length === 0) return null;
                if (prev && convs.some((c) => c.otherUserId === prev.otherUserId)) return prev;
                return convs[0];
            });
        } catch (error) {
            console.error("Failed to load conversations:", error);
            setConversations([]);
        } finally {
            setLoadingConversations(false);
        }
    }, [user, role]);

    useEffect(() => {
        if (!selectedConv || !role) return;
        const isFallback = selectedConv.otherUserName === "Ученик" || selectedConv.otherUserName === "Учител";
        if (!isFallback && selectedConv.otherUserAvatarUrl) return;
        type ProfileRow = { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; avatar_url?: string | null };
        let cancelled = false;
        (async () => {
            let data: ProfileRow | null = null;
            const res = await supabase.from("profiles").select("id, first_name, last_name, email, avatar_url").eq("id", selectedConv.otherUserId).maybeSingle();
            if (res.data) data = res.data as ProfileRow;
            if (!data) {
                const res2 = await supabase.from("profiles").select("id, first_name, last_name, email").eq("id", selectedConv.otherUserId).maybeSingle();
                if (res2.data) data = res2.data as ProfileRow;
            }
            if (cancelled || !data?.id) return;
            const fromParts = `${data.first_name || ""} ${data.last_name || ""}`.trim();
            const name = fromParts || (data.email?.split("@")[0] ?? null) || (role === "student" ? "Учител" : "Ученик");
            const avatarUrl = "avatar_url" in data ? (data.avatar_url ?? undefined) : undefined;
            const email = data.email ?? undefined;
            setConversations((prev) =>
                prev.map((c) =>
                    c.otherUserId === selectedConv.otherUserId ? { ...c, otherUserName: name, otherUserEmail: email ?? c.otherUserEmail, otherUserAvatarUrl: avatarUrl ?? c.otherUserAvatarUrl } : c
                )
            );
            setSelectedConv((prev) =>
                prev?.otherUserId === selectedConv.otherUserId ? { ...prev, otherUserName: name, otherUserEmail: email ?? prev.otherUserEmail, otherUserAvatarUrl: avatarUrl ?? prev.otherUserAvatarUrl } : prev
            );
        })();
        return () => { cancelled = true; };
    }, [selectedConv, role]);

    const debouncedLoadConversations = useCallback(() => {
        if (loadConversationsTimeoutRef.current) clearTimeout(loadConversationsTimeoutRef.current);
        loadConversationsTimeoutRef.current = window.setTimeout(() => loadConversations(), 300);
    }, [loadConversations]);

    useEffect(() => {
        return () => {
            if (loadConversationsTimeoutRef.current) clearTimeout(loadConversationsTimeoutRef.current);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

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
        [user, role, scrollToBottom, showToast]
    );

    messagesRef.current = messages;

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
    }, [user, role, selectedConv, loadingOlderMessages, hasMoreOlderMessages, showToast]);

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
    }, [messages.length]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || !hasMoreOlderMessages || loadingOlderMessages) return;
        const handleScrollForOlder = () => {
            if (container.scrollTop < 200 && hasMoreOlderMessages && !loadingOlderMessages) loadOlderMessages();
        };
        container.addEventListener("scroll", handleScrollForOlder, { passive: true });
        return () => container.removeEventListener("scroll", handleScrollForOlder);
    }, [hasMoreOlderMessages, loadingOlderMessages, loadOlderMessages]);

    useEffect(() => {
        if (user && role) loadConversations();
    }, [user, role, loadConversations]);

    useEffect(() => {
        if (!user || !role) {
            if (conversationsChannelRef.current) {
                supabase.removeChannel(conversationsChannelRef.current);
                conversationsChannelRef.current = null;
            }
            return;
        }
        if (conversationsChannelRef.current) supabase.removeChannel(conversationsChannelRef.current);
        const channel = supabase
            .channel(`conversations-${user.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `${getMyMessagesColumn(role as ChatRole)}=eq.${user.id}` }, () => debouncedLoadConversations())
            .subscribe();
        conversationsChannelRef.current = channel;
        return () => {
            if (conversationsChannelRef.current) {
                supabase.removeChannel(conversationsChannelRef.current);
                conversationsChannelRef.current = null;
            }
        };
    }, [user, role, debouncedLoadConversations]);

    useEffect(() => {
        if (selectedConv && user && role) loadMessages(selectedConv);
        else {
            setMessages([]);
            setMessagesLoadError(false);
        }
    }, [selectedConv, user, role, loadMessages]);

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
    }, [user, role, selectedConv, scrollToBottom, debouncedLoadConversations]);

    // send message 
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
                optimistic: true,
            };

            setNewMessage("");
            setAttachmentFile(null);
            setMessages((prev) => [...prev, optimisticMsg].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
            setTimeout(() => scrollToBottom(true), 50);
            setTimeout(() => scrollToBottom(true), 200);

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
    }, [user, role, selectedConv, newMessage, attachmentFile, sending, scrollToBottom, loadConversations, showToast]);

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
                setTimeout(() => scrollToBottom(true), 50);
            } catch (err: unknown) {
                setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, optimistic: false, sendFailed: true } : m)));
                showToast(`Грешка: ${err instanceof Error ? err.message : "Неизвестна грешка"}`);
            }
        },
        [user, role, selectedConv, showToast, loadConversations, scrollToBottom]
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

    const handleEditStart = useCallback((msg: Message) => {
        setEditingMessageId(msg.id);
        setEditingDraft(msg.message || "");
        setMessageMenuOpenId(null);
    }, []);

    const handleEditSave = useCallback(async () => {
        if (!editingMessageId || !user) return;
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
    }, [editingMessageId, editingDraft, user, showToast]);

    const handleEditCancel = useCallback(() => {
        setEditingMessageId(null);
        setEditingDraft("");
    }, []);

    // escape - close one layer at a time
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            const active = document.activeElement;
            if (active === inputRef.current) return;
            if (editingMessageId) {
                handleEditCancel();
                return;
            }
            if (deleteMessageConfirm) {
                setDeleteMessageConfirm(null);
                return;
            }
            if (confirmAction) {
                setConfirmAction(null);
                return;
            }
            if (messageMenuOpenId) {
                setMessageMenuOpenId(null);
                return;
            }
            if (chatHeaderInfoOpen) {
                setChatHeaderInfoOpen(false);
                return;
            }
            if (chatHeaderMoreOpen) {
                setChatHeaderMoreOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [editingMessageId, deleteMessageConfirm, confirmAction, messageMenuOpenId, chatHeaderInfoOpen, chatHeaderMoreOpen, handleEditCancel]);

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
        [loadConversations, showToast]
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
        setChatHeaderInfoOpen(false);
        setChatHeaderMoreOpen(false);
        setConfirmAction(null);
        setDeleteMessageConfirm(null);
        setHasMoreOlderMessages(true);
        setLoadingOlderMessages(false);
        loadOlderRequestedRef.current = false;
    }, [selectedConv?.otherUserId]);

    const handleBlockUser = useCallback(async () => {
        if (!user || !selectedConv) return;
        const { error } = await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: selectedConv.otherUserId });
        if (error) {
            showToast("Блокирането не можа да се извърши. Моля, опитайте отново по-късно.");
            return;
        }
        setConfirmAction(null);
        setChatHeaderMoreOpen(false);
        setSelectedConv(null);
        loadConversations();
    }, [user, selectedConv, loadConversations, showToast]);

    const handleDeleteChat = useCallback(async () => {
        if (!user || !selectedConv) return;
        const { error } = await supabase.from("hidden_conversations").insert({ user_id: user.id, other_user_id: selectedConv.otherUserId });
        if (error) {
            showToast("Чатът не можа да бъде изтрит. Моля, опитайте отново по-късно.");
            return;
        }
        setConfirmAction(null);
        setChatHeaderMoreOpen(false);
        setSelectedConv(null);
        loadConversations();
    }, [user, selectedConv, loadConversations, showToast]);

    const filteredConversations = useMemo(() => {
        if (!conversationSearch.trim()) return conversations;
        const q = conversationSearch.trim().toLowerCase();
        return conversations.filter(
            (c) =>
                c.otherUserName.toLowerCase().includes(q) ||
                (c.otherUserEmail && c.otherUserEmail.toLowerCase().includes(q)) ||
                (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
        );
    }, [conversations, conversationSearch]);

    const handleScrollToBottomClick = useCallback(() => {
        scrollToBottom(true);
        setShowScrollFAB(false);
    }, [scrollToBottom]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (chatHeaderMoreRef.current && !chatHeaderMoreRef.current.contains(e.target as Node)) setChatHeaderMoreOpen(false);
        };
        if (chatHeaderMoreOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [chatHeaderMoreOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setEmojiPickerOpen(false);
        };
        if (emojiPickerOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [emojiPickerOpen]);

    useEffect(() => {
        setAttachmentFile(null);
        setEmojiPickerOpen(false);
    }, [selectedConv?.otherUserId]);

    const currentUserAvatarUrl = currentUserProfile?.avatar_url ?? (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ?? null;

    return {
        user,
        role,
        currentUserAvatarUrl,
        navigate,
        conversations,
        setConversations,
        selectedConv,
        setSelectedConv,
        messages,
        loadingConversations,
        loadingMessages,
        messagesLoadError,
        loadingOlderMessages,
        olderMessagesLoadError,
        hasMoreOlderMessages,
        newMessage,
        setNewMessage,
        sending,
        showScrollFAB,
        conversationSearch,
        setConversationSearch,
        chatHeaderMoreOpen,
        setChatHeaderMoreOpen,
        chatHeaderInfoOpen,
        setChatHeaderInfoOpen,
        chatHeaderMoreRef,
        chatHeaderInfoRef,
        attachmentFile,
        setAttachmentFile,
        emojiPickerOpen,
        setEmojiPickerOpen,
        fileInputRef,
        emojiPickerRef,
        inputRef,
        editingMessageId,
        editingDraft,
        setEditingDraft,
        messageMenuOpenId,
        setMessageMenuOpenId,
        messageMenuRef,
        confirmAction,
        setConfirmAction,
        deleteMessageConfirm,
        setDeleteMessageConfirm,
        messagesContainerRef,
        loadMessages,
        loadOlderMessages,
        loadConversations,
        handleSend,
        handleRetrySend,
        handleKeyPress,
        handleAttachmentClick,
        handleFileChange,
        handleEmojiSelect,
        handleEditStart,
        handleEditSave,
        handleEditCancel,
        handleDeleteMessage,
        handleBlockUser,
        handleDeleteChat,
        handleScrollToBottomClick,
        filteredConversations,
        showToast,
    };
}
