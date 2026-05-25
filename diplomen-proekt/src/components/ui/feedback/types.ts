export type FeedbackVariant = "default" | "success" | "error" | "warning" | "info";

export type ToastOptions = {
    variant?: FeedbackVariant;
    durationMs?: number;
};

export type ConfirmOptions = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger";
};
