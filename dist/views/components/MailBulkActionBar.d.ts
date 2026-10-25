import type { BulkMessageAction } from "../../apis/mailApi";
import type { MailListFolder } from "../../models/types";
interface MailBulkActionBarProps {
    count: number;
    folder: MailListFolder;
    compact?: boolean;
    onAction: (action: BulkMessageAction) => void;
    replyEnabled?: boolean;
    forwardEnabled?: boolean;
    replyAllEnabled?: boolean;
    canMarkRead?: boolean;
    canMarkUnread?: boolean;
    onReply?: (mode: "reply" | "replyAll" | "forward") => void;
    onLabel?: (anchorEl: HTMLElement) => void;
}
/** 복수 선택 액션 바 */
export declare function MailBulkActionBar({ count, folder, compact, onAction, replyEnabled, forwardEnabled, replyAllEnabled, canMarkRead, canMarkUnread, onReply, onLabel, }: MailBulkActionBarProps): import("react").JSX.Element;
export {};
