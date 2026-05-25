import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "../components/ui/feedback/ConfirmDialog";
import { ToastNotification } from "../components/ui/feedback/ToastNotification";
import type { ConfirmOptions, FeedbackVariant, ToastOptions } from "../components/ui/feedback/types";

const TOAST_DURATION_MS = 4000;

type ToastState = {
    message: string;
    variant: FeedbackVariant;
};

type ConfirmState = ConfirmOptions & {
    resolve: (value: boolean) => void;
};

export type ShowToastFn = (message: string, options?: number | FeedbackVariant | ToastOptions) => void;

type FeedbackContextType = {
    showToast: ShowToastFn;
    confirmAsync: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

function normalizeToastOptions(
    arg?: number | FeedbackVariant | ToastOptions
): ToastOptions {
    if (arg === undefined) return {};
    if (typeof arg === "number") return { durationMs: arg };
    if (typeof arg === "string") return { variant: arg };
    return arg;
}

function inferToastVariant(message: string): FeedbackVariant {
    const lower = message.toLowerCase();
    if (
        lower.includes("грешка") ||
        lower.includes("неусп") ||
        lower.includes("не мож") ||
        lower.includes("не може") ||
        lower.includes("блокир") ||
        lower.includes("неправилн")
    ) {
        return "error";
    }
    if (
        lower.includes("успешно") ||
        lower.includes("запазен") ||
        lower.includes("обновен") ||
        lower.includes("изтрит") ||
        lower.includes("потвърден") ||
        lower.includes("отменен") ||
        lower.includes("копирано") ||
        lower.includes("маркиран")
    ) {
        return "success";
    }
    return "default";
}

export function useFeedback(): FeedbackContextType {
    const ctx = useContext(FeedbackContext);
    if (ctx === undefined) {
        throw new Error("useFeedback must be used within a FeedbackProvider");
    }
    return ctx;
}

/** @deprecated Prefer useFeedback; kept for existing call sites */
export function useToast(): ShowToastFn {
    return useFeedback().showToast;
}

export function useConfirm(): FeedbackContextType["confirmAsync"] {
    return useFeedback().confirmAsync;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const dismissToast = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setToast(null);
    }, []);

    const showToast = useCallback<ShowToastFn>((text, arg) => {
        const opts = normalizeToastOptions(arg);
        const variant = opts.variant ?? inferToastVariant(text);
        const durationMs = opts.durationMs ?? TOAST_DURATION_MS;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setToast({ message: text, variant });
        timeoutRef.current = window.setTimeout(() => {
            setToast(null);
            timeoutRef.current = null;
        }, durationMs);
    }, []);

    const confirmAsync = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setConfirm({ ...options, resolve });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        confirm?.resolve(true);
        setConfirm(null);
    }, [confirm]);

    const handleCancel = useCallback(() => {
        confirm?.resolve(false);
        setConfirm(null);
    }, [confirm]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <FeedbackContext.Provider value={{ showToast, confirmAsync }}>
            {children}
            {toast &&
                createPortal(
                    <ToastNotification
                        message={toast.message}
                        variant={toast.variant}
                        onDismiss={dismissToast}
                    />,
                    document.body
                )}
            {confirm &&
                createPortal(
                    <ConfirmDialog
                        title={confirm.title}
                        message={confirm.message}
                        confirmLabel={confirm.confirmLabel ?? "Потвърди"}
                        cancelLabel={confirm.cancelLabel ?? "Отказ"}
                        variant={confirm.variant ?? "default"}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />,
                    document.body
                )}
        </FeedbackContext.Provider>
    );
}

/** @deprecated Use FeedbackProvider */
export const ToastProvider = FeedbackProvider;
