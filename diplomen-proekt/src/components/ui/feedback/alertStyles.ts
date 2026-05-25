import type { FeedbackVariant } from "./types";

export const ALERT_STYLES: Record<
    FeedbackVariant,
    { container: string; icon: string; text: string; iconName: string }
> = {
    default: {
        container: "border-purple-200 bg-purple-50",
        icon: "text-purple-600",
        text: "text-purple-900",
        iconName: "info",
    },
    success: {
        container: "border-emerald-200 bg-emerald-50",
        icon: "text-emerald-600",
        text: "text-emerald-900",
        iconName: "check_circle",
    },
    error: {
        container: "border-red-200 bg-red-50",
        icon: "text-red-600",
        text: "text-red-900",
        iconName: "error_outline",
    },
    warning: {
        container: "border-amber-200 bg-amber-50",
        icon: "text-amber-600",
        text: "text-amber-900",
        iconName: "warning_amber",
    },
    info: {
        container: "border-slate-200 bg-slate-50",
        icon: "text-slate-600",
        text: "text-slate-800",
        iconName: "info_outline",
    },
};
