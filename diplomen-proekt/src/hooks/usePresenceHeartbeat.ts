import { useEffect, useRef } from "react";
import { supabase } from "../supabase-client";

const HEARTBEAT_INTERVAL_MS = 90 * 1000; // 1.5 min


export function usePresenceHeartbeat(userId: string | null) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!userId) return;

        const tick = async () => {
            if (document.visibilityState !== "visible") return;
            try {
                await supabase
                    .from("profiles")
                    .update({
                        last_seen_at: new Date().toISOString(),
                        is_online: true,
                    })
                    .eq("id", userId);
            } catch {
            }
        };

        tick();

        intervalRef.current = setInterval(tick, HEARTBEAT_INTERVAL_MS);

        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                tick();
            } else {
                supabase.from("profiles").update({ is_online: false }).eq("id", userId).then(() => {}).catch(() => {});
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [userId]);
}
