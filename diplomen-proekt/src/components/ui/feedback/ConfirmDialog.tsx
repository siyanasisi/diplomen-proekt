import { useModalFocus } from "../../../hooks/useModalFocus";

export type ConfirmDialogProps = {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    variant: "default" | "danger";
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const { modalRef } = useModalFocus(true, onCancel);

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            role="presentation"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div
                ref={modalRef}
                role="alertdialog"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-desc"
                className="w-full max-w-md bg-white border border-slate-200 shadow-xl"
                style={{ borderRadius: "1rem", padding: "2rem" }}
            >
                <div className="flex items-start justify-between gap-3" style={{ marginBottom: "1rem" }}>
                    <div className="flex items-center gap-3 min-w-0">
                        <span
                            className={`material-icons shrink-0 ${
                                variant === "danger" ? "text-red-600" : "text-purple-700"
                            }`}
                            style={{ fontSize: "1.5rem" }}
                        >
                            {variant === "danger" ? "warning_amber" : "help_outline"}
                        </span>
                        <h2
                            id="confirm-dialog-title"
                            className="text-slate-900"
                            style={{ fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.25 }}
                        >
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                        aria-label="Затвори"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <p
                    id="confirm-dialog-desc"
                    className="text-slate-600"
                    style={{ fontSize: "0.875rem", lineHeight: 1.55, marginBottom: "1.5rem" }}
                >
                    {message}
                </p>

                <div className="flex justify-end flex-wrap" style={{ gap: "0.625rem" }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-semibold"
                        style={{
                            fontSize: "0.875rem",
                            padding: "0.625rem 1rem",
                            borderRadius: "0.625rem",
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`inline-flex items-center text-white font-semibold transition-colors ${
                            variant === "danger"
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-purple-700 hover:bg-purple-800"
                        }`}
                        style={{
                            gap: "0.375rem",
                            fontSize: "0.875rem",
                            padding: "0.625rem 1.125rem",
                            borderRadius: "0.625rem",
                        }}
                    >
                        <span className="material-icons" style={{ fontSize: "1.125rem" }}>
                            {variant === "danger" ? "delete_outline" : "check"}
                        </span>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
