/**
 * 메일 화면 경로 헬퍼 — 사이드바 메뉴/라우트가 같은 규칙을 쓴다(기준 경로는 MuaConfig.inboxPath, 기본 "/codemarket/mail").
 */

import { DEFAULT_MAIL_INBOX_PATH, getMailInboxPath } from "../internal/pathsRegistry";

/** 코드마켓 받은편지함(전체 계정) 기본 경로 */
export const CODEMARKET_MAIL_INBOX_PATH = DEFAULT_MAIL_INBOX_PATH;

/** 받은편지함(전체 계정) 경로 — Provider 가 등록한 기준 경로. */
export function mailInboxPath(): string {
    return getMailInboxPath();
}

/** 계정별 받은편지함 경로(라우트 `mail/account/:accountSeq`). */
export function mailAccountInboxPath(accountSeq: number, basePath = getMailInboxPath()): string {
    return `${basePath}/account/${accountSeq}`;
}

/** 주소록 경로(라우트 `mail/contacts`). */
export function mailContactsPath(basePath = getMailInboxPath()): string {
    return `${basePath}/contacts`;
}

/** 사용자 메일함 경로(라우트 `mail/folder/:folderSeq`). */
export function mailFolderPath(folderSeq: number, basePath = getMailInboxPath()): string {
    return `${basePath}/folder/${folderSeq}`;
}
