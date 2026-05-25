// conversation info, view profile
import { AvatarImage } from "../AvatarImage";
import type { Conversation } from "../../types/chat";
import { getDisplayName } from "../../types/chat";
import { useModalFocus } from "../../hooks/useModalFocus";
import { mergeRefs } from "../../utils/mergeRefs";

interface ChatInfoPanelProps {
    selectedConv: Conversation;
    isStudent: boolean;
    onClose: () => void;
    onViewProfile: (userId: string) => void;
    chatHeaderInfoRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatInfoPanel({
    selectedConv,
    isStudent,
    onClose,
    onViewProfile,
    chatHeaderInfoRef,
}: ChatInfoPanelProps) {
    const { modalRef } = useModalFocus(true, onClose);

    return (
        <>
            <div
                className="fixed inset-0 bg-black/20 z-40 md:bg-transparent"
                aria-hidden
                onClick={onClose}
            />
            <div
                ref={mergeRefs(chatHeaderInfoRef, modalRef)}
                className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl z-50 flex flex-col border-l border-slate-200 chat-info-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="chat-info-title"
                aria-describedby="chat-info-desc"
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 id="chat-info-title" className="text-base font-semibold text-slate-900">Информация</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Затвори"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div id="chat-info-desc" className="p-4 flex-1 overflow-auto">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-slate-200 mb-3">
                            <AvatarImage
                                url={selectedConv.otherUserAvatarUrl}
                                fallback={
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-600 text-xl font-semibold">
                                        {getDisplayName(selectedConv).charAt(0).toUpperCase()}
                                    </div>
                                }
                                imgClassName="w-full h-full object-cover"
                            />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">{getDisplayName(selectedConv)}</h4>
                        {selectedConv.otherUserEmail && (
                            <p className="text-sm text-slate-500 mt-0.5 break-all">{selectedConv.otherUserEmail}</p>
                        )}
                    </div>
                    {isStudent && (
                        <button
                            type="button"
                            onClick={() => onViewProfile(selectedConv.otherUserId)}
                            className="w-full py-3 px-4 rounded-lg bg-slate-100 text-slate-800 font-medium text-sm hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Виж профил на учителя
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
