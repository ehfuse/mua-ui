/**
 * 메일 관리 UI(관리 다이얼로그·계정 폼·규칙 폼) "열어 달라" 요청 스토어다.
 *
 * 이 다이얼로그들은 MailManageHost 한 곳이 그린다 — 메일 화면(Layout) 안일 수도, 앱 대시보드처럼 메일 화면
 * **밖**일 수도 있다(사이드바 메일 그룹의 + 는 어느 화면에서든 눌린다). 여는 쪽은 여기에 요청만 적고,
 * 호스트가 마운트돼 있으면 즉시(구독), 아직 없으면 마운트 때(consume) 연다. 요청은 마지막 것 하나만 남긴다.
 */
import type { MailAccount, MailRule, MailRuleFormPrefill } from "../models/types";
/** 관리 다이얼로그 탭 — views/dialogs/MailManageDialog 와 같은 값(그쪽 import 를 피해 여기서도 선언). */
export type MailManageTab = "accounts" | "folders" | "rules";
export type MailManageRequest = {
    kind: "compose";
    to?: string;
} | {
    kind: "manage";
    tab: MailManageTab;
} | {
    kind: "account";
    account: MailAccount | null;
} | {
    kind: "rule";
    rule: MailRule | null;
    prefill: MailRuleFormPrefill | null;
};
/**
 * 새 메일 작성 창을 연다 — 어느 화면에서든(업무함·결재…) 그 자리에서 열린다.
 * 예전에는 메일 화면의 [메일 쓰기] 버튼뿐이라 새 메일 하나 쓰려고 받은편지함까지 가야 했다(2026-09-06).
 *
 * `to` 를 주면 받는 사람을 채워 연다(2026-09-13) — 앱 본문의 이메일 주소를 누르면 mailto: 로 OS 메일 앱이 뜨는 대신
 * 이 앱의 작성 창이 뜨게 하려는 것이다. 여러 명이면 쉼표로 잇는다(작성 창 입력 형식과 같다).
 */
export declare function requestMailCompose(to?: string): void;
/** 관리 다이얼로그를 연다(기본 계정 탭). */
export declare function requestMailManage(tab?: MailManageTab): void;
/** 메일함 탭으로 관리 다이얼로그를 연다 — 예전 이름(사이드바 우클릭 "메일함 관리")을 그대로 유지한다. */
export declare function requestMailFoldersManage(): void;
/** 계정 등록(null)/수정 폼을 연다. */
export declare function requestMailAccountForm(account?: MailAccount | null): void;
/** 규칙 추가(null)/수정 폼을 연다 — prefill 은 우클릭 "규칙 만들기" 의 보낸 사람 힌트 등. */
export declare function requestMailRuleForm(rule?: MailRule | null, prefill?: MailRuleFormPrefill | null): void;
/** 대기 중인 요청을 가져가고 지운다(호스트 전용). */
export declare function consumeMailManageRequest(): MailManageRequest | null;
/** 요청 변경 구독(호스트가 마운트 동안 건다). */
export declare function subscribeMailManage(listener: () => void): () => void;
