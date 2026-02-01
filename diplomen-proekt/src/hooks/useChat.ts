import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useConversations } from "./useConversations";
import { useScrollToBottom } from "./useScrollToBottom";
import { useMessages } from "./useMessages";
import { useRealtime } from "./useRealtime";
import { useSendMessage } from "./useSendMessage";
import { useMessageActions } from "./useMessageActions";

export function useChat() {
    const { user, role, currentUserProfile } = useAuth();
    const navigate = useNavigate();
    const showToast = useToast();

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const chatHeaderMoreRef = useRef<HTMLDivElement>(null);
    const chatHeaderInfoRef = useRef<HTMLDivElement>(null);

    const {
        conversations,
        setConversations,
        selectedConv,
        setSelectedConv,
        loadingConversations,
        conversationSearch,
        setConversationSearch,
        loadConversations,
    } = useConversations(user, role);

    const { scrollToBottom, showScrollFAB, setShowScrollFAB } = useScrollToBottom(messagesContainerRef);

    const {
        messages,
        setMessages,
        loadMessages,
        loadOlderMessages,
        loadingMessages,
        messagesLoadError,
        loadingOlderMessages,
        olderMessagesLoadError,
        hasMoreOlderMessages,
        setHasMoreOlderMessages,
        setLoadingOlderMessages,
        loadOlderRequestedRef,
        didPrependOlderRef,
    } = useMessages(selectedConv, user, role, messagesContainerRef, setConversations, showToast);

    useRealtime(user, role, selectedConv, setMessages, setConversations);

    const sendMessage = useSendMessage(selectedConv, user, role, setMessages, scrollToBottom, loadConversations, showToast);
    const {
        newMessage,
        setNewMessage,
        sending,
        attachmentFile,
        setAttachmentFile,
        emojiPickerOpen,
        setEmojiPickerOpen,
        fileInputRef,
        inputRef,
        emojiPickerRef,
        handleSend,
        handleRetrySend,
        handleKeyPress,
        handleAttachmentClick,
        handleFileChange,
        handleEmojiSelect,
    } = sendMessage;

    const messageActions = useMessageActions(setMessages, loadConversations, showToast, selectedConv?.otherUserId);
    const {
        editingMessageId,
        editingDraft,
        setEditingDraft,
        messageMenuOpenId,
        setMessageMenuOpenId,
        messageMenuRef,
        deleteMessageConfirm,
        setDeleteMessageConfirm,
        handleEditStart,
        handleEditSave,
        handleEditCancel,
        handleDeleteMessage,
    } = messageActions;

    const [chatHeaderMoreOpen, setChatHeaderMoreOpen] = useState(false);
    const [chatHeaderInfoOpen, setChatHeaderInfoOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<"block" | "delete_chat" | null>(null);

    useEffect(() => {
        if (!user) navigate("/login", { replace: true });
    }, [user, navigate]);

    useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, []);

    React.useLayoutEffect(() => {
        if (didPrependOlderRef.current) {
            didPrependOlderRef.current = false;
            return;
        }
        if (messages.length > 0 && !loadingMessages) {
            scrollToBottom(true);
        }
    }, [messages.length, loadingMessages, scrollToBottom, didPrependOlderRef]);

    useEffect(() => {
        didPrependOlderRef.current = false;
        setHasMoreOlderMessages(true);
        setLoadingOlderMessages(false);
        loadOlderRequestedRef.current = false;
        setShowScrollFAB(false);
    }, [selectedConv?.otherUserId, setHasMoreOlderMessages, setLoadingOlderMessages, setShowScrollFAB]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            const active = document.activeElement;
            if (active === inputRef.current) return;
            if (editingMessageId) {
                handleEditCancel();
                return;
            }
            if (deleteMessageConfirm) {
                setDeleteMessageConfirm(null);
                return;
            }
            if (confirmAction) {
                setConfirmAction(null);
                return;
            }
            if (messageMenuOpenId) {
                setMessageMenuOpenId(null);
                return;
            }
            if (chatHeaderInfoOpen) {
                setChatHeaderInfoOpen(false);
                return;
            }
            if (chatHeaderMoreOpen) {
                setChatHeaderMoreOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [editingMessageId, deleteMessageConfirm, confirmAction, messageMenuOpenId, chatHeaderInfoOpen, chatHeaderMoreOpen, handleEditCancel, setDeleteMessageConfirm, setMessageMenuOpenId]);

    const handleBlockUser = useCallback(async () => {
        if (!user || !selectedConv) return;
        const { error } = await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: selectedConv.otherUserId });
        if (error) {
            showToast("Блокирането не можа да се извърши. Моля, опитайте отново по-късно.");
            return;
        }
        setConfirmAction(null);
        setChatHeaderMoreOpen(false);
        setSelectedConv(null);
        loadConversations();
    }, [user, selectedConv, loadConversations, showToast]);

    const handleDeleteChat = useCallback(async () => {
        if (!user || !selectedConv) return;
        const { error } = await supabase.from("hidden_conversations").insert({ user_id: user.id, other_user_id: selectedConv.otherUserId });
        if (error) {
            showToast("Чатът не можа да бъде изтрит. Моля, опитайте отново по-късно.");
            return;
        }
        setConfirmAction(null);
        setChatHeaderMoreOpen(false);
        setSelectedConv(null);
        loadConversations();
    }, [user, selectedConv, loadConversations, showToast]);

    const filteredConversations = useMemo(() => {
        if (!conversationSearch.trim()) return conversations;
        const q = conversationSearch.trim().toLowerCase();
        return conversations.filter(
            (c) =>
                c.otherUserName.toLowerCase().includes(q) ||
                (c.otherUserEmail && c.otherUserEmail.toLowerCase().includes(q)) ||
                (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
        );
    }, [conversations, conversationSearch]);

    const handleScrollToBottomClick = useCallback(() => {
        scrollToBottom(true);
        setShowScrollFAB(false);
    }, [scrollToBottom, setShowScrollFAB]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (chatHeaderMoreRef.current && !chatHeaderMoreRef.current.contains(e.target as Node)) setChatHeaderMoreOpen(false);
        };
        if (chatHeaderMoreOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [chatHeaderMoreOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setEmojiPickerOpen(false);
        };
        if (emojiPickerOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [emojiPickerOpen]);

    useEffect(() => {
        setAttachmentFile(null);
        setEmojiPickerOpen(false);
    }, [selectedConv?.otherUserId, setAttachmentFile, setEmojiPickerOpen]);

    const currentUserAvatarUrl = currentUserProfile?.avatar_url ?? (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ?? null;

    return {
        user,
        role,
        currentUserAvatarUrl,
        conversations,
        selectedConv,
        setSelectedConv,
        messages,
        loadingConversations,
        loadingMessages,
        messagesLoadError,
        loadingOlderMessages,
        olderMessagesLoadError,
        hasMoreOlderMessages,
        newMessage,
        setNewMessage,
        sending,
        showScrollFAB,
        conversationSearch,
        setConversationSearch,
        chatHeaderMoreOpen,
        setChatHeaderMoreOpen,
        chatHeaderInfoOpen,
        setChatHeaderInfoOpen,
        chatHeaderMoreRef,
        chatHeaderInfoRef,
        attachmentFile,
        setAttachmentFile,
        emojiPickerOpen,
        setEmojiPickerOpen,
        fileInputRef,
        emojiPickerRef,
        inputRef,
        editingMessageId,
        editingDraft,
        setEditingDraft,
        messageMenuOpenId,
        setMessageMenuOpenId,
        messageMenuRef,
        confirmAction,
        setConfirmAction,
        deleteMessageConfirm,
        setDeleteMessageConfirm,
        messagesContainerRef,
        loadMessages,
        loadOlderMessages,
        handleSend,
        handleRetrySend,
        handleKeyPress,
        handleAttachmentClick,
        handleFileChange,
        handleEmojiSelect,
        handleEditStart,
        handleEditSave,
        handleEditCancel,
        handleDeleteMessage,
        handleBlockUser,
        handleDeleteChat,
        handleScrollToBottomClick,
        filteredConversations,
    };
}
