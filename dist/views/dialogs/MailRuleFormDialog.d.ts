import type { MailRule, MailRuleFormPrefill, MailLabel, MailUserFolder } from "../../models/types";
interface MailRuleFormDialogProps {
    open: boolean;
    rule: MailRule | null;
    prefill?: MailRuleFormPrefill | null;
    folders: MailUserFolder[];
    labels?: MailLabel[];
    onFoldersChanged?: () => void;
    onLabelsChanged?: () => void;
    onClose: () => void;
    onSaved: () => void;
}
/** 규칙 폼 다이얼로그 */
export declare function MailRuleFormDialog({ open, rule, prefill, folders: folderProp, labels: labelProp, onFoldersChanged, onLabelsChanged, onClose, onSaved }: MailRuleFormDialogProps): import("react").JSX.Element;
export {};
