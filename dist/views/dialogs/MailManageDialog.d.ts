import type { MailAccount, MailLabel, MailRule, MailUserFolder } from "../../models/types";
/** 관리 탭 키 */
export type MailManageTab = "accounts" | "folders" | "rules" | "labels";
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
    labels?: MailLabel[];
    onLabelsChanged?: (items?: MailLabel[]) => void;
}
/** 메일 관리 다이얼로그 */
export declare function MailManageDialog({ open, tab, onClose, accounts, syncingSeqs, folders, rules, onAddAccount, onEditAccount, onDeleteAccount, onSyncAccount, onReorderAccounts, onFoldersChanged, onAddRule, onEditRule, onRulesChanged, labels, onLabelsChanged, }: MailManageDialogProps): import("react").JSX.Element;
export {};
