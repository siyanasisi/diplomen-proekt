// block user, delete chat, delete message
import type { Conversation, Message, ChatRole } from "../../types/chat";
import { getDisplayName, isFromMe } from "../../types/chat";
import { useModalFocus } from "../../hooks/useModalFocus";

interface ChatModalsProps {
    confirmAction: "block" | "delete_chat" | null;
    setConfirmAction: (a: "block" | "delete_chat" | null) => void;
    selectedConv: Conversation | null;
    deleteMessageConfirm: Message | null;
    setDeleteMessageConfirm: (m: Message | null) => void;
    onConfirmBlock: () => void;
    onConfirmDeleteChat: () => void;
    onConfirmDeleteMessage: (msg: Message, mode: "for_everyone" | "for_me") => void;
    role: string | null;
}

const MODAL_SHELL =
    "w-full max-w-md bg-white border border-slate-200 shadow-xl";
const MODAL_SHELL_STYLE = { borderRadius: "1rem", padding: "2rem" } as const;

export function ChatModals({
    confirmAction,
    setConfirmAction,
    selectedConv,
    deleteMessageConfirm,
    setDeleteMessageConfirm,
    onConfirmBlock,
    onConfirmDeleteChat,
    onConfirmDeleteMessage,
    role,
}: ChatModalsProps) {
    const isConfirmOpen = !!(confirmAction && selectedConv);
    const isDeleteMsgOpen = !!deleteMessageConfirm;
    const { modalRef: confirmModalRef } = useModalFocus(isConfirmOpen, () => setConfirmAction(null));
    const { modalRef: deleteMsgModalRef } = useModalFocus(isDeleteMsgOpen, () => setDeleteMessageConfirm(null));

    return (
        <>
            {confirmAction && selectedConv && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    role="presentation"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setConfirmAction(null);
                    }}
                >
                    <div
                        ref={confirmModalRef}
                        role="alertdialog"
                        aria-labelledby="confirm-title"
                        aria-describedby="confirm-desc"
                        className={MODAL_SHELL}
                        style={MODAL_SHELL_STYLE}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3" style={{ marginBottom: "1rem" }}>
                            <div className="flex items-center gap-3 min-w-0">
                                <span
                                    className="material-icons shrink-0 text-red-600"
                                    style={{ fontSize: "1.5rem" }}
                                >
                                    warning_amber
                                </span>
                                <h2
                                    id="confirm-title"
                                    className="text-slate-900"
                                    style={{ fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.25 }}
                                >
                                    {confirmAction === "block" ? "Блокиране на потребител" : "Изтриване на чат"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                aria-label="Затвори"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <p
                            id="confirm-desc"
                            className="text-slate-600"
                            style={{ fontSize: "0.875rem", lineHeight: 1.55, marginBottom: "1.5rem" }}
                        >
                            {confirmAction === "block"
                                ? `Сигурни ли сте, че искате да блокирате ${getDisplayName(selectedConv)}? Няма да получавате съобщения от този потребител.`
                                : "Сигурни ли сте? Разговорът ще бъде премахнат от списъка. Съобщенията остават запазени."}
                        </p>
                        <div className="flex justify-end flex-wrap" style={{ gap: "0.625rem" }}>
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-semibold"
                                style={{
                                    fontSize: "0.875rem",
                                    padding: "0.625rem 1rem",
                                    borderRadius: "0.625rem",
                                }}
                            >
                                Отказ
                            </button>
                            <button
                                type="button"
                                onClick={confirmAction === "block" ? onConfirmBlock : onConfirmDeleteChat}
                                className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                                style={{
                                    gap: "0.375rem",
                                    fontSize: "0.875rem",
                                    padding: "0.625rem 1.125rem",
                                    borderRadius: "0.625rem",
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: "1.125rem" }}>
                                    {confirmAction === "block" ? "block" : "delete_outline"}
                                </span>
                                {confirmAction === "block" ? "Блокирай" : "Изтрий чат"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteMessageConfirm && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    role="presentation"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setDeleteMessageConfirm(null);
                    }}
                >
                    <div
                        ref={deleteMsgModalRef}
                        role="alertdialog"
                        aria-labelledby="delete-msg-title"
                        aria-describedby="delete-msg-desc"
                        className={MODAL_SHELL}
                        style={MODAL_SHELL_STYLE}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3" style={{ marginBottom: "1rem" }}>
                            <div className="flex items-center gap-3 min-w-0">
                                <span
                                    className="material-icons shrink-0 text-red-600"
                                    style={{ fontSize: "1.5rem" }}
                                >
                                    delete_outline
                                </span>
                                <h2
                                    id="delete-msg-title"
                                    className="text-slate-900"
                                    style={{ fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.25 }}
                                >
                                    Изтриване на съобщението
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeleteMessageConfirm(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                aria-label="Затвори"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <p
                            id="delete-msg-desc"
                            className="text-slate-600"
                            style={{ fontSize: "0.875rem", lineHeight: 1.55, marginBottom: "1.5rem" }}
                        >
                            Изтрийте съобщението за всички (само в рамките на 2 мин.) или само за себе си.
                        </p>
                        <div className="flex justify-end flex-wrap" style={{ gap: "0.625rem" }}>
                            <button
                                type="button"
                                onClick={() => setDeleteMessageConfirm(null)}
                                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-semibold"
                                style={{
                                    fontSize: "0.875rem",
                                    padding: "0.625rem 1rem",
                                    borderRadius: "0.625rem",
                                }}
                            >
                                Отказ
                            </button>
                            <button
                                type="button"
                                onClick={() => onConfirmDeleteMessage(deleteMessageConfirm, "for_me")}
                                className="text-slate-700 hover:bg-slate-100 border border-slate-200 font-semibold transition-colors"
                                style={{
                                    fontSize: "0.875rem",
                                    padding: "0.625rem 1rem",
                                    borderRadius: "0.625rem",
                                }}
                            >
                                Изтрий само за мен
                            </button>
                            {role && isFromMe(deleteMessageConfirm, role as ChatRole) && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onConfirmDeleteMessage(deleteMessageConfirm, "for_everyone")
                                    }
                                    className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                                    style={{
                                        gap: "0.375rem",
                                        fontSize: "0.875rem",
                                        padding: "0.625rem 1.125rem",
                                        borderRadius: "0.625rem",
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: "1.125rem" }}>
                                        delete_outline
                                    </span>
                                    Изтрий за всички
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
