import type { ReactNode } from "react";
import type { FeedbackVariant } from "./types";
import { ALERT_STYLES } from "./alertStyles";

export type AlertBannerProps = {
    variant?: FeedbackVariant;
    message?: string;
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    role?: "alert" | "status";
};

export function AlertBanner({
    variant = "default",
    message,
    children,
    className = "",
    style,
    role = "alert",
}: AlertBannerProps) {
    const styles = ALERT_STYLES[variant];
    const content = children ?? message;
    if (!content) return null;

    return (
        <div
            role={role}
            className={`flex items-start gap-2 rounded-xl border text-sm font-medium ${styles.container} ${styles.text} ${className}`}
            style={{ padding: "0.75rem 0.875rem", ...style }}
        >
            <span
                className={`material-icons shrink-0 ${styles.icon}`}
                style={{ fontSize: "1.125rem" }}
                aria-hidden
            >
                {styles.iconName}
            </span>
            <div className="flex-1 min-w-0 leading-relaxed">{content}</div>
        </div>
    );
}
