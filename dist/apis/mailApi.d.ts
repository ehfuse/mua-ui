/**
 * 메일(MUA) API 래퍼 — AS /v1/mua/* (entityAppServer 직접 호출, 오류는 throw).
 */
import type { ComposeRequest, MailAccount, MailAccountRequest, MailHostedProfileRequest, MailAccountSecrets, MailConnectionTestResult, MailContact, MailContactRequest, MailFolder, MailFolderCounts, MailListFolder, MailTranslation, MailMessageDetail, MailMessageListItem, MailMoveTarget, MailRule, MailRuleRequest, MailSyncResult, MailUserFolder } from "../models/types";
/** AS 표준 응답 */
interface ApiOk<T> {
    ok: boolean;
    data: T;
    error?: string;
}
/** 목록 조회 파라미터 */
export interface ListMessagesParams {
    mail_folder_seq?: number;
    mail_account_seq: number;
    folder: MailListFolder;
    page: number;
    limit: number;
    search?: string;
    unread?: boolean;
    starred?: boolean;
}
/** 목록 응답 */
export interface ListMessagesResponse {
    items: MailMessageListItem[];
    total: number;
    page: number;
    limit: number;
}
/** 일괄 처리 액션 */
export type BulkMessageAction = "read" | "unread" | "star" | "unstar" | "trash" | "spam" | "restore" | "delete" | "move";
/** 진입 부트스트랩 응답 — 각 목록은 GET /accounts · /folders · /rules 의 items 와 같다. */
export interface MailBootstrapData {
    accounts: MailAccount[];
    folders: MailUserFolder[];
    rules: MailRule[];
}
/** 메일 API */
export declare const mailApi: {
    /** 진입 1회 — 계정·메일함·규칙을 한 번에(사이드바+메일 화면이 나눠 쓴다) */
    bootstrap: () => Promise<ApiOk<MailBootstrapData>>;
    /** 내 메일 계정 목록 */
    listAccounts: () => Promise<ApiOk<{
        items: MailAccount[];
    }>>;
    /** 계정 표시 순서 저장 — 새 목록을 그대로 돌려받아 다시 조회하지 않는다. */
    reorderAccounts: (seqs: number[]) => Promise<ApiOk<{
        items: MailAccount[];
    }>>;
    /** 계정 등록 */
    createAccount: (body: MailAccountRequest) => Promise<ApiOk<MailAccount>>;
    /** 계정 수정 */
    updateAccount: (seq: number, body: MailAccountRequest) => Promise<ApiOk<MailAccount>>;
    /**
     * 기업메일 사서함 프로필 수정 — 표시 이름·서명·기본 발신만. 같은 PATCH 를 쓰지만 본문이 이 셋뿐이라
     * 서버가 hosted 전용 경로로 받는다(수신/발신 서버 값은 아예 보내지 않는다).
     */
    updateHostedProfile: (seq: number, body: MailHostedProfileRequest) => Promise<ApiOk<MailAccount>>;
    /** 계정 삭제 */
    deleteAccount: (seq: number) => Promise<ApiOk<{
        deleted: boolean;
    }>>;
    /** 접속 테스트 */
    testAccount: (body: MailAccountRequest) => Promise<ApiOk<MailConnectionTestResult>>;
    /** 즉시 동기화 */
    syncAccount: (seq: number) => Promise<ApiOk<MailSyncResult>>;
    /** 저장된 비밀번호(수정 폼 채우기) */
    getAccountSecrets: (seq: number) => Promise<ApiOk<MailAccountSecrets>>;
    /** 건수 */
    counts: (mailAccountSeq: number) => Promise<ApiOk<{
        by_account: Record<string, number>;
        by_folder?: Record<string, number>;
        folders: MailFolderCounts;
    }>>;
    /** 목록 */
    listMessages: (params: ListMessagesParams) => Promise<ApiOk<ListMessagesResponse>>;
    /** 상세(+읽음 처리) */
    /** 제목·본문 AI 번역(Gemini) — 저장 안 함, 실패는 throw(502/503). */
    translateMessage: (seq: number, target?: string) => Promise<ApiOk<MailTranslation>>;
    getMessage: (seq: number, markRead: boolean) => Promise<ApiOk<MailMessageDetail>>;
    /** 읽음/중요/폴더 변경 */
    patchMessage: (seq: number, body: {
        is_read?: boolean;
        is_starred?: boolean;
        folder?: MailFolder | "restore";
        translation_shown?: boolean;
    }) => Promise<ApiOk<MailMessageDetail>>;
    /** 일괄 처리 */
    bulkMessages: (seqs: number[], action: BulkMessageAction, move?: MailMoveTarget) => Promise<ApiOk<{
        affected: number;
    }>>;
    /** 사용자 화면 설정(보기 타입) */
    getPreferences: () => Promise<ApiOk<{
        view_mode: "list" | "split";
        last_account_seq: number;
    }>>;
    /** 사용자 화면 설정 저장 */
    updatePreferences: (body: {
        view_mode?: "list" | "split";
        last_account_seq?: number;
    }) => Promise<ApiOk<{
        view_mode: "list" | "split";
        last_account_seq: number;
    }>>;
    /** 사용자 메일함 목록 */
    listFolders: () => Promise<ApiOk<{
        items: MailUserFolder[];
    }>>;
    /** 메일함 추가 */
    createFolder: (body: {
        name: string;
        scope?: "personal" | "shared";
        team_seq?: number;
        icon?: string;
        color?: string;
    }) => Promise<ApiOk<MailUserFolder>>;
    /** 메일함 수정 */
    updateFolder: (seq: number, body: {
        name?: string;
        sort_order?: number;
        scope?: "personal" | "shared";
        team_seq?: number;
        icon?: string;
        color?: string;
    }) => Promise<ApiOk<MailUserFolder>>;
    /** 메일함 삭제(메일은 받은편지함으로) */
    deleteFolder: (seq: number) => Promise<ApiOk<{
        deleted: boolean;
        moved: number;
    }>>;
    /** 규칙 목록 */
    listRules: () => Promise<ApiOk<{
        items: MailRule[];
    }>>;
    /** 규칙 추가 */
    createRule: (body: MailRuleRequest) => Promise<ApiOk<MailRule>>;
    /** 규칙 수정 */
    updateRule: (seq: number, body: MailRuleRequest) => Promise<ApiOk<MailRule>>;
    /** 규칙 삭제 */
    reorderRules: (seqs: number[]) => Promise<ApiOk<{
        updated: number;
    }>>;
    deleteRule: (seq: number) => Promise<ApiOk<{
        deleted: boolean;
    }>>;
    /** 규칙 지금 적용(seq=0 이면 전체) — 내가 소유한 계정의 받은편지함 최근 1000건 */
    applyRules: (seq: number) => Promise<ApiOk<{
        scanned: number;
        affected: number;
    }>>;
    /** 영구 삭제 */
    deleteMessage: (seq: number) => Promise<ApiOk<{
        deleted: boolean;
    }>>;
    /** 발송 */
    send: (body: ComposeRequest) => Promise<ApiOk<{
        seq: number;
        message_id: string;
    }>>;
    /** 임시보관 저장 */
    saveDraft: (body: ComposeRequest) => Promise<ApiOk<MailMessageDetail>>;
    /** 주소록 목록(이름/메일 검색) */
    listContacts: (search?: string) => Promise<ApiOk<{
        items: MailContact[];
        total: number;
    }>>;
    /** 연락처 등록(같은 주소가 있으면 ok:false + 409 문구, data = 기존 행) */
    createContact: (body: MailContactRequest) => Promise<ApiOk<MailContact>>;
    /** 연락처 수정 */
    updateContact: (seq: number, body: MailContactRequest) => Promise<ApiOk<MailContact>>;
    /** 연락처 삭제 */
    deleteContact: (seq: number) => Promise<ApiOk<{
        deleted: boolean;
    }>>;
    /** 첨부 다운로드(ES 파일 스토리지, 앵커 mail_message) */
    downloadAttachment: (uuid: string) => Promise<ArrayBuffer>;
};
/** 응답에서 data 를 꺼내고 실패면 throw 한다. */
export declare function unwrap<T>(res: ApiOk<T> | null | undefined, fallbackMessage: string): T;
export {};
