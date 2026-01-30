import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
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
}

interface Conversation {
    otherUserId: string;
    otherUserName: string;
    otherUserEmail?: string;
    lastMessage: string;
    lastTime: string;
    unreadCount: number;
}

export const Chat = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const messagesContainerRef = useRef<HTMLDivElement>(null);
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

    // track scroll position with throttle
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    isNearBottomRef.current = checkIfNearBottom();
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

            // batch load all user names
            const userNamesMap = new Map<string, { name: string; email?: string }>();
            
            if (allOtherUserIds.length > 0) {
                try {
                    if (role === "student") {
                        // get teacher name
                        const { data: teacherData } = await supabase
                            .from('teacher_profiles')
                            .select('user_id, full_name, email')
                            .in('user_id', allOtherUserIds);
                        
                        if (teacherData) {
                            teacherData.forEach(teacher => {
                                if (teacher.user_id) {
                                    userNamesMap.set(teacher.user_id, {
                                        name: teacher.full_name || "Учител",
                                        email: teacher.email
                                    });
                                }
                            });
                        }
                    }
                    
                    const missingIds = allOtherUserIds.filter(id => !userNamesMap.has(id));
                    if (missingIds.length > 0) {
                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('id, first_name, last_name, email')
                            .in('id', missingIds);
                        
                        if (profileData) {
                            profileData.forEach(profile => {
                                if (profile.id) {
                                    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                                    const name = fullName || profile.email?.split('@')[0] || (role === "student" ? "Учител" : "Ученик");
                                    userNamesMap.set(profile.id, {
                                        name,
                                        email: profile.email
                                    });
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error batch loading user names:", err);
                }
            }

            // build conversations
            const convs: Conversation[] = [];
            for (const [otherUserId, msgs] of groups.entries()) {
                // sort messages by time
                msgs.sort((a, b) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                
                const lastMsg = msgs[msgs.length - 1];
                
                const unreadCount = msgs.filter(m => {
                    if (role === "student") {
                        return m.is_from_student === false && !m.read_by_student_at;
                    } else {

                        return m.is_from_student === true && !m.read_by_teacher_at;
                    }
                }).length;

                // get user name from map
                const userInfo = userNamesMap.get(otherUserId) || {
                    name: role === "student" ? "Учител" : "Ученик",
                    email: undefined
                };

                convs.push({
                    otherUserId,
                    otherUserName: userInfo.name,
                    otherUserEmail: userInfo.email,
                    lastMessage: lastMsg.message || "",
                    lastTime: lastMsg.created_at,
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
            

            const ourSentMessages = msgs.filter(m => 
                role === "student" ? m.is_from_student : !m.is_from_student
            );
            
            const ourSentUnreadIds = ourSentMessages
                .filter(m => {
                    if (role === "student") {
                        return !m.read_by_teacher_at;
                    } else {
                        return !m.read_by_student_at;
                    }
                })
                .map(m => m.id);
            
            if (ourSentUnreadIds.length > 0) {
                const updateSentData = role === "student"
                    ? { read_by_teacher_at: readAt, read_at: readAt }
                    : { read_by_student_at: readAt, read_at: readAt };
                
                const { error: sentUpdateError } = await supabase
                    .from("messages")
                    .update(updateSentData)
                    .in("id", ourSentUnreadIds);
                
                if (sentUpdateError) {
                    console.error("Error updating sent messages read status:", sentUpdateError);
                } else {
                    // update locally
                    setMessages(prev => prev.map(m => {
                        if (ourSentUnreadIds.includes(m.id)) {
                            if (role === "student") {
                                return { ...m, read_by_teacher_at: readAt, read_at: readAt };
                            } else {
                                return { ...m, read_by_student_at: readAt, read_at: readAt };
                            }
                        }
                        return m;
                    }));
                }
            }
            
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
                        setMessages(prev => {
                            const updated = prev.map(m => {
                                if (m.id === newMsg.id) {
                                    if (role === "student") {
                                        return { ...m, read_by_student_at: readAt, read_at: readAt };
                                    } else {
                                        return { ...m, read_by_teacher_at: readAt, read_at: readAt };
                                    }
                                }
                                return m;
                            });
                            
                            const ourSentUnread = updated.filter((m: Message) => {
                                const isOurSent = role === "student" ? m.is_from_student : !m.is_from_student;
                                if (!isOurSent) return false;
                                if (role === "student") {
                                    return !m.read_by_teacher_at;
                                } else {
                                    return !m.read_by_student_at;
                                }
                            });
                            
                            if (ourSentUnread.length > 0) {
                                const updateSentData = role === "student"
                                    ? { read_by_teacher_at: readAt, read_at: readAt }
                                    : { read_by_student_at: readAt, read_at: readAt };
                                
                                supabase
                                    .from("messages")
                                    .update(updateSentData)
                                    .in("id", ourSentUnread.map((m: Message) => m.id))
                                    .then(() => {
                                        setMessages(prevMsgs => prevMsgs.map((m: Message) => {
                                            if (ourSentUnread.some((msg: Message) => msg.id === m.id)) {
                                                if (role === "student") {
                                                    return { ...m, read_by_teacher_at: readAt, read_at: readAt };
                                                } else {
                                                    return { ...m, read_by_student_at: readAt, read_at: readAt };
                                                }
                                            }
                                            return m;
                                        }));
                                    });
                            }
                            
                            return updated;
                        });
                        
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
        if (!user || !role || !selectedConv || !newMessage.trim() || sending) return;
        
        setSending(true);
        try {
            await ensureValidSession();

            const payload = {
                student_id: role === "student" ? user.id : selectedConv.otherUserId,
                teacher_id: role === "student" ? selectedConv.otherUserId : user.id,
                message: newMessage.trim(),
                is_from_student: role === "student",
            };

            const { data, error } = await supabase
                .from("messages")
                .insert(payload)
                .select("*")
                .single();

            if (error) {
                console.error("Error sending message:", error);
                console.error("Error details:", JSON.stringify(error, null, 2));
                console.error("Payload:", payload);
                alert(`Грешка при изпращане: ${error.message || 'Неизвестна грешка'}`);
                return;
            }

            if (data) {
                setNewMessage("");
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
                
                // scroll to bottom after sending with multiple attempts
                setTimeout(() => scrollToBottom(true), 50);
                setTimeout(() => scrollToBottom(true), 150);
                setTimeout(() => scrollToBottom(true), 300);
                
                debouncedLoadConversations();
            }
        } catch (error: any) {
            console.error("Failed to send:", error);
            alert(`Грешка: ${error?.message || 'Неизвестна грешка'}`);
        } finally {
            setSending(false);
        }
    }, [user, role, selectedConv, newMessage, sending, scrollToBottom, debouncedLoadConversations]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

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


    if (!user || !role) {
        return (
            <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-slate-700">Зареждане...</p>
                </div>
            </div>
        );
    }

    const isStudent = useMemo(() => role === "student", [role]);

    // message status
    const MessageStatus = ({ message }: { message: Message }) => {
        const isMine = isStudent ? message.is_from_student : !message.is_from_student;
        
        if (!isMine) return null; 
        

        const readStatus = isStudent ? message.read_by_teacher_at : message.read_by_student_at;
        const shouldShowRead = !!(readStatus && typeof readStatus === 'string' && readStatus.length > 0);
        
        return (
            <span className="ml-1.5 inline-flex items-center" key={`status-${message.id}-${readStatus || 'unread'}`}>
                {shouldShowRead ? (
                    <span className="inline-flex items-center -space-x-0.5">
                        <svg className="w-4 h-4 text-purple-200" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="w-4 h-4 text-purple-200" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </span>
                ) : (
                    <svg className="w-3.5 h-3.5 text-purple-200/70" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
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

    return (
        <div 
            className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20"
            style={{ 
                position: 'relative',
                overflowY: 'auto',
                overflowX: 'hidden',
                height: '100vh'
            }}
        >
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div className="max-w-5xl w-full h-[90vh] flex shadow-2xl rounded-3xl overflow-hidden bg-white">
                {/* left sidebar */}
                <div className="w-80 bg-white/98 backdrop-blur-xl rounded-l-3xl shadow-xl border-r border-purple-200/60 flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-purple-100/60 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white shadow-lg">
                        <h2 className="text-lg font-bold mb-1">
                            Съобщения
                        </h2>
                        <p className="text-xs text-purple-100/90">
                            {conversations.length === 0
                                ? "Все още нямате чатове"
                                : `${conversations.length} ${conversations.length === 1 ? 'чат' : 'чата'}`}
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loadingConversations ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-4 h-4 border-2 border-purple-900 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[10px] text-slate-600 font-semibold">Зареждане...</p>
                                </div>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="h-full flex items-center justify-center px-2 text-center">
                                <div>
                                    <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-slate-500 font-semibold mb-1">Няма чатове</p>
                                    <p className="text-[10px] text-slate-400">
                                        {isStudent 
                                            ? "Започнете разговор от профил на учител." 
                                            : "Учениците ще могат да ви пишат от вашия профил."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const isActive = selectedConv?.otherUserId === conv.otherUserId;
                                return (
                                    <button
                                        key={conv.otherUserId}
                                        onClick={() => setSelectedConv(conv)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 border-b border-purple-50/50 text-left transition-all duration-200 hover:bg-purple-50/40 ${
                                            isActive 
                                                ? "bg-gradient-to-r from-purple-50 to-purple-100/50 border-l-4 border-l-purple-600 shadow-sm" 
                                                : "bg-transparent"
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg ring-2 ring-purple-200/50">
                                            {conv.otherUserName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className={`text-sm font-bold truncate ${
                                                    isActive ? "text-purple-900" : "text-slate-900"
                                                }`}>
                                                    {conv.otherUserName}
                                                </p>
                                                <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                                                    {formatDateShort(conv.lastTime)}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate ${
                                                isActive ? "text-slate-600" : "text-slate-500"
                                            }`}>
                                                {conv.lastMessage || "Няма съобщения"}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <div className="ml-1 flex-shrink-0">
                                                <span className="px-2 py-1 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold shadow-md min-w-[20px] text-center">
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* right chat area */}
                <div className="flex-1 bg-white/95 backdrop-blur-xl rounded-r-3xl shadow-2xl border-l border-purple-200/50 flex flex-col overflow-hidden">
                    {selectedConv ? (
                        <>
                            <div className="px-5 py-4 border-b border-purple-100/50 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-base font-bold ring-2 ring-white/30 shadow-lg">
                                        {selectedConv.otherUserName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-base font-bold text-white">
                                            {selectedConv.otherUserName}
                                        </h2>
                                        {selectedConv.otherUserEmail && (
                                            <p className="text-xs text-purple-100/90 mt-0.5">{selectedConv.otherUserEmail}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div 
                                ref={messagesContainerRef}
                                className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-purple-50/30 via-white to-purple-50/20"
                                style={{ 
                                    maxHeight: '100%',
                                    overflowY: 'auto',
                                    overflowX: 'hidden'
                                }}
                            >
                                {loadingMessages ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm text-slate-600 font-semibold">Зареждане на съобщения...</p>
                                        </div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-center px-4">
                                        <div>
                                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                            <p className="text-base text-slate-700 font-bold mb-1">Няма съобщения</p>
                                            <p className="text-sm text-slate-400">Напишете първото си съобщение</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {Object.entries(groupMessagesByDate(messages)).map(([dateKey, dateMessages]) => (
                                            <div key={dateKey}>
                                                <div className="flex items-center justify-center my-4">
                                                    <div className="px-3 py-1 bg-purple-100/50 rounded-full">
                                                        <span className="text-xs font-semibold text-purple-700">
                                                            {formatDateLabel(dateKey)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {dateMessages.map((msg) => {
                                                    const isMine = isStudent ? msg.is_from_student : !msg.is_from_student;
                                                    const readKey = isStudent ? msg.read_by_teacher_at : msg.read_by_student_at;
                                                    return (
                                                        <div 
                                                            key={`${msg.id}-${readKey || 'unread'}`} 
                                                            className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 transition-all duration-300`}
                                                        >
                                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-lg text-sm transition-all hover:shadow-xl ${
                                                                isMine
                                                                    ? "bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white rounded-br-sm"
                                                                    : "bg-white text-slate-800 border border-purple-100 rounded-bl-sm"
                                                            }`}>
                                                                <p className="whitespace-pre-wrap break-words leading-relaxed">
                                                                    {msg.message}
                                                                </p>
                                                                <div className={`mt-1.5 flex items-center justify-end gap-1.5 ${
                                                                    isMine ? "text-purple-100/90" : "text-slate-400"
                                                                }`}>
                                                                    <span className="text-xs">
                                                                        {formatTime(msg.created_at)}
                                                                    </span>
                                                                    <MessageStatus message={msg} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            <div className="px-5 py-4 border-t border-purple-100/50 bg-gradient-to-r from-white via-purple-50/40 to-white flex items-center gap-3 shadow-lg">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Напишете съобщение..."
                                    disabled={sending}
                                    className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-2xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm text-slate-800 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400 transition-all shadow-sm hover:shadow-md"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() || sending}
                                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center gap-2"
                                >
                                    {sending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Изпращане...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Изпрати</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center px-2">
                            <div>
                                <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-xs text-slate-500 font-semibold">Изберете чат</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">За да видите съобщения</p>
                            </div>
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
};
