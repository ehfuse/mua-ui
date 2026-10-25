import type { ContactFormController } from "../../controllers/contactFormController";
interface ContactFormDialogProps {
    controller: ContactFormController;
    onCompose?: (email: string, name: string) => void;
}
/** 연락처 다이얼로그 컴포넌트 */
export declare function ContactFormDialog({ controller, onCompose }: ContactFormDialogProps): import("react").JSX.Element;
export {};
