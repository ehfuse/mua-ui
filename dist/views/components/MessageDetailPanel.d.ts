/**
 * 메일 상세 패널 — 헤더(제목/주소/일시) · 액션(답장/전체답장/전달/휴지통/복원/삭제) · 첨부 · 본문.
 */
import type { MailMessageDetail, MailMoveTarget, MailMoveTargetOption, MailLabel } from "../../models/types";
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
    /** 내 라벨 — 주면 단추줄에 라벨 단추가 생기고 제목 아래에 단 라벨이 칩으로 보인다(라벨을 켠 앱만, 2026-10-16). */
    labels?: MailLabel[];
    /** 라벨 단추 — 누른 단추 아래 좌표를 넘긴다(메뉴는 목록 화면이 띄운다: 달기·떼기·새 라벨·관리가 목록과 같은 메뉴다). */
    onOpenLabelMenu?: (position: {
        top: number;
        left: number;
    }) => void;
}
/** 상세 패널 컴포넌트 */
export declare function MessageDetailPanel(props: MessageDetailPanelProps): import("react").JSX.Element | null;
export {};
