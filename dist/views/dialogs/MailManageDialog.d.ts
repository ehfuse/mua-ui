/**
 * 메일 관리 다이얼로그 — 계정 / 메일함 / 규칙 중 **하나**를 창 하나로 연다(2026-10-01).
 * 전에는 세 목록을 상단 탭(switchContent)으로 한 창에 두었는데, 메일함·규칙을 찾으려면 창을 열고 탭을 다시 골라야 했다.
 * 이제 사이드바 메일 ⋮ 메뉴가 "메일 계정 관리 / 메일함 관리 / 메일 규칙" 을 따로 고르고, 창은 고른 목록만 보인다(탭 없음).
 * 액션바 왼쪽 [+ …]는 그 목록에 맞춰 바뀌고(계정 추가 / 메일함 만들기 / 규칙 추가), 오른쪽은 [닫기].
 */
import type { MailAccount, MailRule, MailUserFolder } from "../../models/types";
/** 관리 탭 키 */
export type MailManageTab = "accounts" | "folders" | "rules";
interface MailManageDialogProps {
    open: boolean;
    tab: MailManageTab;
    onTabChange?: (tab: MailManageTab) => void;
    onClose: () => void;
    accounts: MailAccount[];
    syncingSeqs: number[];
    folders: MailUserFolder[];
    rules: MailRule[];
    onAddAccount: () => void;
    onEditAccount: (account: MailAccount) => void;
    onDeleteAccount: (account: MailAccount) => void;
    onSyncAccount: (account: MailAccount) => void;
    onReorderAccounts?: (seqs: number[]) => void;
    onFoldersChanged: () => void;
    onAddRule: () => void;
    onEditRule: (rule: MailRule) => void;
    onRulesChanged: () => void;
}
/** 메일 관리 다이얼로그 */
export declare function MailManageDialog({ open, tab, onClose, accounts, syncingSeqs, folders, rules, onAddAccount, onEditAccount, onDeleteAccount, onSyncAccount, onReorderAccounts, onFoldersChanged, onAddRule, onEditRule, onRulesChanged, }: MailManageDialogProps): import("react").JSX.Element;
export {};
