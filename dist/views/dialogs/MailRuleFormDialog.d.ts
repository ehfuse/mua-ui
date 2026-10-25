import type { MailRule, MailRuleFormPrefill, MailUserFolder } from "../../models/types";
interface MailRuleFormDialogProps {
    open: boolean;
    rule: MailRule | null;
    prefill?: MailRuleFormPrefill | null;
    folders: MailUserFolder[];
    onClose: () => void;
    onSaved: () => void;
}
/** 규칙 폼 다이얼로그 */
export declare function MailRuleFormDialog({ open, rule, prefill, folders, onClose, onSaved }: MailRuleFormDialogProps): import("react").JSX.Element;
export {};
