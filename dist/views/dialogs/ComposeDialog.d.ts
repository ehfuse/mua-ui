import type { ComposeController } from "../../controllers/composeController";
import type { MailAccount } from "../../models/types";
interface ComposeDialogProps {
    controller: ComposeController;
    accounts: MailAccount[];
}
/** 작성 다이얼로그 컴포넌트 */
export declare function ComposeDialog({ controller, accounts }: ComposeDialogProps): import("react").JSX.Element;
export {};
