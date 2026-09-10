/** 경로 규칙 등록소 — 사이드바 메뉴 정의처럼 컴포넌트 밖에서도 받은편지함 경로를 알 수 있게 Provider 가 올려 둔다. */
/** 기본 받은편지함 경로 */
export declare const DEFAULT_MAIL_INBOX_PATH = "/codemarket/mail";
/** 경로 규칙을 등록한다(부분 지정 가능). */
export declare function setMuaPaths(next: {
    inboxPath?: string;
    homePath?: string;
}): void;
/** 받은편지함(전체 계정) 경로 */
export declare function getMailInboxPath(): string;
/** 모바일에서 서브페이지를 연 뒤 돌아갈 경로(미지정 시 받은편지함 경로의 상위). */
export declare function getMailHomePath(): string;
