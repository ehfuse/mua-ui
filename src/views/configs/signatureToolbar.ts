import type { ToolbarConfig } from "@ehfuse/editor/dist/toolbar/Preset";

/**
 * 서명 편집기 툴바 — 계정 설정(MailAccountFormDialog · MailHostedProfileDialog)과 쓰기 창 본문 아래 서명 칸(ComposeDialog)이 같이 쓴다.
 * 오른쪽 HTML 단추(2026-11-01 사용자 지시) — 다른 곳에서 만든 서명 HTML 을 그대로 붙이거나 고친다.
 */
// 칸은 메일 본문 툴바(emailToolbarOptions)에 맞췄다(2026-11-01 사용자 지시 "서명 에디터 툴바에 기능이 너무 적다") —
// 서명에 잘 쓰지 않는 목록 · 들여쓰기 · 전체 화면만 뺐다.
export const SIGNATURE_TOOLBAR: ToolbarConfig = {
    left: [
        ["font", "size"],
        ["bold", "italic", "underline", "strike"],
        ["color", "bgcolor"],
        ["align", "lineHeight"],
        ["link", "image"],
        ["undo", "redo"],
        ["clear"],
    ],
    right: ["html"],
};
