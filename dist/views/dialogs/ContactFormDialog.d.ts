/**
 * 연락처 등록/수정 다이얼로그(mfd) — 이름 · 메일 · 소속 · 전화 · 메모 · 즐겨찾기. 수정 모드는 [메일 보내기] 와 삭제(휴지통 아이콘).
 */
import type { ContactFormController } from "../../controllers/contactFormController";
interface ContactFormDialogProps {
    controller: ContactFormController;
    onCompose?: (email: string, name: string) => void;
}
/** 연락처 다이얼로그 컴포넌트 */
export declare function ContactFormDialog({ controller, onCompose }: ContactFormDialogProps): import("react").JSX.Element;
export {};
