/**
 * 메일 작성 다이얼로그(mfd) — 보내는 계정 · 받는 사람/참조/숨은참조 · 제목 · 에디터 본문 · 첨부 · [임시저장] [보내기].
 */
import type { ComposeController } from "../../controllers/composeController";
import type { MailAccount } from "../../models/types";
interface ComposeDialogProps {
    controller: ComposeController;
    accounts: MailAccount[];
}
/** 작성 다이얼로그 컴포넌트 */
export declare function ComposeDialog({ controller, accounts }: ComposeDialogProps): import("react").JSX.Element;
export {};
