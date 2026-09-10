/**
 * 사이드바 씨앗 — 주입 앱이 자기 bootstrap 응답에 실어 온 메일 계정/메일함/규칙 목록을 한 번 넘겨 두면,
 * 사이드바 훅(useMailSidebarAccounts/useMailSidebarFolders)과 메일 화면(Layout)이 첫 로드 때 서버를 부르는 대신 이것을 쓴다.
 *
 * 로그인 직후 요청 수를 줄이려는 것이다(2026-09-05, 업무함). 씨앗은 한 번 소비되면 지운다 — 이후 갱신은
 * realtime·팀 컨텍스트 알림·메일 화면 경로 그대로다.
 *
 * 채움 표시(markMailSidebarFilled)는 누군가(사이드바 훅 또는 메일 화면) 전역 mail-state 에 계정·메일함을 넣었다는 뜻이다.
 * 뒤에 마운트되는 쪽은 그 목록을 다시 읽지 않는다 — 사이드바 훅이 realtime·팀 전환으로 계속 맞춰 두므로
 * 이어받아도 어긋나지 않는다(0.3.79).
 *
 * 보류(setMailSeedPending)는 앱이 "bootstrap 응답이 오면 씨앗을 줄 테니 그때까지 첫 조회를 미뤄라" 는 뜻이다.
 * 메일 경로에서 새로고침하면 메일 화면(자식 라우트)의 effect 가 셸의 사이드바 훅보다 먼저 돌아,
 * 씨앗도 채움 표시도 없는 상태로 서버를 세 번 읽던 것을 막는다(실측 2026-09-06).
 */
import type { MailAccount, MailRule, MailUserFolder } from "../models/types";
interface SidebarSeed {
    accounts?: MailAccount[];
    folders?: MailUserFolder[];
    rules?: MailRule[];
}
/** 씨앗을 둔다(훅이 활성화되기 전에 부른다 — 이미 로드된 뒤에 두면 다음 마운트까지 쓰이지 않는다). */
export declare function seedMailSidebar(next: SidebarSeed): void;
/** 씨앗 한 종류를 꺼내고 지운다(없으면 undefined). */
export declare function takeMailSidebarSeed<K extends keyof SidebarSeed>(key: K): SidebarSeed[K];
/** 사이드바 훅이 전역 mail-state 의 그 목록을 채웠다고 표시한다(훅이 꺼지면 지운다 — 로그아웃 뒤 재로그인 대비). */
export declare function markMailSidebarFilled(key: "accounts" | "folders", value: boolean): void;
/** 사이드바 훅이 그 목록을 채워 두었는지 — 메일 화면 첫 로드가 서버 대신 전역 상태를 이어받을지 판단한다. */
export declare function isMailSidebarFilled(key: "accounts" | "folders"): boolean;
/** 앱이 씨앗을 줄 때까지 메일 화면의 첫 조회를 보류/해제한다(bootstrap 시작 때 true, 씨앗을 둔 뒤·실패 뒤 false). */
export declare function setMailSeedPending(value: boolean): void;
/** 보류 상태 구독 — 메일 화면 첫 로드 effect 가 해제 순간 다시 돈다. */
export declare function useMailSeedPending(): boolean;
export {};
