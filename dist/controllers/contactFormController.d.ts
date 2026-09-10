/**
 * 주소록 연락처 등록/수정 다이얼로그 컨트롤러 — useGlobalForm + useModal.
 */
import type { MailContact, MailContactForm } from "../models/types";
import type { MuaModalControl } from "../types/modal";
interface ContactFormControllerOptions {
    onSaved?: (contact: MailContact) => void;
    onRemoved?: (seq: number) => void;
}
/** 연락처 폼 컨트롤러 훅 */
export declare function useContactFormController({ onSaved, onRemoved }?: ContactFormControllerOptions): {
    form: import("@ehfuse/forma").UseGlobalFormReturn<MailContactForm>;
    modal: MuaModalControl;
    removeContact: (seq: number) => Promise<void>;
};
/** 컨트롤러 타입 */
export type ContactFormController = ReturnType<typeof useContactFormController>;
export {};
