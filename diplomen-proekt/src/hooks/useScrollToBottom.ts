import { useEffect, useState, useRef, useCallback } from "react";

export function useScrollToBottom(messagesContainerRef: React.RefObject<HTMLDivElement | null>) {
    const [showScrollFAB, setShowScrollFAB] = useState(false);
    const isNearBottomRef = useRef(true);
    const scrollTimeoutRef = useRef<number | null>(null);

    const checkIfNearBottom = useCallback(() => {
        if (!messagesContainerRef.current) return false;
        const container = messagesContainerRef.current;
        return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    }, [messagesContainerRef]);

    const scrollToBottom = useCallback((force = false) => {
        if (!messagesContainerRef.current) return;
        const container = messagesContainerRef.current;
        if (force || isNearBottomRef.current) {
            const scroll = () => {
                if (container) container.scrollTop = container.scrollHeight;
            };
            scroll();
            requestAnimationFrame(() => {
                scroll();
                setTimeout(() => scroll(), 10);
                setTimeout(() => scroll(), 50);
                setTimeout(() => scroll(), 100);
                setTimeout(() => scroll(), 200);
            });
        }
    }, [messagesContainerRef]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const near = checkIfNearBottom();
                    isNearBottomRef.current = near;
                    setShowScrollFAB(!near);
                    ticking = false;
                });
                ticking = true;
            }
        };
        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [messagesContainerRef, checkIfNearBottom]);

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    return {
        scrollToBottom,
        showScrollFAB,
        setShowScrollFAB,
        scrollTimeoutRef,
    };
}
