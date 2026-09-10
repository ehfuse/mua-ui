/**
 * 규칙 목록(메일 관리 다이얼로그의 "규칙" 탭) — 규칙마다 조건 요약·동작 요약·사용 스위치·[지금 적용]·수정·삭제.
 */
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
