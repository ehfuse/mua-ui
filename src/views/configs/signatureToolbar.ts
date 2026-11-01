import type { ToolbarConfig } from "@ehfuse/editor/dist/toolbar/Preset";

/**
 * 서명 편집기 툴바 — 계정 설정(MailAccountFormDialog · MailHostedProfileDialog)과 쓰기 창 본문 아래 서명 칸(ComposeDialog)이 같이 쓴다.
 * 오른쪽 HTML 단추(2026-11-01 사용자 지시) — 다른 곳에서 만든 서명 HTML 을 그대로 붙이거나 고친다.
 */
export const SIGNATURE_TOOLBAR: ToolbarConfig = {
    left: [["bold", "italic", "underline"], ["color"], ["link", "image"], ["clear"]],
    right: ["html"],
};
