import { useRef, useEffect, useCallback } from "react";

const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusables(container: HTMLElement | null): HTMLElement[] {
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

export type UseModalFocusOptions = {
    canClose?: () => boolean;
};

export function useModalFocus(isOpen: boolean, onClose: () => void, options?: UseModalFocusOptions) {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const previousActiveRef = useRef<HTMLElement | null>(null);
    const canClose = options?.canClose;

    // on open - save focus, then move focus to first focusable in modal
    useEffect(() => {
        if (!isOpen) return;
        previousActiveRef.current = document.activeElement as HTMLElement | null;
        const tryFocus = () => {
            const el = modalRef.current;
            if (!el) return;
            const focusables = getFocusables(el);
            const first = focusables[0];
            if (first) first.focus({ preventScroll: true });
        };
        const t = requestAnimationFrame(() => {
            requestAnimationFrame(tryFocus);
        });
        return () => cancelAnimationFrame(t);
    }, [isOpen]);

    // on close - restore focus 
    useEffect(() => {
        if (isOpen) return;
        const prev = previousActiveRef.current;
        if (prev && typeof prev.focus === "function" && document.contains(prev)) {
            const t = requestAnimationFrame(() => {
                prev.focus({ preventScroll: true });
            });
            return () => cancelAnimationFrame(t);
        }
    }, [isOpen]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen || !modalRef.current) return;
            if (e.key === "Escape") {
                e.preventDefault();
                if (canClose && !canClose()) return;
                onClose();
                return;
            }
            if (e.key !== "Tab") return;
            const focusables = getFocusables(modalRef.current);
            if (focusables.length === 0) return;
            const current = document.activeElement as HTMLElement | null;
            const focusInside = current && modalRef.current.contains(current);
            if (!focusInside) return;
            const idx = focusables.indexOf(current);
            const nextIdx = e.shiftKey ? (idx <= 0 ? focusables.length - 1 : idx - 1) : (idx >= focusables.length - 1 ? 0 : idx + 1);
            e.preventDefault();
            focusables[nextIdx].focus({ preventScroll: true });
        },
        [isOpen, onClose, canClose]
    );

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleKeyDown]);

    return { modalRef };
}
