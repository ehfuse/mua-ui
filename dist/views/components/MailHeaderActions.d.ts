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
}
/** 헤더 오른쪽 액션 묶음 */
export declare function MailHeaderActions({ accounts, viewMode, onViewModeChange, syncing, onSync, onOpenSettings, }: MailHeaderActionsProps): import("react").JSX.Element;
export {};
