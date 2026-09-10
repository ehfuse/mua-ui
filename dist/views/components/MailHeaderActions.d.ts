/**
 * 메일 헤더 오른쪽 액션 — 새로고침(동기화) · 계정 설정(톱니). (계정 선택 버튼은 검색칸 옆 필터 그룹에 있다)
 */
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
