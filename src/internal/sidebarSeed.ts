/**
 * 사이드바 씨앗 — 주입 앱이 자기 bootstrap 응답에 실어 온 메일 계정/메일함 목록을 한 번 넘겨 두면,
 * 사이드바 훅(useMailSidebarAccounts/useMailSidebarFolders)이 첫 로드 때 서버를 부르는 대신 이것을 쓴다.
 *
 * 로그인 직후 요청 수를 줄이려는 것이다(2026-09-05, 업무함). 씨앗은 한 번 소비되면 지운다 — 이후 갱신은
 * realtime·팀 컨텍스트 알림·메일 화면 경로 그대로다.
 */

import type { MailAccount, MailUserFolder } from "../models/types";

interface SidebarSeed {
    accounts?: MailAccount[];
    folders?: MailUserFolder[];
}

let seed: SidebarSeed | null = null;

/** 씨앗을 둔다(훅이 활성화되기 전에 부른다 — 이미 로드된 뒤에 두면 다음 마운트까지 쓰이지 않는다). */
export function seedMailSidebar(next: SidebarSeed): void {
    seed = { ...(seed ?? {}), ...next };
}

/** 씨앗 한 종류를 꺼내고 지운다(없으면 undefined). */
export function takeMailSidebarSeed<K extends keyof SidebarSeed>(key: K): SidebarSeed[K] {
    if (!seed) return undefined;
    const value = seed[key];
    delete seed[key];
    if (!seed.accounts && !seed.folders) seed = null;
    return value;
}
