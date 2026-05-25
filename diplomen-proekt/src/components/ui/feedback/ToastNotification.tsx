import type { FeedbackVariant } from "./types";
import { ALERT_STYLES } from "./alertStyles";

type ToastNotificationProps = {
    message: string;
    variant: FeedbackVariant;
    onDismiss: () => void;
};

export function ToastNotification({ message, variant, onDismiss }: ToastNotificationProps) {
    const styles = ALERT_STYLES[variant];

    return (
        <div
            className="fixed bottom-4 right-4 z-[9999] flex items-start gap-3 max-w-[min(90vw,22rem)] bg-white border border-slate-200 shadow-xl"
            style={{
                borderRadius: "0.75rem",
                padding: "0.875rem 1rem",
                marginBottom: "env(safe-area-inset-bottom, 0)",
            }}
            role="alert"
            aria-live="assertive"
        >
            <span
                className={`material-icons shrink-0 ${styles.icon}`}
                style={{ fontSize: "1.25rem" }}
                aria-hidden
            >
                {styles.iconName}
            </span>
            <p className={`flex-1 text-sm font-medium leading-snug ${styles.text}`}>{message}</p>
            <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors -mr-0.5"
                aria-label="Затвори"
            >
                <span className="material-icons" style={{ fontSize: "1.125rem" }}>
                    close
                </span>
            </button>
        </div>
    );
}
