/**
 * 기업메일 사서함 프로필 다이얼로그 — 보내는 사람 이름 · 기본 발신 · 서명.
 *
 * 사서함 자체(주소·수신/발신 서버·담당자)는 팀 관리 › 기업메일 소관이라 여기서 못 고친다.
 * 하지만 **보내는 사람 이름과 서명은 사서함 설정이 아니라 쓰는 사람의 것**이라(같은 주소라도 담당이 바뀌면
 * 이름·서명이 따라 바뀐다) 계정 목록의 연필에서 바로 고칠 수 있어야 한다(2026-09-07).
 * 외부 계정 폼(MailAccountFormDialog)을 재사용하지 않는 이유는 그쪽이 호스트·포트·비밀번호를 필수로 검증하고
 * 저장 시 행 전체를 다시 쓰기 때문이다 — 여기서 열면 Postfix 가 읽는 값까지 덮어쓴다.
 */
import type { MailAccount } from "../../models/types";
interface MailHostedProfileDialogProps {
    open: boolean;
    account: MailAccount | null;
    onClose: () => void;
    onSaved: () => void;
}
export declare function MailHostedProfileDialog({ open, account, onClose, onSaved }: MailHostedProfileDialogProps): import("react").JSX.Element;
export {};
