/**
 * 규칙 등록/수정(mfd) — 이름 · 조건(대상/비교/값, 여러 개 + 모두/하나라도) · 동작(이동/읽음/중요) · 사용 · 뒤 규칙 중단.
 * 폼은 로컬 상태로 다룬다(조건 배열 편집이 잦아 forma 바인딩보다 단순하다).
 */
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
