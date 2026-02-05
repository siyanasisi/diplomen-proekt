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

    // when navigating from teacher profile with openTeacherId select that conversation
    const openTeacherId = (location.state as { openTeacherId?: string } | null)?.openTeacherId;
    useEffect(() => {
        if (!openTeacherId || !conversations.length || selectedConv?.otherUserId === openTeacherId) return;
        const conv = conversations.find((c) => c.otherUserId === openTeacherId);
        if (conv) {
            setSelectedConv(conv);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [openTeacherId, conversations, selectedConv?.otherUserId, setSelectedConv, navigate, location.pathname]);

    // layout: sidebar (conversation list) + main (header, messages, input or empty state)
    return (
        <div className="chat-page-layout flex h-[100dvh] max-h-[100dvh] min-h-0 w-full overflow-hidden bg-slate-100/80">
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

                        {/* confirm modals: block user, delete chat, delete message */}
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

                        {/* scrollable message list */}
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
                    // no conversation selected: show empty state
                    <div className="flex-1 flex items-center justify-center text-center px-6 chat-empty-panel min-h-0">
                        <div className="max-w-[220px]">
                            <div className="chat-empty-icon-wrap w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-7 h-7 text-slate-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.3}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                </svg>
                            </div>
                            <p className="text-[15px] font-semibold text-slate-800 mb-1">Изберете чат</p>
                            <p className="text-[13px] text-slate-500 leading-relaxed">
                                Изберете разговор от списъка, за да видите съобщения
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
