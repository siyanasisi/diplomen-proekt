import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatModals } from "../components/chat/ChatModals";
import { ChatInfoPanel } from "../components/chat/ChatInfoPanel";
import { MessageList } from "../components/chat/MessageList";
import { ChatErrorBoundary } from "../components/chat/ChatErrorBoundary";
import { ChatInput } from "../components/chat/ChatInput";

export const Chat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const chat = useChat();
    const {
        user,
        role,
        currentUserAvatarUrl,
        conversations,
        setSelectedConv,
        selectedConv,
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
        replyingTo,
        setReplyingTo,
        reactionsMap,
        toggleReaction,
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
    } = chat;

    const isStudent = role === "student";

    const openTeacherId = (location.state as { openTeacherId?: string } | null)?.openTeacherId;
    useEffect(() => {
        if (!openTeacherId || !conversations.length || selectedConv?.otherUserId === openTeacherId) return;
        const conv = conversations.find((c) => c.otherUserId === openTeacherId);
        if (conv) {
            setSelectedConv(conv);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [openTeacherId, conversations, selectedConv?.otherUserId, setSelectedConv, navigate, location.pathname]);

    return (
        <div className="chat-page-layout flex h-[100dvh] max-h-[100dvh] min-h-0 w-full overflow-hidden bg-slate-50">
            <ChatSidebar
                conversations={conversations}
                selectedConv={selectedConv}
                setSelectedConv={setSelectedConv}
                loadingConversations={loadingConversations}
                conversationSearch={conversationSearch}
                setConversationSearch={setConversationSearch}
                filteredConversations={filteredConversations}
                isStudent={isStudent}
            />

            <main
                className={`flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden chat-main-panel ${!selectedConv ? "hidden md:flex" : "flex"}`}
            >
                {selectedConv ? (
                    <div className="chat-right-grid h-full min-h-0 flex flex-col overflow-hidden bg-white">
                        <ChatHeader
                            selectedConv={selectedConv}
                            setSelectedConv={setSelectedConv}
                            chatHeaderMoreOpen={chatHeaderMoreOpen}
                            setChatHeaderMoreOpen={setChatHeaderMoreOpen}
                            chatHeaderInfoOpen={chatHeaderInfoOpen}
                            setChatHeaderInfoOpen={setChatHeaderInfoOpen}
                            chatHeaderMoreRef={chatHeaderMoreRef}
                            isStudent={isStudent}
                            onNavigateToProfile={(userId) => navigate(`/teacher/${userId}`)}
                            onOpenBlock={() => setConfirmAction("block")}
                            onOpenDeleteChat={() => setConfirmAction("delete_chat")}
                        />

                        <ChatModals
                            confirmAction={confirmAction}
                            setConfirmAction={setConfirmAction}
                            selectedConv={selectedConv}
                            deleteMessageConfirm={deleteMessageConfirm}
                            setDeleteMessageConfirm={setDeleteMessageConfirm}
                            onConfirmBlock={handleBlockUser}
                            onConfirmDeleteChat={handleDeleteChat}
                            onConfirmDeleteMessage={handleDeleteMessage}
                            role={role}
                        />

                        {chatHeaderInfoOpen && (
                            <ChatInfoPanel
                                selectedConv={selectedConv}
                                isStudent={isStudent}
                                onClose={() => setChatHeaderInfoOpen(false)}
                                onViewProfile={(userId) => navigate(`/teacher/${userId}`)}
                                chatHeaderInfoRef={chatHeaderInfoRef}
                            />
                        )}

                        <div className="flex-1 min-h-0 flex flex-col basis-0">
                            <ChatErrorBoundary>
                                <MessageList
                                messages={messages}
                                loadingMessages={loadingMessages}
                                messagesLoadError={messagesLoadError}
                                loadingOlderMessages={loadingOlderMessages}
                                olderMessagesLoadError={olderMessagesLoadError}
                                hasMoreOlderMessages={hasMoreOlderMessages}
                                selectedConv={selectedConv}
                                role={role}
                                user={user}
                                currentUserAvatarUrl={currentUserAvatarUrl}
                                messagesContainerRef={messagesContainerRef}
                                loadMessages={loadMessages}
                                loadOlderMessages={loadOlderMessages}
                                editingMessageId={editingMessageId}
                                editingDraft={editingDraft}
                                setEditingDraft={setEditingDraft}
                                messageMenuOpenId={messageMenuOpenId}
                                setMessageMenuOpenId={setMessageMenuOpenId}
                                messageMenuRef={messageMenuRef}
                                handleEditStart={handleEditStart}
                                handleEditSave={handleEditSave}
                                handleEditCancel={handleEditCancel}
                                setDeleteMessageConfirm={setDeleteMessageConfirm}
                                handleRetrySend={handleRetrySend}
                                showScrollFAB={showScrollFAB}
                                setReplyingTo={setReplyingTo}
                                reactionsMap={reactionsMap}
                                toggleReaction={toggleReaction}
                                handleScrollToBottomClick={handleScrollToBottomClick}
                            />
                            </ChatErrorBoundary>
                        </div>

                        <ChatInput
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            sending={sending}
                            attachmentFile={attachmentFile}
                            setAttachmentFile={setAttachmentFile}
                            emojiPickerOpen={emojiPickerOpen}
                            setEmojiPickerOpen={setEmojiPickerOpen}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            fileInputRef={fileInputRef}
                            emojiPickerRef={emojiPickerRef}
                            inputRef={inputRef}
                            handleSend={handleSend}
                            handleKeyPress={handleKeyPress}
                            handleAttachmentClick={handleAttachmentClick}
                            handleFileChange={handleFileChange}
                            handleEmojiSelect={handleEmojiSelect}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center chat-empty-panel min-h-0" style={{ padding: '2rem' }}>
                        <div style={{ maxWidth: '16rem' }}>
                            <div className="flex items-center justify-center bg-purple-50 text-purple-700 mx-auto" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.5rem' }}>chat_bubble_outline</span>
                            </div>
                            <h3 className="text-slate-900" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.375rem' }}>Изберете чат</h3>
                            <p className="text-slate-500" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                                Изберете разговор от списъка, за да видите съобщения
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
