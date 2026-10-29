/**
 * 메일(MUA) API 래퍼 — AS /v1/mua/* (entityAppServer 직접 호출, 오류는 throw).
 */
import type { ComposeRequest, MailAccount, MailAccountRequest, MailHostedProfileRequest, MailAccountSecrets, MailConnectionTestResult, MailContact, MailContactRequest, MailFolder, MailFolderCounts, MailLabel, MailListFolder, MailTranslation, MailMessageDetail, MailMessageListItem, MailMoveTarget, MailReceipt, MailRule, MailRuleRequest, MailSyncResult, MailUserFolder } from "../models/types";
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
    label_seq?: number;
    thread?: boolean;
}
/** 대화 안의 메일 한 통(본문 없이 머리만) — GET /messages/:seq/thread */
export interface MailThreadItem {
    seq: number;
    folder: string;
    from_name: string | null;
    from_address: string | null;
    to_summary: string | null;
    subject: string | null;
    snippet: string | null;
    date_time: string | null;
    is_read: boolean;
    has_attachment: boolean;
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
/** 원문 보기 응답 */
export interface MailMessageSource {
    source: string;
    rebuilt: boolean;
    truncated: boolean;
    size: number;
    file_name: string;
}
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
    /** 서명만 저장(0.3.154) — 메일 쓰기 창의 [기본 서명으로 저장]. 서버 PATCH /v1/mua/accounts/:seq/signature 가 있어야 한다. */
    updateSignature: (seq: number, signature: string) => Promise<ApiOk<MailAccount>>;
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
    /** 원문(RFC 822) — 기업메일은 받은 원문, 외부 계정은 다시 만든 것(rebuilt). full=true 면 잘리지 않은 전체. */
    getMessageSource: (seq: number, full?: boolean) => Promise<ApiOk<MailMessageSource>>;
    /** 이 메일이 든 대화의 메일들(오래된 것부터). markRead 면 같은 폴더의 안 읽은 메일을 함께 읽음으로. */
    getThread: (seq: number, markRead: boolean) => Promise<ApiOk<{
        items: MailThreadItem[];
    }>>;
    getMessage: (seq: number, markRead: boolean) => Promise<ApiOk<MailMessageDetail>>;
    /** 읽음/중요/폴더 변경 */
    patchMessage: (seq: number, body: {
        is_read?: boolean;
        is_starred?: boolean;
        folder?: MailFolder | "restore";
        translation_shown?: boolean;
    }) => Promise<ApiOk<MailMessageDetail>>;
    /** 일괄 처리 */
    /** threads — 대화로 묶은 목록의 줄이면 같은 폴더의 같은 대화 메일 전부에 적용한다(별표는 그 줄에만). */
    bulkMessages: (seqs: number[], action: BulkMessageAction, move?: MailMoveTarget, threads?: boolean) => Promise<ApiOk<{
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
    /** 내 색상 라벨(순서대로) — config.labels 를 켠 앱만 부른다 */
    listLabels: () => Promise<ApiOk<{
        items: MailLabel[];
    }>>;
    /** 라벨 만들기(맨 뒤) — 같은 이름이면 ok:false */
    createLabel: (body: {
        name: string;
        color: string;
    }) => Promise<ApiOk<MailLabel>>;
    /** 라벨 이름·색 고치기 */
    updateLabel: (seq: number, body: {
        name?: string;
        color?: string;
    }) => Promise<ApiOk<MailLabel>>;
    /** 라벨 순서 — 새 목록을 돌려받는다 */
    reorderLabels: (seqs: number[]) => Promise<ApiOk<{
        items: MailLabel[];
    }>>;
    /** 라벨 지우기 — 단 메일에서도 떼어진다(메일은 그대로) */
    deleteLabel: (seq: number) => Promise<ApiOk<{
        deleted: boolean;
        detached: number;
    }>>;
    /** 휴지통 · 스팸함 비우기(영구 삭제) — mailAccountSeq 0 이면 내가 쓸 수 있는 모든 계정 */
    emptySpecialFolder: (folder: "trash" | "spam", mailAccountSeq?: number) => Promise<ApiOk<{
        deleted: number;
    }>>;
    /** 사서함 사용량 · 스팸 수 · 크기(기업메일 사서함만 한도가 있다 — 받은편지함 탭 줄 게이지, 2026-10-27) */
    getAccountUsage: (seq: number) => Promise<ApiOk<{
        seq: number;
        kind: string;
        quota_mb: number;
        used_bytes: number;
        spam_count: number;
        spam_bytes: number;
    }>>;
    /** 주소록 전용 라벨(2026-10-27 — 메일 라벨과 따로). 모양 · 규칙은 메일 라벨과 같다. */
    listContactLabels: () => Promise<ApiOk<{
        items: MailLabel[];
    }>>;
    createContactLabel: (body: {
        name: string;
        color: string;
    }) => Promise<ApiOk<MailLabel>>;
    updateContactLabel: (seq: number, body: {
        name?: string;
        color?: string;
    }) => Promise<ApiOk<MailLabel>>;
    reorderContactLabels: (seqs: number[]) => Promise<ApiOk<{
        items: MailLabel[];
    }>>;
    deleteContactLabel: (seq: number) => Promise<ApiOk<{
        deleted: boolean;
        detached: number;
    }>>;
    /** 여러 메일에 라벨 달기·떼기 */
    applyLabels: (seqs: number[], add: number[], remove: number[]) => Promise<ApiOk<{
        affected: number;
        changed: number;
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
    /** 메일함 비우기 — 안의 메일을 휴지통으로 옮긴다(되돌리면 이 메일함으로 돌아온다). */
    emptyFolder: (seq: number) => Promise<ApiOk<{
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
        failed_recipients?: string[];
        scheduled?: boolean;
        pending?: boolean;
    }>>;
    /** 발송 실패로 남은 보낸편지함 메일을 다시 보낸다(뒤에서) */
    resend: (seq: number) => Promise<ApiOk<{
        seq: number;
        pending: boolean;
    }>>;
    /** 보낸 메일의 받는 사람별 수신확인 */
    receipts: (seq: number) => Promise<ApiOk<{
        items: MailReceipt[];
    }>>;
    /** 임시보관 저장 */
    saveDraft: (body: ComposeRequest) => Promise<ApiOk<MailMessageDetail>>;
    /**
     * 임시보관 저장 — 같은 본문을 multipart 로 보내 올라간 양을 알린다(0.4.18). 새로 붙인 첨부가 있을 때 쓴다(게이지가 몇 % 인지 보이게).
     * onProgress(올린 바이트, 전체 바이트).
     */
    saveDraftWithProgress: (body: ComposeRequest, onProgress: (loaded: number, total: number) => void) => Promise<ApiOk<MailMessageDetail>>;
    /** 주소록 목록(이름/메일 검색) */
    listContacts: (search?: string) => Promise<ApiOk<{
        items: MailContact[];
        total: number;
    }>>;
    /** 연락처 등록(같은 주소가 있으면 ok:false + 409 문구, data = 기존 행) */
    /** 내가 한 번이라도 메일을 보낸 주소(많이 보낸 차례) — 받는 사람 고르기 창의 "보낸 주소" 묶음(2026-10-27) */
    listSentRecipients: () => Promise<ApiOk<{
        items: Array<{
            name: string;
            email: string;
            count: number;
        }>;
    }>>;
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
