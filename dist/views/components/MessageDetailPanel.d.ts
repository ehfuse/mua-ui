/**
 * 메일 상세 패널 — 헤더(제목/주소/일시) · 액션(답장/전체답장/전달/휴지통/복원/삭제) · 첨부 · 본문.
 */
import type { MailMessageDetail, MailMoveTarget, MailMoveTargetOption } from "../../models/types";
interface MessageDetailPanelProps {
    detail: MailMessageDetail | null;
    loading: boolean;
    onClose: () => void;
    onReply: (mode: "reply" | "replyAll" | "forward") => void;
    onEditDraft: () => void;
    onComposeTo: (address: string) => void;
    onAddContact?: (address: string, name: string) => void;
    trustedSender?: boolean;
    onToggleStar: () => void;
    onMarkUnread: () => void;
    onTrash: () => void;
    onSpam: () => void;
    onRestore: () => void;
    onDeleteForever: () => void;
    moveTargets?: MailMoveTargetOption[];
    onMove?: (target: MailMoveTarget) => void;
    onCreateRule?: () => void;
    onTranslationShownChange?: (shown: boolean, translatedSubject: string | null) => void;
    /**
     * 모바일 mfd 상세 다이얼로그 본문으로 쓰일 때 true — 닫기 X 를 숨기고(제목바 ← 가 닫는다),
     * 자체 세로 스크롤러 대신 내용 높이만큼 늘어나 다이얼로그 스크롤에 맡긴다.
     */
    embedded?: boolean;
}
/** 상세 패널 컴포넌트 */
export declare function MessageDetailPanel(props: MessageDetailPanelProps): import("react").JSX.Element | null;
export {};
