import type { ContactFormController } from "../../controllers/contactFormController";
import type { MailLabel } from "../../models/types";
interface ContactFormDialogProps {
    controller: ContactFormController;
    onCompose?: (email: string, name: string) => void;
    labels?: MailLabel[];
}
/** 연락처 다이얼로그 컴포넌트 */
export declare function ContactFormDialog({ controller, onCompose, labels }: ContactFormDialogProps): import("react").JSX.Element;
export {};
