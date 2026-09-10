/**
 * 목록 복수 선택 액션 바 — [삭제] [스팸 등록] [읽음] [읽지 않음] (휴지통: [복원] [영구 삭제], 스팸함: [스팸 아님] [삭제]).
 * 선택 건수 표시 없이 버튼만 나란히 둔다(전체 선택 체크박스가 해제를 맡는다).
 * 데스크탑은 헤더 왼쪽(새 메일 버튼 옆), 모바일은 목록 위 툴바에 아이콘 버튼으로 그려진다.
 */
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
}
/** 복수 선택 액션 바 */
export declare function MailBulkActionBar({ count, folder, compact, onAction, replyEnabled, forwardEnabled, replyAllEnabled, canMarkRead, canMarkUnread, onReply, }: MailBulkActionBarProps): import("react").JSX.Element;
export {};
