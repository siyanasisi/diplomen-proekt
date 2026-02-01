// block user, delete chat, delete message
import type { Conversation, Message } from "../../types/chat";
import { getDisplayName } from "../../types/chat";
import { useModalFocus } from "../../hooks/useModalFocus";

interface ChatModalsProps {
    confirmAction: "block" | "delete_chat" | null;
    setConfirmAction: (a: "block" | "delete_chat" | null) => void;
    selectedConv: Conversation | null;
    deleteMessageConfirm: Message | null;
    setDeleteMessageConfirm: (m: Message | null) => void;
    onConfirmBlock: () => void;
    onConfirmDeleteChat: () => void;
    onConfirmDeleteMessage: (msg: Message) => void;
}

export function ChatModals({
    confirmAction,
    setConfirmAction,
    selectedConv,
    deleteMessageConfirm,
    setDeleteMessageConfirm,
    onConfirmBlock,
    onConfirmDeleteChat,
    onConfirmDeleteMessage,
}: ChatModalsProps) {
    const isConfirmOpen = !!(confirmAction && selectedConv);
    const isDeleteMsgOpen = !!deleteMessageConfirm;
    const { modalRef: confirmModalRef } = useModalFocus(isConfirmOpen, () => setConfirmAction(null));
    const { modalRef: deleteMsgModalRef } = useModalFocus(isDeleteMsgOpen, () => setDeleteMessageConfirm(null));

    return (
        <>
            {confirmAction && selectedConv && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" aria-hidden onClick={() => setConfirmAction(null)} />
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-title"
                        aria-describedby="confirm-desc"
                    >
                        <div
                            ref={confirmModalRef}
                            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 id="confirm-title" className="text-base font-semibold text-slate-900">
                                {confirmAction === "block" ? "Блокиране на потребител" : "Изтриване на чат"}
                            </h3>
                            <p id="confirm-desc" className="mt-2 text-sm text-slate-600">
                                {confirmAction === "block"
                                    ? `Сигурни ли сте, че искате да блокирате ${getDisplayName(selectedConv)}? Няма да получавате съобщения от този потребител.`
                                    : "Сигурни ли сте? Разговорът ще бъде премахнат от списъка. Съобщенията остават запазени."}
                            </p>
                            <div className="mt-5 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setConfirmAction(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Отказ
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmAction === "block" ? onConfirmBlock : onConfirmDeleteChat}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                                >
                                    {confirmAction === "block" ? "Блокирай" : "Изтрий чат"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {deleteMessageConfirm && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" aria-hidden onClick={() => setDeleteMessageConfirm(null)} />
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-msg-title"
                        aria-describedby="delete-msg-desc"
                    >
                        <div
                            ref={deleteMsgModalRef}
                            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 id="delete-msg-title" className="text-base font-semibold text-slate-900">
                                Изтриване на съобщението
                            </h3>
                            <p id="delete-msg-desc" className="mt-2 text-sm text-slate-600">
                                Сигурни ли сте? Съобщението ще бъде премахнато.
                            </p>
                            <div className="mt-5 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setDeleteMessageConfirm(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Отказ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onConfirmDeleteMessage(deleteMessageConfirm)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                                >
                                    Изтрий
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
