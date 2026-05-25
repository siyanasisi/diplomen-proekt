import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../supabase-client";
import type { MessageReaction } from "../types/chat";

export function useReactions(messageIds: string[], userId: string | null) {
    const [reactionsMap, setReactionsMap] = useState<Record<string, MessageReaction[]>>({});
    const messageIdsRef = useRef<string[]>([]);

    useEffect(() => {
        messageIdsRef.current = messageIds;
    }, [messageIds]);

    const loadReactions = useCallback(async () => {
        const ids = messageIdsRef.current;
        if (!userId || ids.length === 0) return;
        const { data, error } = await supabase
            .from("message_reactions")
            .select("*")
            .in("message_id", ids);

        if (error) return;

        const byMsg: Record<string, MessageReaction[]> = {};
        (data as MessageReaction[]).forEach((r) => {
            if (!byMsg[r.message_id]) byMsg[r.message_id] = [];
            byMsg[r.message_id].push(r);
        });
        setReactionsMap(byMsg);
    }, [userId]);

    useEffect(() => {
        if (messageIds.length > 0) loadReactions();
        else setReactionsMap({});
    }, [messageIds.join(","), loadReactions]);

    const toggleReaction = useCallback(
        async (messageId: string, emoji: string): Promise<boolean> => {
            if (!userId) return false;
            const myReaction = reactionsMap[messageId]?.find((r) => r.user_id === userId);
            if (myReaction && myReaction.emoji === emoji) {
                const { error } = await supabase.from("message_reactions").delete().eq("id", myReaction.id);
                if (!error) {
                    setReactionsMap((prev) => ({
                        ...prev,
                        [messageId]: (prev[messageId] || []).filter((r) => r.id !== myReaction.id),
                    }));
                    return true;
                }
            } else if (myReaction && myReaction.emoji !== emoji) {
                const { error: delError } = await supabase.from("message_reactions").delete().eq("id", myReaction.id);
                if (delError) return false;
                const { data, error: insError } = await supabase
                    .from("message_reactions")
                    .insert({ message_id: messageId, user_id: userId, emoji })
                    .select()
                    .single();
                if (!insError && data) {
                    setReactionsMap((prev) => ({
                        ...prev,
                        [messageId]: (prev[messageId] || []).filter((r) => r.id !== myReaction.id).concat(data as MessageReaction),
                    }));
                    return true;
                }
            } else {
                const { data, error } = await supabase
                    .from("message_reactions")
                    .insert({ message_id: messageId, user_id: userId, emoji })
                    .select()
                    .single();
                if (!error && data) {
                    setReactionsMap((prev) => ({
                        ...prev,
                        [messageId]: [...(prev[messageId] || []), data as MessageReaction],
                    }));
                    return true;
                }
            }
            return false;
        },
        [userId, reactionsMap]
    );

    return {
        reactionsMap,
        toggleReaction,
    };
}
