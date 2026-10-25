import type { MailAccount } from "../../models/types";
interface MailHostedProfileDialogProps {
    open: boolean;
    account: MailAccount | null;
    onClose: () => void;
    onSaved: () => void;
}
export declare function MailHostedProfileDialog({ open, account, onClose, onSaved }: MailHostedProfileDialogProps): import("react").JSX.Element;
export {};
