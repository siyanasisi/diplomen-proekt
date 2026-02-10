import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TOAST_DURATION_MS = 4000;

interface ToastContextType {
    showToast: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType["showToast"] {
    const ctx = useContext(ToastContext);
    if (ctx === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return ctx.showToast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [message, setMessage] = useState<string | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const showToast = useCallback((text: string, durationMs: number = TOAST_DURATION_MS) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setMessage(text);
        timeoutRef.current = window.setTimeout(() => {
            setMessage(null);
            timeoutRef.current = null;
        }, durationMs);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {message &&
                createPortal(
                    <div
                        className="chat-toast fixed bottom-4 right-4 z-[9999] max-w-[min(90vw,22rem)] rounded-xl border border-slate-600/50 bg-slate-800 px-4 py-3 text-sm text-white shadow-xl"
                        style={{ marginBottom: "env(safe-area-inset-bottom, 0)" }}
                        role="alert"
                        aria-live="assertive"
                    >
                        {message}
                    </div>,
                    document.body
                )}
        </ToastContext.Provider>
    );
}
