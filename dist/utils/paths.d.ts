/**
 * 메일 화면 경로 헬퍼 — 사이드바 메뉴/라우트가 같은 규칙을 쓴다(기준 경로는 MuaConfig.inboxPath, 기본 "/codemarket/mail").
 */
/** 코드마켓 받은편지함(전체 계정) 기본 경로 */
export declare const CODEMARKET_MAIL_INBOX_PATH = "/codemarket/mail";
/** 받은편지함(전체 계정) 경로 — Provider 가 등록한 기준 경로. */
export declare function mailInboxPath(): string;
/** 계정별 받은편지함 경로(라우트 `mail/account/:accountSeq`). */
export declare function mailAccountInboxPath(accountSeq: number, basePath?: string): string;
/** 주소록 경로(라우트 `mail/contacts`). */
export declare function mailContactsPath(basePath?: string): string;
/** 사용자 메일함 경로(라우트 `mail/folder/:folderSeq`). */
export declare function mailFolderPath(folderSeq: number, basePath?: string): string;
