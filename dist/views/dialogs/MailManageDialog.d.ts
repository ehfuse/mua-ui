/**
 * 메일 관리 다이얼로그 — 계정 / 메일함 / 규칙을 상단 탭(switchContent)으로 한 곳에서 관리한다.
 * 헤더 ⚙ = 계정 탭, 사이드바 메일 그룹의 ⚙ = 메일함 탭, 헤더 [규칙] = 규칙 탭으로 열린다.
 * 액션바 왼쪽 [+ …]는 활성 탭에 맞춰 바뀌고(계정 추가 / 만들기 / 규칙 추가), 오른쪽은 [닫기].
 */
import type { MailAccount, MailRule, MailUserFolder } from "../../models/types";
/** 관리 탭 키 */
export type MailManageTab = "accounts" | "folders" | "rules";
interface MailManageDialogProps {
    open: boolean;
    tab: MailManageTab;
    onTabChange: (tab: MailManageTab) => void;
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
export declare function MailManageDialog({ open, tab, onTabChange, onClose, accounts, syncingSeqs, folders, rules, onAddAccount, onEditAccount, onDeleteAccount, onSyncAccount, onReorderAccounts, onFoldersChanged, onAddRule, onEditRule, onRulesChanged, }: MailManageDialogProps): import("react").JSX.Element;
export {};
