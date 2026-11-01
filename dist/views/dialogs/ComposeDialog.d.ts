import type { ComposeController } from "../../controllers/composeController";
import type { MailAccount } from "../../models/types";
interface ComposeDialogProps {
    controller: ComposeController;
    accounts: MailAccount[];
}
export declare function ComposeDialog({ controller, accounts }: ComposeDialogProps): import("react").JSX.Element;
export {};
