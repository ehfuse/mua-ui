/**
 * 메일 모듈 기본값.
 */
import type { MailContactForm, ComposeForm, MailAccountForm, MailFilters, MailFolderCounts, MailRuleForm, MailState } from "./types";
/** 폴더 건수 기본값 */
export declare const defaultMailFolderCounts: MailFolderCounts;
/** 고른 갈래를 적어 둔다 — 새로고침해도 보던 탭(별표 등)에 그대로 있게(2026-10-12). */
export declare function storeMailScope(filters: Pick<MailFilters, "unreadOnly" | "starredOnly">): void;
/** 필터 기본값 — 갈래만 새로고침 전에 보던 것을 잇는다. */
export declare const defaultMailFilters: MailFilters;
/** 상태 기본값 */
export declare const defaultMailState: MailState;
/** 계정 폼 기본값(IMAP/SSL) */
export declare const defaultMailAccountForm: MailAccountForm;
/** 작성 폼 기본값 */
export declare const defaultComposeForm: ComposeForm;
/** 연락처 폼 기본값 */
export declare const defaultMailContactForm: MailContactForm;
/** 규칙 폼 기본값 */
export declare const defaultMailRuleForm: MailRuleForm;
