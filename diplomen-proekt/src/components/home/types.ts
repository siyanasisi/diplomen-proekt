import type { ReactNode } from "react";
import type { useHome } from "../../hooks/useHome";

export type HomeState = ReturnType<typeof useHome>;

export type HomeMenuId = "dashboard" | "study-plan" | "calendar" | "events" | "settings" | "lessons" | "messages";

export type HomeMenuItem = {
    id: HomeMenuId;
    label: string;
    icon: ReactNode;
};
