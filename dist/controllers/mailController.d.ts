/**
 * 메일 화면 컨트롤러 — 전역 상태 + 액션 조립.
 */
import type { MailState } from "../models/types";
/** 메일 상태 id */
export declare const MAIL_STATE_ID = "mail-state";
/** 메일 화면 컨트롤러 훅. */
export declare function useMailController(): {
    state: import("@ehfuse/forma").UseGlobalFormaStateReturn<MailState>;
};
/** 컨트롤러 타입 */
export type MailController = ReturnType<typeof useMailController>;
