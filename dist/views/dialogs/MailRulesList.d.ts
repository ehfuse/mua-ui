import type { MailRule, MailUserFolder } from "../../models/types";
interface MailRulesListProps {
    rules: MailRule[];
    folders: MailUserFolder[];
    onEdit: (rule: MailRule) => void;
    onChanged: () => void;
}
/** 규칙 목록(드래그로 순서 변경 → 서버 저장) */
export declare function MailRulesList({ rules, folders, onEdit, onChanged }: MailRulesListProps): import("react").JSX.Element;
export {};
