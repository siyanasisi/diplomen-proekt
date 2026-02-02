import { useState, useEffect, useCallback } from "react";
import { supabase, ensureValidSession } from "../supabase-client";
import { useToast } from "../context/ToastContext";
import type { Teacher } from "../types/teacher";

export function useTeachers(userId: string | null) {
    const showToast = useToast();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadTeachers = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            if (userId) {
                await ensureValidSession();
            }

            let blockedUserIds = new Set<string>();
            if (userId) {
                const { data: blockedData } = await supabase
                    .from("blocked_users")
                    .select("blocked_id")
                    .eq("blocker_id", userId);
                if (blockedData) {
                    blockedUserIds = new Set(blockedData.map((r: { blocked_id: string }) => r.blocked_id));
                }
            }

            const { data, error } = await supabase
                .from("teacher_profiles")
                .select("*")
                .order("rating", { ascending: false });

            if (error) {
                console.error("[useTeachers] Error loading teachers:", error);
                showToast("Списъкът с учители не можа да се зареди. Моля, опитайте отново по-късно.");
                setTeachers([]);
                return;
            }

            let list: Teacher[] = userId
                ? (data ?? []).filter((t: Teacher) => !blockedUserIds.has(t.user_id))
                : (data ?? []);

            const userIds = [...new Set(list.map((t: Teacher) => t.user_id))];
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("id, avatar_url")
                    .in("id", userIds);
                const avatarByUserId = new Map<string, string>();
                (profilesData ?? []).forEach((p: { id: string; avatar_url: string | null }) => {
                    if (p.avatar_url) avatarByUserId.set(p.id, p.avatar_url);
                });
                list = list.map((t: Teacher) => ({
                    ...t,
                    profile_picture: t.profile_picture ?? avatarByUserId.get(t.user_id) ?? undefined,
                }));
            }
            setTeachers(list);
        } catch (err) {
            console.error("[useTeachers] Failed to load teachers:", err);
            showToast("Списъкът с учители не можа да се зареди. Моля, опитайте отново по-късно.");
            setTeachers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId, showToast]);

    useEffect(() => {
        loadTeachers();
    }, [loadTeachers]);

    const refresh = useCallback(() => {
        loadTeachers(true);
    }, [loadTeachers]);

    return { teachers, loading, refreshing, refresh };
}
