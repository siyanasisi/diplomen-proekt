import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { AvatarImage } from "../components/AvatarImage";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Message {
    id: string;
    student_id: string;
    teacher_id: string;
    message: string;
    created_at: string;
    read_at: string | null; // kept for backward compatibility
    read_by_student_at: string | null;
    read_by_teacher_at: string | null;
    is_from_student: boolean;
    attachment_url?: string | null;
    updated_at?: string | null;
    is_edited?: boolean;
    deleted_at?: string | null;
}

interface Conversation {
    otherUserId: string;
    otherUserName: string;
    otherUserEmail?: string;
    otherUserAvatarUrl?: string;
    lastMessage: string;
    lastTime: string;
    unreadCount: number;
}

function getDisplayName(conv: Conversation): string {
    if ((["Ученик", "Учител"] as string[]).includes(conv.otherUserName) && conv.otherUserEmail) {
        const prefix = conv.otherUserEmail.split("@")[0];
        return prefix || conv.otherUserName;
    }
    return conv.otherUserName;
}

export const Chat = () => {
    const { user, role, currentUserProfile } = useAuth();
    const currentUserAvatarUrl = currentUserProfile?.avatar_url ?? (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ?? null;

    const navigate = useNavigate();
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
    const isNearBottomRef = useRef(true);
    const loadConversationsTimeoutRef = useRef<number | null>(null);
    const scrollTimeoutRef = useRef<number | null>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [showScrollFAB, setShowScrollFAB] = useState(false);
    const [conversationSearch, setConversationSearch] = useState("");
    const [chatHeaderMoreOpen, setChatHeaderMoreOpen] = useState(false);
    const [chatHeaderInfoOpen, setChatHeaderInfoOpen] = useState(false);
    const chatHeaderMoreRef = useRef<HTMLDivElement>(null);
    const chatHeaderInfoRef = useRef<HTMLDivElement>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingDraft, setEditingDraft] = useState("");
    const [messageMenuOpenId, setMessageMenuOpenId] = useState<string | null>(null);
    const messageMenuRef = useRef<HTMLDivElement>(null);
    const [confirmAction, setConfirmAction] = useState<'block' | 'delete_chat' | null>(null);

    useEffect(() => {
        if (!user) {
            navigate("/login", { replace: true });
        }
    }, [user, navigate]);

    // еnable scrolling 
    useEffect(() => {

        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        
        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, []);

    // helper function to check if user is near bottom
    const checkIfNearBottom = useCallback(() => {
        if (!messagesContainerRef.current) return false;
        const container = messagesContainerRef.current;
        const threshold = 100; // pixels from bottom
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    }, []);

    const scrollToBottom = useCallback((force = false) => {
        if (!messagesContainerRef.current) return;
        const container = messagesContainerRef.current;
        
        if (force || isNearBottomRef.current) {
            const scroll = () => {
                if (container) {
                    // direct scroll to bottom
                    container.scrollTop = container.scrollHeight;
                }
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

    // track scroll position with throttle; show/hide scroll-to-bottom FAB
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

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [checkIfNearBottom]);

    useEffect(() => {
        if (messages.length > 0 && !loadingMessages) {
            // clear any pending scroll
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            const scrollAttempts = [0, 50, 100, 200];
            scrollAttempts.forEach((delay) => {
                scrollTimeoutRef.current = window.setTimeout(() => {
                    scrollToBottom(true);
                }, delay);
            });
        }
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [messages.length, loadingMessages, scrollToBottom]);

    const loadConversations = useCallback(async () => {
        if (!user || !role) return;
        
        setLoadingConversations(true);
        try {
            await ensureValidSession();

            // load blocked and hidden so we can filter conversations
            const [blockRes, hiddenRes] = await Promise.all([
                supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id),
                supabase.from("hidden_conversations").select("other_user_id").eq("user_id", user.id),
            ]);
            const blockedIds = new Set(blockRes.error ? [] : (blockRes.data ?? []).map((r: { blocked_id: string }) => r.blocked_id));
            const hiddenOtherIds = new Set(hiddenRes.error ? [] : (hiddenRes.data ?? []).map((r: { other_user_id: string }) => r.other_user_id));

            // get all messages for this user 
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq(role === "student" ? "student_id" : "teacher_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1000); 

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

            // group messages by conversation partner
            const groups = new Map<string, Message[]>();
            data.forEach((msg: Message) => {
                const otherId = role === "student" ? msg.teacher_id : msg.student_id;
                if (!groups.has(otherId)) {
                    groups.set(otherId, []);
                }
                groups.get(otherId)!.push(msg);
            });

            // collect all unique user ids
            const allOtherUserIds = Array.from(new Set(
                Array.from(groups.keys())
            ));

            // batch load user names and avatars
            const userNamesMap = new Map<string, { name: string; email?: string; avatarUrl?: string }>();
            
            if (allOtherUserIds.length > 0) {
                try {
                    if (role === "student") {
                        const { data: teacherData } = await supabase
                            .from('teacher_profiles')
                            .select('user_id, full_name, email, profile_picture')
                            .in('user_id', allOtherUserIds);
                        
                        if (teacherData) {
                            teacherData.forEach((teacher: { user_id: string; full_name?: string | null; email?: string | null; profile_picture?: string | null }) => {
                                if (teacher.user_id) {
                                    userNamesMap.set(teacher.user_id, {
                                        name: teacher.full_name || "Учител",
                                        email: teacher.email ?? undefined,
                                        avatarUrl: teacher.profile_picture ?? undefined
                                    });
                                }
                            });
                        }
                    }
                    
                    const missingIds = allOtherUserIds.filter(id => !userNamesMap.has(id));
                    if (missingIds.length > 0) {
                        let profileData: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; avatar_url?: string | null }[] | null = null;
                        const { data: withAvatar, error: errAvatar } = await supabase
                            .from('profiles')
                            .select('id, first_name, last_name, email, avatar_url')
                            .in('id', missingIds);
                        if (!errAvatar && withAvatar?.length) {
                            profileData = withAvatar;
                        } else {
                            const { data: noAvatar } = await supabase
                                .from('profiles')
                                .select('id, first_name, last_name, email')
                                .in('id', missingIds);
                            if (noAvatar?.length) profileData = noAvatar;
                        }
                        if (profileData?.length) {
                            profileData.forEach((profile) => {
                                if (profile.id) {
                                    const fromParts = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                                    const name = fromParts || (profile.email?.split('@')[0] || null) || (role === "student" ? "Учител" : "Ученик");
                                    const avatarUrl = 'avatar_url' in profile ? (profile.avatar_url ?? undefined) : undefined;
                                    userNamesMap.set(profile.id, { name, email: profile.email || undefined, avatarUrl });
                                }
                            });
                        }
                        const stillMissing = missingIds.filter(id => !userNamesMap.has(id));
                        for (const uid of stillMissing) {
                            const { data: single } = await supabase
                                .from('profiles')
                                .select('id, first_name, last_name, email, avatar_url')
                                .eq('id', uid)
                                .maybeSingle();
                            if (!single?.id) continue;
                            const { data: singleFallback } = await supabase
                                .from('profiles')
                                .select('id, first_name, last_name, email')
                                .eq('id', uid)
                                .maybeSingle();
                            const row = single ?? singleFallback;
                            if (row?.id) {
                                const fromParts = `${row.first_name || ''} ${row.last_name || ''}`.trim();
                                const name = fromParts || (row.email?.split('@')[0] || null) || (role === "student" ? "Учител" : "Ученик");
                                const avatarUrl = single && 'avatar_url' in single ? (single.avatar_url ?? undefined) : undefined;
                                userNamesMap.set(row.id, { name, email: row.email || undefined, avatarUrl });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error batch loading user names:", err);
                }
            }

            // build conversations
            const convs: Conversation[] = [];
            for (const [otherUserId, msgs] of groups.entries()) {
                if (blockedIds.has(otherUserId) || hiddenOtherIds.has(otherUserId)) continue;
                msgs.sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                const nonDeleted = msgs.filter((m: Message) => !m.deleted_at);
                const lastMsg = nonDeleted[nonDeleted.length - 1] ?? msgs[msgs.length - 1];
                const unreadCount = msgs.filter(m => {
                    if (m.deleted_at) return false;
                    if (role === "student") return m.is_from_student === false && !m.read_by_student_at;
                    return m.is_from_student === true && !m.read_by_teacher_at;
                }).length;

                const userInfo = userNamesMap.get(otherUserId) || {
                    name: role === "student" ? "Учител" : "Ученик",
                    email: undefined,
                    avatarUrl: undefined
                };

                convs.push({
                    otherUserId,
                    otherUserName: userInfo.name,
                    otherUserEmail: userInfo.email,
                    otherUserAvatarUrl: userInfo.avatarUrl,
                    lastMessage: lastMsg?.deleted_at
                        ? "Съобщението е изтрито"
                        : (lastMsg?.message?.trim() || (lastMsg?.attachment_url ? "Прикачен файл" : "")),
                    lastTime: lastMsg?.created_at ?? "",
                    unreadCount,
                });
            }

            // sort by last message time
            convs.sort((a, b) => 
                new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
            );

            setConversations(convs);

            // auto-select first if none selected
            if (!selectedConv && convs.length > 0) {
                setSelectedConv(convs[0]);
            }
        } catch (error) {
            console.error("Failed to load conversations:", error);
            setConversations([]);
        } finally {
            setLoadingConversations(false);
        }
    }, [user, role, selectedConv]);

    // when a conversation is selected try to load profile again
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
                    c.otherUserId === selectedConv.otherUserId
                        ? { ...c, otherUserName: name, otherUserEmail: email ?? c.otherUserEmail, otherUserAvatarUrl: avatarUrl ?? c.otherUserAvatarUrl }
                        : c
                )
            );
            setSelectedConv((prev) =>
                prev?.otherUserId === selectedConv.otherUserId
                    ? { ...prev, otherUserName: name, otherUserEmail: email ?? prev.otherUserEmail, otherUserAvatarUrl: avatarUrl ?? prev.otherUserAvatarUrl }
                    : prev
            );
        })();
        return () => { cancelled = true; };
    }, [selectedConv?.otherUserId, role]);

    // debounced version for real-time updates
    const debouncedLoadConversations = useCallback(() => {
        if (loadConversationsTimeoutRef.current) {
            clearTimeout(loadConversationsTimeoutRef.current);
        }
        loadConversationsTimeoutRef.current = window.setTimeout(() => {
            loadConversations();
        }, 300);
    }, [loadConversations]);

    // cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (loadConversationsTimeoutRef.current) {
                clearTimeout(loadConversationsTimeoutRef.current);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);
    
    const loadMessages = useCallback(async (conv: Conversation) => {
        if (!user || !role || !conv) return;
        
        setLoadingMessages(true);
        try {
            await ensureValidSession();

            let query = supabase.from("messages").select("*");
            if (role === "student") {
                query = query
                    .eq("student_id", user.id)
                    .eq("teacher_id", conv.otherUserId);
            } else {
                query = query
                    .eq("teacher_id", user.id)
                    .eq("student_id", conv.otherUserId);
            }
            
            const { data, error } = await query
                .order("created_at", { ascending: true })
                .limit(500); 

            if (error) {
                console.error("Error loading messages:", error);
                console.error("Error details:", JSON.stringify(error, null, 2));
                console.error("Query params:", { role, userId: user.id, otherUserId: conv.otherUserId });
                setMessages([]);
                return;
            }

            const msgs = (data as Message[]) || [];
            setMessages(msgs);
            
            setTimeout(() => scrollToBottom(true), 100);
            setTimeout(() => scrollToBottom(true), 200);
            setTimeout(() => scrollToBottom(true), 400);

            // mark as read 
            const unreadIds = msgs
                .filter(m => {
                    if (role === "student") {
                        return m.is_from_student === false && !m.read_by_student_at;
                    } else {
                        return m.is_from_student === true && !m.read_by_teacher_at;
                    }
                })
                .map(m => m.id);

            const readAt = new Date().toISOString();
            
            if (unreadIds.length > 0) {
                // mark received messages as read
                const updateData = role === "student" 
                    ? { read_by_student_at: readAt, read_at: readAt } 
                    : { read_by_teacher_at: readAt, read_at: readAt };
                
                const { error: updateError } = await supabase
                    .from("messages")
                    .update(updateData)
                    .in("id", unreadIds);
                
                if (updateError) {
                    console.error("Error updating read status:", updateError);
                } else {
                    // update messages locally
                    setMessages(prev => prev.map(m => {
                        if (unreadIds.includes(m.id)) {
                            if (role === "student") {
                                return { ...m, read_by_student_at: readAt, read_at: readAt };
                            } else {
                                return { ...m, read_by_teacher_at: readAt, read_at: readAt };
                            }
                        }
                        return m;
                    }));
                }
                
                // update conversations unread count locally instead of reloading
                setConversations(prev => prev.map(c => 
                    c.otherUserId === conv.otherUserId 
                        ? { ...c, unreadCount: 0 }
                        : c
                ));
            }

            // mark as read only the received messages

            setTimeout(async () => {
                const { data: refreshedMsgs, error: refreshError } = await supabase
                    .from("messages")
                    .select("*")
                    .eq(role === "student" ? "student_id" : "teacher_id", user.id)
                    .eq(role === "student" ? "teacher_id" : "student_id", conv.otherUserId)
                    .order("created_at", { ascending: true });
                
                if (refreshError) {
                    console.error("Error refreshing messages:", refreshError);
                } else if (refreshedMsgs) {
                    const updatedMessages = refreshedMsgs.map(m => ({
                        ...m,
                        read_by_student_at: m.read_by_student_at || null,
                        read_by_teacher_at: m.read_by_teacher_at || null,
                    })) as Message[];
                    setMessages(updatedMessages);
                }
            }, 1000);
        } catch (error) {
            console.error("Failed to load messages:", error);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, [user, role, scrollToBottom]);

    // initial load
    useEffect(() => {
        if (user && role) {
            loadConversations();
        }
    }, [user, role, loadConversations]);

    // real-time subscription for conversations list updates
    useEffect(() => {
        if (!user || !role) {
            if (conversationsChannelRef.current) {
                supabase.removeChannel(conversationsChannelRef.current);
                conversationsChannelRef.current = null;
            }
            return;
        }

        if (conversationsChannelRef.current) {
            supabase.removeChannel(conversationsChannelRef.current);
        }

        // subscribe to all message changes for this user
        const channel = supabase
            .channel(`conversations-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: role === 'student'
                        ? `student_id=eq.${user.id}`
                        : `teacher_id=eq.${user.id}`
                },
                () => {
                    debouncedLoadConversations();
                }
            )
            .subscribe();

        conversationsChannelRef.current = channel;

        return () => {
            if (conversationsChannelRef.current) {
                supabase.removeChannel(conversationsChannelRef.current);
                conversationsChannelRef.current = null;
            }
        };
    }, [user, role, debouncedLoadConversations]);

        // load messages when conversation changes
    useEffect(() => {
        if (selectedConv && user && role) {
            loadMessages(selectedConv);
        } else {
            setMessages([]);
        }
    }, [selectedConv?.otherUserId, user, role, loadMessages]);

    // real-time subscription for new messages
    useEffect(() => {
        if (!user || !role || !selectedConv) {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            return;
        }

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        // subscribe to new messages
        const channel = supabase
            .channel(`chat-${user.id}-${selectedConv.otherUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: role === 'student'
                        ? `student_id=eq.${user.id}.and.teacher_id=eq.${selectedConv.otherUserId}`
                        : `teacher_id=eq.${user.id}.and.student_id=eq.${selectedConv.otherUserId}`
                },
                async (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => {
                        // avoid duplicate messages
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        // insert in sorted order 
                        const newMessages = [...prev, newMsg];
                        const sorted = newMessages.sort(
                            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );
                        return sorted.slice(-500);
                    });

                    setTimeout(() => scrollToBottom(false), 50);
                    setTimeout(() => scrollToBottom(false), 150);
                    
                    // mark as read if message is for current user
                    const isForMe = role === "student" 
                        ? newMsg.is_from_student === false 
                        : newMsg.is_from_student === true;
                    
                    if (isForMe) {
                        const readAt = new Date().toISOString();
                        const updateData = role === "student"
                            ? { read_by_student_at: readAt, read_at: readAt }
                            : { read_by_teacher_at: readAt, read_at: readAt };
                        
                        await supabase
                            .from("messages")
                            .update(updateData)
                            .eq("id", newMsg.id);
                        
                        // update message locally to show read status
                        setMessages(prev => prev.map(m => {
                            if (m.id === newMsg.id) {
                                if (role === "student") {
                                    return { ...m, read_by_student_at: readAt, read_at: readAt };
                                } else {
                                    return { ...m, read_by_teacher_at: readAt, read_at: readAt };
                                }
                            }
                            return m;
                        }));
                        
                        // update conversations unread count locally
                        setConversations(prev => prev.map(conv => 
                            conv.otherUserId === selectedConv?.otherUserId
                                ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - 1) }
                                : conv
                        ));
                    }
                    
                    debouncedLoadConversations();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: role === 'student'
                        ? `student_id=eq.${user.id}.and.teacher_id=eq.${selectedConv.otherUserId}`
                        : `teacher_id=eq.${user.id}.and.student_id=eq.${selectedConv.otherUserId}`
                },
                async (payload) => {
                    const updatedMsg = payload.new as Message;
                    const oldMsg = payload.old as Message;

                    const readStatusChanged = 
                        (role === "student" && updatedMsg.read_by_teacher_at !== oldMsg.read_by_teacher_at) ||
                        (role === "teacher" && updatedMsg.read_by_student_at !== oldMsg.read_by_student_at);
                    
                    if (readStatusChanged) {
                        setMessages(prev => prev.map(m => {
                            if (m.id === updatedMsg.id) {
                                return {
                                    ...m,
                                    read_by_student_at: updatedMsg.read_by_student_at,
                                    read_by_teacher_at: updatedMsg.read_by_teacher_at,
                                    read_at: updatedMsg.read_at // backward compatibility
                                };
                            }
                            return m;
                        }));
                        
                        // also reload all messages to ensure we have the latest status
                        setTimeout(async () => {
                            const { data: refreshedMsgs } = await supabase
                                .from("messages")
                                .select("*")
                                .eq(role === "student" ? "student_id" : "teacher_id", user.id)
                                .eq(role === "student" ? "teacher_id" : "student_id", selectedConv.otherUserId)
                                .order("created_at", { ascending: true });
                            
                            if (refreshedMsgs) {
                                // force update with new array reference and ensure all fields are present
                                const updatedMessages = refreshedMsgs.map(m => ({
                                    ...m,
                                    read_by_student_at: m.read_by_student_at || null,
                                    read_by_teacher_at: m.read_by_teacher_at || null,
                                })) as Message[];
                                setMessages(updatedMessages);
                            }
                        }, 300);
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
        try {
            await ensureValidSession();

            let attachmentUrl: string | null = null;
            if (attachmentFile) {
                const safeName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                const storagePath = `${user.id}/${Date.now()}_${safeName}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("chat-attachments")
                    .upload(storagePath, attachmentFile, { upsert: false });
                if (uploadError) {
                    console.error("Error uploading attachment:", uploadError);
                    alert(`Грешка при качване на файла: ${uploadError.message}`);
                    setSending(false);
                    return;
                }
                const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(uploadData.path);
                attachmentUrl = urlData.publicUrl;
            }

            const payload = {
                student_id: role === "student" ? user.id : selectedConv.otherUserId,
                teacher_id: role === "student" ? selectedConv.otherUserId : user.id,
                message: newMessage.trim() || "",
                is_from_student: role === "student",
                ...(attachmentUrl && { attachment_url: attachmentUrl }),
            };

            const { data, error } = await supabase
                .from("messages")
                .insert(payload)
                .select("*")
                .single();

            if (error) {
                console.error("Error sending message:", error);
                const isBlocked = error.code === 'P0001' || (error.message && error.message.includes('блокирал'));
                alert(isBlocked
                    ? 'Не можете да изпращате съобщения – получателят ви е блокирал.'
                    : `Грешка при изпращане: ${error.message || 'Неизвестна грешка'}`);
                return;
            }

            if (data) {
                setNewMessage("");
                setAttachmentFile(null);
                setMessages(prev => {
                    // avoid duplicate messages
                    if (prev.some(m => m.id === data.id)) return prev;
                    // insert in sorted order
                    const newMessages = [...prev, data as Message];
                    const sorted = newMessages.sort(
                        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                    // limit to last 500 messages for performance
                    return sorted.slice(-500);
                });

                const { error: hideErr } = await supabase.from("hidden_conversations").delete().eq("user_id", user.id).eq("other_user_id", selectedConv.otherUserId);
                if (hideErr) console.warn("Un-hide conversation:", hideErr);
                loadConversations();
                // scroll to bottom after sending with multiple attempts
                setTimeout(() => scrollToBottom(true), 50);
                setTimeout(() => scrollToBottom(true), 150);
                setTimeout(() => scrollToBottom(true), 300);
            }
        } catch (error: any) {
            console.error("Failed to send:", error);
            alert(`Грешка: ${error?.message || 'Неизвестна грешка'}`);
        } finally {
            setSending(false);
        }
    }, [user, role, selectedConv, newMessage, sending, scrollToBottom, loadConversations]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleAttachmentClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setAttachmentFile(file ?? null);
        e.target.value = "";
    }, []);

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
                .update({
                    message: trimmed,
                    updated_at: new Date().toISOString(),
                    is_edited: true,
                })
                .eq("id", editingMessageId);

            if (error) {
                console.error("Error editing message:", error);
                alert(`Грешка при запазване: ${error.message}`);
                return;
            }
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === editingMessageId
                        ? { ...m, message: trimmed, updated_at: new Date().toISOString(), is_edited: true }
                        : m
                )
            );
            setEditingMessageId(null);
            setEditingDraft("");
        } catch (e: unknown) {
            console.error(e);
            alert("Грешка при запазване.");
        }
    }, [editingMessageId, editingDraft, user]);

    const handleEditCancel = useCallback(() => {
        setEditingMessageId(null);
        setEditingDraft("");
    }, []);

    const handleDeleteMessage = useCallback(
        async (msg: Message) => {
            setMessageMenuOpenId(null);
            if (!window.confirm("Изтриване на съобщението?")) return;
            try {
                const { error } = await supabase
                    .from("messages")
                    .update({ deleted_at: new Date().toISOString() })
                    .eq("id", msg.id);

                if (error) {
                    console.error("Error deleting message:", error);
                    alert(`Грешка при изтриване: ${error.message}`);
                    return;
                }
                setMessages((prev) =>
                    prev.map((m) => (m.id === msg.id ? { ...m, deleted_at: new Date().toISOString() } : m))
                );
                debouncedLoadConversations();
            } catch (e: unknown) {
                console.error(e);
                alert("Грешка при изтриване.");
            }
        },
        [debouncedLoadConversations]
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (messageMenuRef.current && !messageMenuRef.current.contains(e.target as Node)) {
                setMessageMenuOpenId(null);
            }
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
    }, [selectedConv?.otherUserId]);

    const handleBlockUser = async () => {
        if (!user || !selectedConv) return;
        const { error } = await supabase.from("blocked_users").insert({
            blocker_id: user.id,
            blocked_id: selectedConv.otherUserId,
        });
        if (error) {
            console.error("Block user error:", error);
            alert("Неуспешно блокиране. Проверете дали таблицата blocked_users съществува в Supabase.");
            return;
        }
        setConfirmAction(null);
        setChatHeaderMoreOpen(false);
        setSelectedConv(null);
        debouncedLoadConversations();
    };

    const handleDeleteChat = async () => {
        if (!user || !selectedConv) return;
        const { error } = await supabase.from("hidden_conversations").insert({
            user_id: user.id,
            other_user_id: selectedConv.otherUserId,
        });
        if (error) {
            console.error("Hide conversation error:", error);
            alert("Неуспешно изтриване на чата. Проверете дали таблицата hidden_conversations съществува в Supabase.");
            return;
        }
        setConfirmAction(null);
        setChatHeaderMoreOpen(false);
        setSelectedConv(null);
        debouncedLoadConversations();
    };

    const EMOJI_LIST = ["😀", "😊", "😂", "👍", "❤️", "😍", "🙏", "😅", "😢", "😡", "👎", "✨", "🔥", "🎉", "💯", "👋", "😎", "🥳", "🤔", "💪"];

    const formatTime = useCallback((iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        if (msgDate.getTime() === today.getTime()) {
            return d.toLocaleTimeString("bg-BG", {
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        return d.toLocaleDateString("bg-BG", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    }, []);

    // filter conversations by search (name or last message)
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

    const formatDateShort = useCallback((iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        if (msgDate.getTime() === today.getTime()) return "Днес";
        if (msgDate.getTime() === yesterday.getTime()) return "Вчера";
        return d.toLocaleDateString("bg-BG", {
            day: "numeric",
            month: "short",
        });
    }, []);

    const formatFullDate = useCallback((iso: string) => {
        return new Date(iso).toLocaleString("bg-BG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }, []);


    if (!user || !role) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-500">Зареждане...</p>
                </div>
            </div>
        );
    }

    const isStudent = useMemo(() => role === "student", [role]);

    const MessageStatus = ({ message }: { message: Message }) => {
        const isMine = isStudent ? message.is_from_student : !message.is_from_student;
        if (!isMine) return null;
        const readStatus = isStudent ? message.read_by_teacher_at : message.read_by_student_at;
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
    };

    const groupMessagesByDate = useCallback((msgs: Message[]) => {
        const groups: { [key: string]: Message[] } = {};
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        msgs.forEach(msg => {
            const msgDate = new Date(msg.created_at);
            const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
            
            let dateKey: string;
            if (msgDateOnly.getTime() === today.getTime()) {
                dateKey = 'today';
            } else if (msgDateOnly.getTime() === yesterday.getTime()) {
                dateKey = 'yesterday';
            } else {
                dateKey = msgDateOnly.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });
            }
            
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(msg);
        });

        return groups;
    }, []);

    const formatDateLabel = useCallback((dateKey: string) => {
        if (dateKey === 'today') return 'Днес';
        if (dateKey === 'yesterday') return 'Вчера';
        return dateKey;
    }, []);

    // group consecutive messages from same sender 
    const GROUP_MAX_MINUTES = 5;
    const groupMessagesBySender = useCallback((msgs: Message[], student: boolean) => {
        if (msgs.length === 0) return [];
        const result: { isMine: boolean; messages: Message[] }[] = [];
        let current: { isMine: boolean; messages: Message[] } = {
            isMine: student ? msgs[0].is_from_student : !msgs[0].is_from_student,
            messages: [msgs[0]],
        };
        for (let i = 1; i < msgs.length; i++) {
            const msg = msgs[i];
            const isMine = student ? msg.is_from_student : !msg.is_from_student;
            const prevTime = new Date(msgs[i - 1].created_at).getTime();
            const currTime = new Date(msg.created_at).getTime();
            const sameSender = isMine === current.isMine;
            const withinMinutes = (currTime - prevTime) / (60 * 1000) <= GROUP_MAX_MINUTES;
            if (sameSender && withinMinutes) {
                current.messages.push(msg);
            } else {
                result.push(current);
                current = { isMine, messages: [msg] };
            }
        }
        result.push(current);
        return result;
    }, []);

    // focus input when opening a chat
    useEffect(() => {
        if (selectedConv && inputRef.current) {
            inputRef.current.focus();
        }
    }, [selectedConv?.otherUserId]);

    const handleScrollToBottomClick = useCallback(() => {
        scrollToBottom(true);
        setShowScrollFAB(false);
    }, [scrollToBottom]);

    // close chat header "more" dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (chatHeaderMoreRef.current && !chatHeaderMoreRef.current.contains(e.target as Node)) {
                setChatHeaderMoreOpen(false);
            }
        };
        if (chatHeaderMoreOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [chatHeaderMoreOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setEmojiPickerOpen(false);
            }
        };
        if (emojiPickerOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [emojiPickerOpen]);

    useEffect(() => {
        setAttachmentFile(null);
        setEmojiPickerOpen(false);
    }, [selectedConv?.otherUserId]);

    return (
        <div className="flex-1 min-h-0 w-full flex flex-col md:flex-row overflow-hidden chat-page h-full">
            {/* left sidebar - conversations list */}
            <aside
                className={`chat-sidebar-aside w-full md:w-[360px] lg:w-[400px] xl:w-[420px] h-full min-h-0 max-h-[100dvh] flex flex-col shrink-0 ${selectedConv ? "hidden md:flex" : "flex"}`}
                aria-label="Списък със съобщения"
            >
                <div className="chat-sidebar-top shrink-0 flex flex-col z-10">
                    <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 safe-area-sidebar">
                        <h1 className="text-[20px] sm:text-[22px] font-semibold text-slate-900 tracking-tight">
                            Съобщения
                        </h1>
                        <p className="text-[12px] sm:text-[13px] text-slate-400 mt-1.5">
                            {conversations.length === 0
                                ? "Все още нямате чатове"
                                : `${conversations.length} ${conversations.length === 1 ? "чат" : "чата"}`}
                        </p>
                    </div>
                    {conversations.length > 0 && (
                        <div className="px-3 sm:px-4 pb-4 sm:pb-5 pt-1 sm:pt-2">
                            <div className="chat-sidebar-search-wrap">
                                <span className="chat-sidebar-search-icon" aria-hidden>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="search"
                                    value={conversationSearch}
                                    onChange={(e) => setConversationSearch(e.target.value)}
                                    placeholder="Търси по име или съобщение..."
                                    className="chat-sidebar-search w-full rounded-lg text-slate-800 text-[14px] sm:text-[15px] placeholder:text-slate-400 focus:outline-none"
                                    aria-label="Търси разговори"
                                    autoComplete="off"
                                />
                                {conversationSearch ? (
                                    <button
                                        type="button"
                                        onClick={() => setConversationSearch("")}
                                        className="chat-sidebar-search-clear"
                                        aria-label="Изчисти търсенето"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden chat-sidebar-scroll overscroll-contain">
                    {loadingConversations ? (
                        <div className="py-2 px-2 sm:px-3 mt-3 sm:mt-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 rounded-xl mx-0.5 sm:mx-1 mb-1.5 sm:mb-2">
                                    <div className="chat-skeleton-avatar w-11 h-11 sm:w-12 sm:h-12 rounded-full shrink-0" />
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="chat-skeleton-line h-3.5 w-2/3 rounded-md" />
                                        <div className="chat-skeleton-line h-3 w-1/2 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="h-full flex items-center justify-center px-4 sm:px-5 text-center min-h-[180px] py-6 chat-sidebar-empty">
                            <div className="max-w-[200px]">
                                <div className="chat-empty-icon-wrap w-11 h-11 rounded-lg flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-[13px] font-medium text-slate-600 mb-0.5">Все още няма разговори</p>
                                <p className="text-[12px] text-slate-400 leading-relaxed">
                                    {isStudent ? "Започнете разговор от профил на учител." : "Учениците ще могат да ви пишат от вашия профил."}
                                </p>
                            </div>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="px-4 sm:px-6 py-8 text-center">
                            <p className="text-[12px] sm:text-[13px] text-slate-500">Няма намерени разговори</p>
                            <button
                                type="button"
                                onClick={() => setConversationSearch("")}
                                className="mt-2 text-[13px] font-medium text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Изчисти търсенето
                            </button>
                        </div>
                    ) : (
                        <div className="py-2 px-2 sm:px-3 mt-3 sm:mt-4 pb-3 sm:pb-4">
                            {filteredConversations.map((conv) => {
                                const isActive = selectedConv?.otherUserId === conv.otherUserId;
                                const hasUnread = conv.unreadCount > 0;
                                return (
                                    <button
                                        key={conv.otherUserId}
                                        onClick={() => setSelectedConv(conv)}
                                        className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-3 sm:gap-4 text-left chat-conv-item rounded-xl mx-0.5 sm:mx-1 min-h-[72px] sm:min-h-0 touch-manipulation ${isActive ? "chat-conv-item-active" : ""}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <AvatarImage
                                                url={conv.otherUserAvatarUrl}
                                                fallback={
                                                    <div className="chat-avatar w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-[14px] sm:text-[15px] font-semibold">
                                                        {getDisplayName(conv).charAt(0).toUpperCase()}
                                                    </div>
                                                }
                                                imgClassName="chat-avatar w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover"
                                            />
                                            {hasUnread && conv.unreadCount === 1 && (
                                                <span className="chat-unread-dot absolute top-0 right-0 w-2.5 h-2.5 rounded-full" title="1 непрочетено" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
                                                <span className={`text-[14px] sm:text-[15px] truncate font-semibold ${hasUnread ? "text-slate-900" : "text-slate-800"}`}>
                                                    {getDisplayName(conv)}
                                                </span>
                                                <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 min-w-[2.25rem] sm:min-w-[2.5rem] text-right" title={conv.lastTime}>
                                                    {formatDateShort(conv.lastTime)}
                                                </span>
                                            </div>
                                            <p className={`text-[11px] sm:text-[12px] truncate mt-0.5 block ${hasUnread ? "text-slate-500 font-medium" : "text-slate-400"}`}>
                                                {conv.lastMessage || "Няма съобщения"}
                                            </p>
                                        </div>
                                        {hasUnread && conv.unreadCount > 1 && (
                                            <span className="chat-unread-badge shrink-0 min-w-[20px] sm:min-w-[22px] h-5 sm:h-6 px-1.5 sm:px-2 rounded-full text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
                                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>

            {/* right chat area */}
            <main className={`flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden chat-main-panel transition-all duration-300 ${!selectedConv ? "hidden md:flex" : "flex"}`}>
                {selectedConv ? (
                    <div className="chat-right-grid h-full min-h-0 flex flex-col bg-white">
                        {/* chat header */}
                        <header className="chat-header-bar flex-none px-4 py-3 flex items-center gap-3 min-h-[56px]">
                            <button
                                type="button"
                                onClick={() => setSelectedConv(null)}
                                className="md:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                aria-label="Назад към списъка"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="chat-header-avatar-wrap relative flex-shrink-0 rounded-full w-9 h-9">
                                <AvatarImage
                                    url={selectedConv.otherUserAvatarUrl}
                                    fallback={
                                        <div className="chat-header-avatar w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-semibold bg-slate-400">
                                            {getDisplayName(selectedConv).charAt(0).toUpperCase()}
                                        </div>
                                    }
                                    imgClassName="chat-header-avatar w-9 h-9 rounded-full object-cover"
                                />
                                <span className="chat-header-status-dot absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white" title="Онлайн" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-[15px] font-semibold text-slate-900 truncate">
                                    {getDisplayName(selectedConv)}
                                </h2>
                                <p className="text-[12px] text-slate-500 truncate mt-0.5">
                                    Онлайн
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mr-6">
                                <button
                                    type="button"
                                    onClick={() => { setChatHeaderMoreOpen(false); setChatHeaderInfoOpen((v) => !v); }}
                                    className={`chat-header-btn p-3.5 rounded-xl text-slate-500 ${chatHeaderInfoOpen ? "bg-slate-100 text-slate-700" : ""}`}
                                    aria-label="Информация"
                                    title="Информация за разговора"
                                    aria-expanded={chatHeaderInfoOpen}
                                >
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                                <div className="relative" ref={chatHeaderMoreRef}>
                                    <button
                                        type="button"
                                        onClick={() => setChatHeaderMoreOpen((v) => !v)}
                                        className="chat-header-btn p-3.5 rounded-xl text-slate-500"
                                        aria-label="Още"
                                        aria-expanded={chatHeaderMoreOpen}
                                    >
                                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                        </svg>
                                    </button>
                                    {chatHeaderMoreOpen && (
                                        <div className="chat-header-more-dropdown absolute right-0 top-full mt-2 py-2 min-w-[200px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                                            {isStudent && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setChatHeaderMoreOpen(false); navigate(`/teacher/${selectedConv.otherUserId}`); }}
                                                    className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                                >
                                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    </span>
                                                    Виж профил
                                                </button>
                                            )}
                                            <div className="my-1 border-t border-slate-100" />
                                            <button
                                                type="button"
                                                onClick={() => { setChatHeaderMoreOpen(false); setConfirmAction('block'); }}
                                                className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                            >
                                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                </span>
                                                Блокирай
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setChatHeaderMoreOpen(false); setConfirmAction('delete_chat'); }}
                                                className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                            >
                                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </span>
                                                Изтрий чат
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* confirmation modal for block / delete chat */}
                        {confirmAction && selectedConv && (
                            <>
                                <div className="fixed inset-0 bg-black/30 z-40" aria-hidden onClick={() => setConfirmAction(null)} />
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
                                        <h3 id="confirm-title" className="text-base font-semibold text-slate-900">
                                            {confirmAction === 'block' ? 'Блокиране на потребител' : 'Изтриване на чат'}
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-600">
                                            {confirmAction === 'block'
                                                ? `Сигурни ли сте, че искате да блокирате ${getDisplayName(selectedConv)}? Няма да получавате съобщения от този потребител.`
                                                : 'Сигурни ли сте? Разговорът ще бъде премахнат от списъка. Съобщенията остават запазени.'}
                                        </p>
                                        <div className="mt-5 flex gap-3 justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setConfirmAction(null)}
                                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                            >
                                                Отказ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={confirmAction === 'block' ? handleBlockUser : handleDeleteChat}
                                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                                            >
                                                {confirmAction === 'block' ? 'Блокирай' : 'Изтрий чат'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* info panel (slide-in) */}
                        {chatHeaderInfoOpen && selectedConv && (
                                            <>
                                                <div
                                                    className="fixed inset-0 bg-black/20 z-40 md:bg-transparent"
                                                    aria-hidden
                                                    onClick={() => setChatHeaderInfoOpen(false)}
                                                />
                                                <div
                                                    ref={chatHeaderInfoRef}
                                                    className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl z-50 flex flex-col border-l border-slate-200 chat-info-panel"
                                                    role="dialog"
                                                    aria-label="Информация за разговора"
                                                >
                                                    <div className="flex items-center justify-between p-4 border-b border-slate-200">
                                                        <h3 className="text-base font-semibold text-slate-900">Информация</h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => setChatHeaderInfoOpen(false)}
                                                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                                            aria-label="Затвори"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                    <div className="p-4 flex-1 overflow-auto">
                                                        <div className="flex flex-col items-center text-center mb-6">
                                                            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-slate-200 mb-3">
                                                                <AvatarImage
                                                                    url={selectedConv.otherUserAvatarUrl}
                                                                    fallback={
                                                                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-600 text-xl font-semibold">
                                                                            {getDisplayName(selectedConv).charAt(0).toUpperCase()}
                                                                        </div>
                                                                    }
                                                                    imgClassName="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <h4 className="text-lg font-semibold text-slate-900">{getDisplayName(selectedConv)}</h4>
                                                            {selectedConv.otherUserEmail && (
                                                                <p className="text-sm text-slate-500 mt-0.5 break-all">{selectedConv.otherUserEmail}</p>
                                                            )}
                                                        </div>
                                                        {isStudent && (
                                                            <button
                                                                type="button"
                                                                onClick={() => { setChatHeaderInfoOpen(false); navigate(`/teacher/${selectedConv.otherUserId}`); }}
                                                                className="w-full py-3 px-4 rounded-lg bg-slate-100 text-slate-800 font-medium text-sm hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                Виж профил на учителя
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                        {/* messages area */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden chat-messages-scroll px-4 py-4 relative basis-0"
                        >
                            <div className="chat-message-column w-full min-h-full max-w-3xl ml-auto pr-0">
                            {loadingMessages ? (
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
                            ) : messages.length === 0 ? (
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
                            ) : (
                                <div className="w-full space-y-0 pb-2">
                                    {Object.entries(groupMessagesByDate(messages)).map(([dateKey, dateMessages]) => (
                                        <div key={dateKey} className="chat-date-group">
                                            <div className="chat-date-separator gap-3">
                                                <span className="chat-date-line" aria-hidden />
                                                <span className="chat-date-pill shrink-0">
                                                    {formatDateLabel(dateKey)}
                                                </span>
                                                <span className="chat-date-line" aria-hidden />
                                            </div>
                                            {groupMessagesBySender(dateMessages, isStudent).map((group, gIdx) => (
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
                                                            const readKey = isStudent ? msg.read_by_teacher_at : msg.read_by_student_at;
                                                            const isEditing = editingMessageId === msg.id;
                                                            const isDeleted = !!msg.deleted_at;
                                                            return (
                                                                <div
                                                                    key={`${msg.id}-${readKey || "unread"}`}
                                                                    className={`flex items-end gap-1.5 ${group.isMine ? "justify-end" : "justify-start"} ${mIdx > 0 ? "mt-2.5" : ""} group/row`}
                                                                >
                                                                    {group.isMine && !isDeleted && !isEditing && (
                                                                        <div className="opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0 flex items-center pb-1 relative" ref={messageMenuOpenId === msg.id ? messageMenuRef : undefined}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setMessageMenuOpenId((id) => (id === msg.id ? null : msg.id))}
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
                                                                                    <button type="button" onClick={() => handleDeleteMessage(msg)} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2">
                                                                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                                        Изтрий
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div className={`shrink-0 max-w-full px-5 py-4 text-[17px] leading-[1.5] relative ${group.isMine ? "chat-bubble-mine" : "chat-bubble-other"}`}>
                                                                        {isDeleted ? (
                                                                            <p className="text-[15px] italic opacity-80">{group.isMine ? "Съобщението е изтрито" : "Съобщението е изтрито"}</p>
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
                                                                                    <button type="button" onClick={handleEditCancel} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/20">
                                                                                        Отказ
                                                                                    </button>
                                                                                    <button type="button" onClick={handleEditSave} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/30 hover:bg-white/40 text-white">
                                                                                        Запази
                                                                                    </button>
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
                                                                                            <a
                                                                                                href={msg.attachment_url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors max-w-full ${group.isMine ? "bg-white/20 text-white hover:bg-white/30 ring-1 ring-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-200/80"}`}
                                                                                            >
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
                                                                                {msg.is_edited && <span className="text-[11px] opacity-75">редактирано</span>}
                                                                                <span className="text-[13px] font-medium tabular-nums" title={formatFullDate(msg.created_at)}>
                                                                                    {formatTime(msg.created_at)}
                                                                                </span>
                                                                                {group.isMine && !isDeleted && <MessageStatus message={msg} />}
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
                                                                        {(currentUserProfile?.first_name?.charAt(0) ?? (user?.user_metadata as { first_name?: string } | undefined)?.first_name?.charAt(0))?.toUpperCase() ||
                                                                            user?.email?.charAt(0).toUpperCase() ||
                                                                            "?"}
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
                            )}
                            </div>
                            {showScrollFAB && messages.length > 0 && (
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

                        {/* Input area */}
                        <div className="chat-input-wrap flex-none px-4 pb-5 pt-4 w-full border-t border-slate-200/80">
                            <div className="chat-input-inner w-full max-w-3xl mx-auto">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    onChange={handleFileChange}
                                    aria-hidden
                                />
                                <div className="chat-input-row flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-200/50 focus-within:shadow-sm transition-all duration-200">
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
                                        className="chat-send-btn shrink-0 min-w-[100px] h-12 px-5 rounded-lg text-[15px] font-semibold flex items-center justify-center gap-2 disabled:cursor-not-allowed"
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
                                            Прикачен: {attachmentFile.name}
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
                                <p className="chat-input-hint mt-1.5 pl-1 text-[12px] text-slate-400">Enter за изпращане</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center px-6 chat-empty-panel min-h-0">
                        <div className="max-w-[220px]">
                            <div className="chat-empty-icon-wrap w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                </svg>
                            </div>
                            <p className="text-[15px] font-semibold text-slate-800 mb-1">Изберете чат</p>
                            <p className="text-[13px] text-slate-500 leading-relaxed">Изберете разговор от списъка, за да видите съобщения</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
