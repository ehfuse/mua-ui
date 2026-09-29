/**
 * 메일(MUA) 모듈 타입 — AS plugins/mua 응답 계약과 일치.
 */
/** 폴더 */
export type MailFolder = "inbox" | "sent" | "draft" | "trash" | "spam" | "custom";
/** 목록 폴더 — starred 는 중요 표시 가상 폴더(휴지통 제외) */
export type MailListFolder = MailFolder | "starred";
/** 수신 프로토콜 */
export type IncomingProtocol = "imap" | "pop3";
/** 계정 범위 — personal=소유자만, shared=같은 회사 전원 */
export type MailAccountScope = "personal" | "shared";
/** 접속 보안 */
export type ConnectionSecurity = "ssl" | "starttls" | "none";
/** 저장된 계정 비밀번호(수정 폼 채우기용, 관리 가능한 사용자만 조회) */
export interface MailAccountSecrets {
    incoming_password: string;
    smtp_password: string;
}
/** 메일 계정(비밀번호 제외) */
export interface MailAccount {
    seq: number;
    account_seq: number;
    scope: MailAccountScope;
    team_seq?: number;
    team_name?: string;
    kind?: string;
    in_sidebar?: boolean;
    name: string;
    email: string;
    incoming_protocol: IncomingProtocol;
    incoming_host: string;
    incoming_port: number;
    incoming_security: ConnectionSecurity;
    incoming_username: string;
    smtp_host: string;
    smtp_port: number;
    smtp_security: ConnectionSecurity;
    smtp_use_incoming_auth: boolean;
    smtp_username: string;
    enabled: boolean;
    is_default: boolean;
    sort_order: number;
    pop3_delete_after_fetch: boolean;
    imap_mailbox: string;
    sync_interval_min: number;
    last_sync_time: string | null;
    last_error: string | null;
    signature: string;
    has_incoming_password: boolean;
    has_smtp_password: boolean;
    can_manage: boolean;
    /**
     * 표시 이름·서명·기본 발신만 고칠 수 있는지 — 기업메일 사서함(kind=hosted)의 담당자.
     * 사서함 자체(주소·서버)는 팀 관리 › 기업메일 소관이라 can_manage 는 false 지만,
     * 보내는 사람 이름과 서명은 쓰는 사람의 것이라 여기서 고친다(2026-09-07).
     */
    can_edit_profile?: boolean;
    unread_count?: number;
}
/** 주소 */
export interface MailAddress {
    name: string;
    address: string;
}
/** 첨부 메타 */
export interface MailAttachment {
    uuid: string;
    name: string;
    mime: string;
    size: number;
    content_id?: string;
}
/** 목록 행 */
export interface MailMessageListItem {
    seq: number;
    mail_account_seq: number;
    folder: MailFolder;
    prev_folder: MailFolder | null;
    message_id: string | null;
    from_name: string | null;
    from_address: string | null;
    to_summary: string | null;
    subject: string | null;
    snippet: string | null;
    date_time: string | null;
    is_read: boolean;
    is_starred: boolean;
    has_attachment: boolean;
    has_cc: boolean;
    mail_folder_seq: number;
    size: number;
    translated_subject?: string | null;
}
/** 상세(본문·첨부 포함) */
/** AI 번역 결과(제목·본문) — 서버는 저장하지 않으며 화면이 메시지별로 세션 캐시한다. */
export interface MailTranslation {
    subject: string;
    body_html: string;
    body_text: string;
    summary: string;
    mode: "html" | "text";
    target?: string;
    time?: string;
}
export interface MailMessageDetail extends MailMessageListItem {
    from: MailAddress | null;
    to: MailAddress[];
    cc: MailAddress[];
    bcc: MailAddress[];
    reply_to: MailAddress | null;
    body_html: string;
    body_text: string;
    translation?: MailTranslation | null;
    translation_shown?: boolean;
    attachments: MailAttachment[];
    in_reply_to: string | null;
    references: string[];
}
/** 폴더별 건수 */
export interface MailFolderCounts {
    inbox_unread: number;
    inbox: number;
    sent: number;
    draft: number;
    trash: number;
    spam: number;
    starred: number;
    custom: Record<string, number>;
}
/** 접속 테스트 결과 */
export interface MailConnectionTestResult {
    incoming: {
        ok: boolean;
        error?: string;
    };
    smtp: {
        ok: boolean;
        error?: string;
    };
}
/** 동기화 결과 */
export interface MailSyncResult {
    added: number;
    skipped: boolean;
    error?: string;
    account: MailAccount | null;
}
/** 목록 필터 */
export interface MailFilters {
    mailAccountSeq: number;
    folder: MailListFolder;
    mailFolderSeq: number;
    search: string;
    unreadOnly: boolean;
    starredOnly: boolean;
}
/** 페이지 크기 */
export declare const MAIL_PAGE_SIZE = 50;
/** 화면 상태 */
export interface MailState {
    accounts: MailAccount[];
    loadingAccounts: boolean;
    folders: MailUserFolder[];
    rules: MailRule[];
    messages: MailMessageListItem[];
    total: number;
    page: number;
    loadingList: boolean;
    filters: MailFilters;
    selectedSeq: number;
    detail: MailMessageDetail | null;
    loadingDetail: boolean;
    counts: MailFolderCounts;
    syncingSeqs: number[];
    lastAccountSeq: number;
    error: string;
}
/** 계정 등록/수정 폼 */
export interface MailAccountForm {
    seq: number;
    is_shared: boolean;
    team_seq: number;
    name: string;
    email: string;
    incoming_protocol: IncomingProtocol;
    incoming_host: string;
    incoming_port: number | "";
    incoming_security: ConnectionSecurity;
    incoming_username: string;
    incoming_password: string;
    smtp_host: string;
    smtp_port: number | "";
    smtp_security: ConnectionSecurity;
    smtp_use_incoming_auth: boolean;
    smtp_username: string;
    smtp_password: string;
    enabled: boolean;
    is_default: boolean;
    pop3_delete_after_fetch: boolean;
    imap_mailbox: string;
    sync_interval_min: number;
    signature: string;
    has_incoming_password: boolean;
    has_smtp_password: boolean;
}
/** 작성 첨부(기존 uuid 또는 새 파일 base64) */
export interface ComposeAttachment {
    uuid?: string;
    name: string;
    mime: string;
    size: number;
    content_base64?: string;
    source_message_seq?: number;
    eml_message_seq?: number;
}
/** 작성 모드 */
export type ComposeMode = "new" | "reply" | "replyAll" | "forward" | "draft";
/** 작성 폼 */
export interface ComposeForm {
    seq: number;
    mode: ComposeMode;
    mail_account_seq: number;
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body_html: string;
    attachments: ComposeAttachment[];
    in_reply_to: string;
    references: string[];
    showCcBcc: boolean;
}
/** 발송/임시저장 요청 본문 */
export interface ComposeRequest {
    mail_account_seq: number;
    seq?: number;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body_html: string;
    attachments: {
        uuid?: string;
        name: string;
        mime: string;
        content_base64?: string;
        source_message_seq?: number;
        eml_message_seq?: number;
    }[];
    in_reply_to?: string | null;
    references?: string[];
}
/** 계정 저장 요청 본문(폼에서 변환) */
/** 기업메일 사서함 프로필 수정 요청 — 서버가 이 세 필드만 받는다(주소·서버 설정은 팀 관리 › 기업메일). */
export interface MailHostedProfileRequest {
    name: string;
    signature: string;
    is_default: boolean;
}
export type MailAccountRequest = Omit<MailAccountForm, "seq" | "has_incoming_password" | "has_smtp_password" | "incoming_port" | "smtp_port" | "is_shared" | "team_seq"> & {
    scope: MailAccountScope;
    team_seq?: number;
    seq?: number;
    incoming_port?: number;
    smtp_port?: number;
};
/** 주소록 연락처 */
export interface MailContact {
    seq: number;
    account_seq: number;
    scope: "personal" | "shared";
    name: string;
    email: string;
    organization: string;
    phone: string;
    memo: string;
    is_favorite: boolean;
    created_time?: string;
    updated_time?: string;
    can_manage?: boolean;
}
/** 연락처 등록/수정 요청 */
export type MailContactRequest = Partial<Pick<MailContact, "name" | "email" | "organization" | "phone" | "memo" | "is_favorite" | "scope">>;
/** 연락처 폼 */
export interface MailContactForm {
    seq: number;
    name: string;
    email: string;
    organization: string;
    phone: string;
    memo: string;
    is_favorite: boolean;
    is_shared: boolean;
    can_manage: boolean;
}
/** 사용자 메일함 */
export interface MailUserFolder {
    seq: number;
    account_seq: number;
    scope: "personal" | "shared";
    team_seq?: number;
    team_name?: string;
    kind?: string;
    in_sidebar?: boolean;
    name: string;
    sort_order: number;
    icon: string;
    color: string;
    can_manage?: boolean;
    message_count?: number;
    total_size?: number;
    unread_count?: number;
}
/** 규칙 조건 */
export interface MailRuleCondition {
    field: "from" | "to" | "subject" | "body";
    op: "contains" | "not_contains" | "equals" | "starts" | "ends";
    value: string;
}
/** 규칙 동작 */
export interface MailRuleActions {
    move_to?: "inbox" | "spam" | "trash" | "custom";
    mail_folder_seq?: number;
    mark_read?: boolean;
    star?: boolean;
}
/** 규칙 */
export interface MailRule {
    seq: number;
    account_seq: number;
    name: string;
    enabled: boolean;
    sort_order: number;
    match: "all" | "any";
    stop_processing: boolean;
    conditions: MailRuleCondition[];
    actions: MailRuleActions;
}
/** 규칙 요청 */
export type MailRuleRequest = Partial<Pick<MailRule, "name" | "enabled" | "sort_order" | "match" | "stop_processing" | "conditions" | "actions">>;
/** 규칙 폼 */
export interface MailRuleForm {
    seq: number;
    name: string;
    enabled: boolean;
    match: "all" | "any";
    stop_processing: boolean;
    conditions: MailRuleCondition[];
    move_to: "" | "inbox" | "spam" | "trash" | "custom";
    mail_folder_seq: number;
    mark_read: boolean;
    star: boolean;
}
/** 규칙 폼 미리 채움(우클릭 "규칙 만들기") — hints 는 저장되지 않고 보낸 사람 값 후보(주소/이름)로만 쓴다 */
export type MailRuleFormPrefill = Partial<MailRuleForm> & {
    hints?: {
        from_address?: string;
        from_name?: string;
        subject?: string;
        to?: string;
    };
};
/** 이동 대상 */
export type MailMoveTarget = {
    folder: "inbox" | "spam" | "trash";
} | {
    folder: "custom";
    mail_folder_seq: number;
};
/** 이동 메뉴 선택지 1건(우클릭 "이동 ▸"·상세 ⋮ "이동 ▸" 공용) */
export interface MailMoveTargetOption {
    key: string;
    label: string;
    target: MailMoveTarget;
    folder?: MailUserFolder;
}
