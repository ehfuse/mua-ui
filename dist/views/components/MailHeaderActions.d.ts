import type { MailAccount } from "../../models/types";
/** 목록 보기 타입 — 목록형(상세는 드로어) / 분할화면(오른쪽 상세 패널) */
export type MailViewMode = "list" | "split";
interface MailHeaderActionsProps {
    accounts: MailAccount[];
    viewMode?: MailViewMode;
    onViewModeChange?: (mode: MailViewMode) => void;
    syncing: boolean;
    onSync: () => void;
    onOpenSettings: () => void;
    /** 휴지통 · 스팸함 비우기(2026-10-27) — 그 폴더를 볼 때만 준다. label 은 단추 풀이(툴팁 · 읽기 프로그램). */
    emptyAction?: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
    };
}
/** 헤더 오른쪽 액션 묶음 */
export declare function MailHeaderActions({ accounts, viewMode, onViewModeChange, syncing, onSync, onOpenSettings, emptyAction, }: MailHeaderActionsProps): import("react").JSX.Element;
export {};
