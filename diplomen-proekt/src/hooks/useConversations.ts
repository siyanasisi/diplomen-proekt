import { useEffect, useState, useRef, useCallback } from "react";
import { supabase, ensureValidSession } from "../supabase-client";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Message, Conversation, ChatRole } from "../types/chat";
import { getMyMessagesColumn, getOtherUserId, isUnreadForMe } from "../types/chat";

export function useConversations(user: { id: string } | null, role: string | null) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [conversationSearch, setConversationSearch] = useState("");
    const loadConversationsTimeoutRef = useRef<number | null>(null);
    const conversationsChannelRef = useRef<RealtimeChannel | null>(null);

    const loadConversations = useCallback(async (silent?: boolean) => {
        if (!user || !role) return;
        if (!silent) setLoadingConversations(true);
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
            const presenceMap = new Map<string, { last_seen_at: string | null; is_online: boolean }>();
            const defaultName = role === "student" ? "Учител" : "Ученик";

            if (allOtherUserIds.length > 0) {
                try {
                    const [teacherRes, profilesRes] = await Promise.all([
                        role === "student"
                            ? supabase.from("teacher_profiles").select("user_id, full_name, email, profile_picture").in("user_id", allOtherUserIds)
                            : Promise.resolve({ data: [] as { user_id: string; full_name?: string | null; email?: string | null; profile_picture?: string | null }[] }),
                        supabase.from("profiles").select("id, first_name, last_name, email, avatar_url, last_seen_at, is_online").in("id", allOtherUserIds),
                    ]);

                    (teacherRes.data ?? []).forEach((t: { user_id: string; full_name?: string | null; email?: string | null; profile_picture?: string | null }) => {
                        if (t.user_id)
                            userNamesMap.set(t.user_id, {
                                name: t.full_name || defaultName,
                                email: t.email ?? undefined,
                                avatarUrl: t.profile_picture ?? undefined,
                            });
                    });

                    type ProfileRow = { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; avatar_url?: string | null; last_seen_at?: string | null; is_online?: boolean };
                    const profileRows = (profilesRes.data ?? []) as ProfileRow[];
                    if (profilesRes.error && profileRows.length === 0) {
                        const fallback = await supabase.from("profiles").select("id, first_name, last_name, email, last_seen_at, is_online").in("id", allOtherUserIds);
                        (fallback.data ?? []).forEach((row: ProfileRow) => {
                            if (row?.id) {
                                const fromParts = `${row.first_name || ""} ${row.last_name || ""}`.trim();
                                const name = fromParts || (row.email?.split("@")[0] ?? null) || defaultName;
                                userNamesMap.set(row.id, { name, email: row.email ?? undefined, avatarUrl: undefined });
                                presenceMap.set(row.id, { last_seen_at: row.last_seen_at ?? null, is_online: !!row.is_online });
                            }
                        });
                    } else {
                        profileRows.forEach((row: ProfileRow) => {
                            if (row?.id) {
                                const fromParts = `${row.first_name || ""} ${row.last_name || ""}`.trim();
                                const name = fromParts || (row.email?.split("@")[0] ?? null) || defaultName;
                                const avatarUrl = row.avatar_url ?? undefined;
                                if (!userNamesMap.has(row.id)) userNamesMap.set(row.id, { name, email: row.email ?? undefined, avatarUrl });
                                presenceMap.set(row.id, { last_seen_at: row.last_seen_at ?? null, is_online: !!row.is_online });
                            }
                        });
                    }

                    const stillMissing = allOtherUserIds.filter((id) => !userNamesMap.has(id));
                    if (stillMissing.length > 0) {
                        const { data: missingData } = await supabase
                            .from("profiles")
                            .select("id, first_name, last_name, email, avatar_url, last_seen_at, is_online")
                            .in("id", stillMissing);
                        (missingData ?? []).forEach((row: ProfileRow) => {
                            if (row?.id) {
                                const fromParts = `${row.first_name || ""} ${row.last_name || ""}`.trim();
                                const name = fromParts || (row.email?.split("@")[0] ?? null) || defaultName;
                                const avatarUrl = row.avatar_url ?? undefined;
                                userNamesMap.set(row.id, { name, email: row.email ?? undefined, avatarUrl });
                                presenceMap.set(row.id, { last_seen_at: row.last_seen_at ?? null, is_online: !!row.is_online });
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
                const presence = presenceMap.get(otherUserId);
                convs.push({
                    otherUserId,
                    otherUserName: userInfo.name,
                    otherUserEmail: userInfo.email,
                    otherUserAvatarUrl: userInfo.avatarUrl,
                    lastMessage: lastMsg?.deleted_at ? "Съобщението е изтрито" : (lastMsg?.message?.trim() || (lastMsg?.attachment_url ? "📎 Прикачен файл" : "")),
                    lastTime: lastMsg?.created_at ?? "",
                    unreadCount,
                    otherUserLastSeenAt: presence?.last_seen_at ?? null,
                    otherUserIsOnline: presence?.is_online ?? false,
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
            if (!silent) setLoadingConversations(false);
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
            setSelectedConv((p) =>
                p?.otherUserId === selectedConv.otherUserId ? { ...p, otherUserName: name, otherUserEmail: email ?? p.otherUserEmail, otherUserAvatarUrl: avatarUrl ?? p.otherUserAvatarUrl } : p
            );
        })();
        return () => { cancelled = true; };
    }, [selectedConv, role]);

    const debouncedLoadConversations = useCallback(() => {
        if (loadConversationsTimeoutRef.current) clearTimeout(loadConversationsTimeoutRef.current);
        loadConversationsTimeoutRef.current = window.setTimeout(() => loadConversations(true), 1200);
    }, [loadConversations]);

    useEffect(() => {
        return () => {
            if (loadConversationsTimeoutRef.current) clearTimeout(loadConversationsTimeoutRef.current);
        };
    }, []);

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
        const msgFilter = `${getMyMessagesColumn(role as ChatRole)}=eq.${user.id}`;
        const channel = supabase
            .channel(`conversations-${user.id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: msgFilter }, () => debouncedLoadConversations())
            .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: msgFilter }, () => debouncedLoadConversations())
            .subscribe();
        conversationsChannelRef.current = channel;
        return () => {
            if (conversationsChannelRef.current) {
                supabase.removeChannel(conversationsChannelRef.current);
                conversationsChannelRef.current = null;
            }
        };
    }, [user, role, debouncedLoadConversations]);

    return {
        conversations,
        setConversations,
        selectedConv,
        setSelectedConv,
        loadingConversations,
        conversationSearch,
        setConversationSearch,
        loadConversations,
    };
}
