// chat types and helpers: message, conversation, role, read status, grouping, formatting

export interface Message {
    id: string;
    student_id: string;
    teacher_id: string;
    message: string;
    created_at: string;
    read_at: string | null;
    read_by_student_at: string | null;
    read_by_teacher_at: string | null;
    is_from_student: boolean;
    attachment_url?: string | null;
    updated_at?: string | null;
    is_edited?: boolean;
    deleted_at?: string | null;
    optimistic?: boolean;
    sendFailed?: boolean;
    reply_to_id?: string | null;
    reply_to?: Message | null;
}

export interface MessageReaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}

export interface Conversation {
    otherUserId: string;
    otherUserName: string;
    otherUserEmail?: string;
    otherUserAvatarUrl?: string;
    lastMessage: string;
    lastTime: string;
    unreadCount: number;
    otherUserLastSeenAt?: string | null;
    otherUserIsOnline?: boolean;
}

export type ChatRole = "student" | "teacher";

export function getOtherUserId(msg: Message, role: ChatRole): string {
    return role === "student" ? msg.teacher_id : msg.student_id;
}

export function getMyMessagesColumn(role: ChatRole): "student_id" | "teacher_id" {
    return role === "student" ? "student_id" : "teacher_id";
}

export function getOtherMessagesColumn(role: ChatRole): "student_id" | "teacher_id" {
    return role === "student" ? "teacher_id" : "student_id";
}

export function isFromMe(msg: Message, role: ChatRole): boolean {
    return role === "student" ? msg.is_from_student : !msg.is_from_student;
}

export function isUnreadForMe(msg: Message, role: ChatRole): boolean {
    if (role === "student") return !msg.is_from_student && !msg.read_by_student_at;
    return msg.is_from_student === true && !msg.read_by_teacher_at;
}

export function getReadAtUpdate(
    role: ChatRole,
    readAt: string
): { read_by_student_at?: string; read_by_teacher_at?: string; read_at: string } {
    return role === "student"
        ? { read_by_student_at: readAt, read_at: readAt }
        : { read_by_teacher_at: readAt, read_at: readAt };
}

export function isMessageForMe(msg: Message, role: ChatRole): boolean {
    return role === "student" ? !msg.is_from_student : msg.is_from_student === true;
}

export function getReadAtForMyMessage(msg: Message, role: ChatRole): string | null {
    return role === "student" ? msg.read_by_teacher_at : msg.read_by_student_at;
}

export function buildMessagePayload(
    role: ChatRole,
    myId: string,
    otherId: string
): { student_id: string; teacher_id: string; is_from_student: boolean } {
    return role === "student"
        ? { student_id: myId, teacher_id: otherId, is_from_student: true }
        : { student_id: otherId, teacher_id: myId, is_from_student: false };
}

// display name for conversation (fallback to email prefix if generic name)
export function getDisplayName(conv: Conversation): string {
    if ((["Ученик", "Учител"] as string[]).includes(conv.otherUserName) && conv.otherUserEmail) {
        const prefix = conv.otherUserEmail.split("@")[0];
        return prefix || conv.otherUserName;
    }
    return conv.otherUserName;
}

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_NAME_DISPLAY_LENGTH = 36;

export function formatFileNameForDisplay(
    name: string,
    maxLen: number = MAX_FILE_NAME_DISPLAY_LENGTH
): string {
    if (!name || name.length <= maxLen) return name;
    const lastDot = name.lastIndexOf(".");
    const ext = lastDot > 0 ? name.slice(lastDot) : "";
    const base = lastDot > 0 ? name.slice(0, lastDot) : name;
    const take = maxLen - ext.length - 3;
    if (take < 1) return name.slice(0, maxLen - 3) + "...";
    return base.slice(0, take) + "..." + ext;
}

export const MESSAGES_PAGE_SIZE = 80;

// group messages by date (today, yesterday, or full date)
const GROUP_MAX_MINUTES = 5;

export function groupMessagesByDate(msgs: Message[]): { [key: string]: Message[] } {
    const groups: { [key: string]: Message[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    msgs.forEach((msg) => {
        const msgDate = new Date(msg.created_at);
        const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

        let dateKey: string;
        if (msgDateOnly.getTime() === today.getTime()) {
            dateKey = "today";
        } else if (msgDateOnly.getTime() === yesterday.getTime()) {
            dateKey = "yesterday";
        } else {
            dateKey = msgDateOnly.toLocaleDateString("bg-BG", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        }

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(msg);
    });

    return groups;
}

// group consecutive messages from same sender within GROUP_MAX_MINUTES
export function groupMessagesBySender(
    msgs: Message[],
    role: ChatRole
): { isMine: boolean; messages: Message[] }[] {
    if (msgs.length === 0) return [];
    const result: { isMine: boolean; messages: Message[] }[] = [];
    let current: { isMine: boolean; messages: Message[] } = {
        isMine: isFromMe(msgs[0], role),
        messages: [msgs[0]],
    };
    for (let i = 1; i < msgs.length; i++) {
        const msg = msgs[i];
        const msgIsMine = isFromMe(msg, role);
        const prevTime = new Date(msgs[i - 1].created_at).getTime();
        const currTime = new Date(msg.created_at).getTime();
        const sameSender = msgIsMine === current.isMine;
        const withinMinutes = (currTime - prevTime) / (60 * 1000) <= GROUP_MAX_MINUTES;
        if (sameSender && withinMinutes) {
            current.messages.push(msg);
        } else {
            result.push(current);
            current = { isMine: msgIsMine, messages: [msg] };
        }
    }
    result.push(current);
    return result;
}

export function formatDateLabel(dateKey: string): string {
    if (dateKey === "today") return "Днес";
    if (dateKey === "yesterday") return "Вчера";
    return dateKey;
}

// time or short date+time for message timestamp
export function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (msgDate.getTime() === today.getTime()) {
        return d.toLocaleTimeString("bg-BG", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    return d.toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// short label for sidebar (today, yesterday, or day + month)
export function formatDateShort(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (msgDate.getTime() === today.getTime()) return "Днес";
    if (msgDate.getTime() === yesterday.getTime()) return "Вчера";
    return d.toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "short",
    });
}

export function formatFullDate(iso: string): string {
    return new Date(iso).toLocaleString("bg-BG", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;


export function isConversationUserOnline(conv: Conversation): boolean {
    if (conv.otherUserLastSeenAt) {
        const seen = new Date(conv.otherUserLastSeenAt).getTime();
        return Date.now() - seen < ONLINE_THRESHOLD_MS;
    }
    return conv.otherUserIsOnline === true;
}

export function formatLastSeen(iso: string | null | undefined): string {
    if (!iso) return "Никога";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return "Току-що";
    if (diffMin < 60) return `Преди ${diffMin} мин.`;
    if (diffHours < 24) return `Преди ${diffHours} ч.`;
    if (diffDays === 1) return "Вчера";
    if (diffDays < 7) return `Преди ${diffDays} дни`;
    return d.toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
}

// emojis for quick access
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

// emoji picker list
export const EMOJI_LIST = [
    "😀", "😊", "😂", "👍", "❤️", "😍", "🙏", "😅", "😢", "😡",
    "👎", "✨", "🔥", "🎉", "💯", "👋", "😎", "🥳", "🤔", "💪",
];
