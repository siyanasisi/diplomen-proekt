import { useEffect, useState, useRef, useCallback } from "react";

export function useScrollToBottom(messagesContainerRef: React.RefObject<HTMLDivElement | null>) {
    const [showScrollFAB, setShowScrollFAB] = useState(false);
    const isNearBottomRef = useRef(true);
    const showFABRef = useRef({ showFAB: false, programmatic: false });

    const checkIfNearBottom = useCallback(() => {
        if (!messagesContainerRef.current) return false;
        const container = messagesContainerRef.current;
        return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    }, [messagesContainerRef]);

    const scrollToBottom = useCallback((force = false) => {
        if (!messagesContainerRef.current) return;
        const container = messagesContainerRef.current;
        if (force || isNearBottomRef.current) {
            showFABRef.current.programmatic = true;
            container.scrollTop = container.scrollHeight;
            isNearBottomRef.current = true;
            if (showFABRef.current.showFAB) {
                showFABRef.current.showFAB = false;
                setShowScrollFAB(false);
            }
            requestAnimationFrame(() => {
                showFABRef.current.programmatic = false;
            });
        }
    }, [messagesContainerRef]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        let ticking = false;
        const handleScroll = () => {
            if (showFABRef.current.programmatic) return;
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    const near = checkIfNearBottom();
                    isNearBottomRef.current = near;
                    const shouldShowFAB = !near;
                    if (shouldShowFAB !== showFABRef.current.showFAB) {
                        showFABRef.current.showFAB = shouldShowFAB;
                        setShowScrollFAB(shouldShowFAB);
                    }
                    ticking = false;
                });
            }
        };
        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [messagesContainerRef, checkIfNearBottom]);

    return {
        scrollToBottom,
        showScrollFAB,
        setShowScrollFAB,
    };
}
