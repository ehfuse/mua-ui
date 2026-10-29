import type { MailMessageDetail, MailMoveTarget, MailMoveTargetOption, MailLabel, MailThreadEntry } from "../../models/types";
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
    /** 이 메일이 든 대화(2026-10-20) — 두 통 이상이면 제목 아래에 띠로 보이고, 누르면 그 메일로 바꾼다. */
    thread?: MailThreadEntry[];
    onSelectThreadMessage?: (seq: number) => void;
    /** 내 라벨 — 주면 단추줄에 라벨 단추가 생기고 제목 아래에 단 라벨이 칩으로 보인다(라벨을 켠 앱만, 2026-10-16). */
    labels?: MailLabel[];
    /** 라벨 단추 — 누른 단추 아래 좌표를 넘긴다(메뉴는 목록 화면이 띄운다: 달기·떼기·새 라벨·관리가 목록과 같은 메뉴다). */
    onOpenLabelMenu?: (position: {
        top: number;
        left: number;
    }) => void;
    /** 새 창으로 열기(0.4.12) — 주면 닫기 X 왼쪽에 아이콘이 생긴다(넓은 화면 상세만). */
    onOpenWindow?: () => void;
}
export declare function MessageDetailPanel(props: MessageDetailPanelProps): import("react").JSX.Element | null;
export {};
