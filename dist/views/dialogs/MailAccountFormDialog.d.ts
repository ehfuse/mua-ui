/**
 * 메일 계정 등록/수정 다이얼로그(mfd) — 기본 · 수신 서버 · 발신 서버 · 서명 + 접속 테스트.
 *
 * 메일 주소를 입력하면 도메인 프리셋(gmail/naver/daum…)으로 호스트/포트를 자동 채운다(이미 입력돼 있으면 건드리지 않는다).
 */
import type { MailAccountFormController } from "../../controllers/mailAccountFormController";
interface MailAccountFormDialogProps {
    controller: MailAccountFormController;
}
/** 메일 계정 다이얼로그 컴포넌트 */
export declare function MailAccountFormDialog({ controller }: MailAccountFormDialogProps): import("react").JSX.Element;
export {};
