import type { MailLabel } from "../../models/types";
/** 갈래 — 전체 · 안 읽음 · 별표 · 라벨. */
export type MailMobileScope = "all" | "unread" | "starred" | "label";
interface MailMobileTopProps {
    scope: MailMobileScope;
    onScopeChange: (scope: MailMobileScope) => void;
    unreadCount: number;
    searchOpen: boolean;
    search: string;
    onSearch: (keyword: string) => void;
    /** 내 라벨 — 주면 "라벨" 탭이 생긴다(라벨 기능을 켠 앱만). */
    labels?: MailLabel[];
    labelSeq?: number;
    onLabelChange?: (labelSeq: number) => void;
    onManageLabels?: () => void;
    /** 화면 본문의 좌우·위 여백(px) — 그만큼 밖으로 빼 화면 끝과 제목 줄에 붙인다. */
    bleed?: number;
}
export declare function MailMobileTop({ scope, onScopeChange, unreadCount, searchOpen, search, onSearch, labels, labelSeq, onLabelChange, onManageLabels, bleed, }: MailMobileTopProps): import("react").JSX.Element;
export {};
