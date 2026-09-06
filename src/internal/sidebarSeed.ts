/**
 * 사이드바 씨앗 — 주입 앱이 자기 bootstrap 응답에 실어 온 메일 계정/메일함/규칙 목록을 한 번 넘겨 두면,
 * 사이드바 훅(useMailSidebarAccounts/useMailSidebarFolders)과 메일 화면(Layout)이 첫 로드 때 서버를 부르는 대신 이것을 쓴다.
 *
 * 로그인 직후 요청 수를 줄이려는 것이다(2026-09-05, 업무함). 씨앗은 한 번 소비되면 지운다 — 이후 갱신은
 * realtime·팀 컨텍스트 알림·메일 화면 경로 그대로다.
 *
 * 채움 표시(markMailSidebarFilled)는 사이드바 훅이 전역 mail-state 에 계정·메일함을 넣었다는 뜻이다.
 * 메일 화면이 뒤에 마운트될 때 그 목록을 다시 읽지 않기 위한 것 — 사이드바 훅이 realtime·팀 전환으로
 * 계속 맞춰 두므로 화면이 이어받아도 어긋나지 않는다(0.3.79).
 */

import type { MailAccount, MailRule, MailUserFolder } from "../models/types";

interface SidebarSeed {
    accounts?: MailAccount[];
    folders?: MailUserFolder[];
    rules?: MailRule[];
}

let seed: SidebarSeed | null = null;
const filled = new Set<"accounts" | "folders">();

/** 씨앗을 둔다(훅이 활성화되기 전에 부른다 — 이미 로드된 뒤에 두면 다음 마운트까지 쓰이지 않는다). */
export function seedMailSidebar(next: SidebarSeed): void {
    seed = { ...(seed ?? {}), ...next };
}

/** 씨앗 한 종류를 꺼내고 지운다(없으면 undefined). */
export function takeMailSidebarSeed<K extends keyof SidebarSeed>(key: K): SidebarSeed[K] {
    if (!seed) return undefined;
    const value = seed[key];
    delete seed[key];
    if (!seed.accounts && !seed.folders && !seed.rules) seed = null;
    return value;
}

/** 사이드바 훅이 전역 mail-state 의 그 목록을 채웠다고 표시한다(훅이 꺼지면 지운다 — 로그아웃 뒤 재로그인 대비). */
export function markMailSidebarFilled(key: "accounts" | "folders", value: boolean): void {
    if (value) filled.add(key);
    else filled.delete(key);
}

/** 사이드바 훅이 그 목록을 채워 두었는지 — 메일 화면 첫 로드가 서버 대신 전역 상태를 이어받을지 판단한다. */
export function isMailSidebarFilled(key: "accounts" | "folders"): boolean {
    return filled.has(key);
}
