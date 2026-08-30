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
    incoming_password: string; // 수신 비밀번호
    smtp_password: string; // SMTP 비밀번호
}

/** 메일 계정(비밀번호 제외) */
export interface MailAccount {
    seq: number; // 계정 seq
    account_seq: number; // 소유 사용자(개인=소유자, 공용=등록자)
    scope: MailAccountScope; // 계정 범위
    name: string; // 표시 이름
    email: string; // 메일 주소
    incoming_protocol: IncomingProtocol; // 수신 프로토콜
    incoming_host: string; // 수신 호스트
    incoming_port: number; // 수신 포트
    incoming_security: ConnectionSecurity; // 수신 보안
    incoming_username: string; // 수신 아이디
    smtp_host: string; // SMTP 호스트
    smtp_port: number; // SMTP 포트
    smtp_security: ConnectionSecurity; // SMTP 보안
    smtp_use_incoming_auth: boolean; // SMTP 인증 = 수신 계정
    smtp_username: string; // SMTP 아이디
    enabled: boolean; // 자동 동기화
    is_default: boolean; // 기본 발신 계정
    pop3_delete_after_fetch: boolean; // POP3 수신 후 서버 삭제
    imap_mailbox: string; // IMAP 메일함
    sync_interval_min: number; // 동기화 간격(분)
    last_sync_time: string | null; // 마지막 동기화
    last_error: string | null; // 마지막 오류
    signature: string; // 서명(HTML)
    has_incoming_password: boolean; // 수신 비밀번호 저장됨
    has_smtp_password: boolean; // SMTP 비밀번호 저장됨
    can_manage: boolean; // 수정/삭제 가능(개인=소유자, 공용=관리자 또는 등록자)
    unread_count?: number; // 받은편지함 미읽음
}

/** 주소 */
export interface MailAddress {
    name: string; // 이름
    address: string; // 주소
}

/** 첨부 메타 */
export interface MailAttachment {
    uuid: string; // ES 파일 UUID
    name: string; // 파일명
    mime: string; // MIME
    size: number; // 크기
    content_id?: string; // cid
}

/** 목록 행 */
export interface MailMessageListItem {
    seq: number; // 메시지 seq
    mail_account_seq: number; // 계정
    folder: MailFolder; // 폴더
    prev_folder: MailFolder | null; // 휴지통/스팸함 이전 폴더
    message_id: string | null; // Message-ID
    from_name: string | null; // 발신자 이름
    from_address: string | null; // 발신자 주소
    to_summary: string | null; // 수신자 요약
    subject: string | null; // 제목
    snippet: string | null; // 미리보기
    date_time: string | null; // 일시
    is_read: boolean; // 읽음
    is_starred: boolean; // 중요
    has_attachment: boolean; // 첨부
    has_cc: boolean; // 참조 있음(목록에서 전체 답장 노출 판단)
    mail_folder_seq: number; // 사용자 메일함(folder=custom)
    size: number; // 크기
}

/** 상세(본문·첨부 포함) */
/** AI 번역 결과(제목·본문) — 서버는 저장하지 않으며 화면이 메시지별로 세션 캐시한다. */
export interface MailTranslation {
    subject: string; // 번역된 제목
    body_html: string; // 번역된 HTML 본문(mode=html — 원문 구조 보존)
    body_text: string; // 번역된 평문(mode=text — 긴 HTML 은 평문으로 낮춰 번역)
    mode: "html" | "text"; // 본문 번역 모드
}

export interface MailMessageDetail extends MailMessageListItem {
    from: MailAddress | null; // 발신자
    to: MailAddress[]; // 수신자
    cc: MailAddress[]; // 참조
    bcc: MailAddress[]; // 숨은참조
    reply_to: MailAddress | null; // 회신
    body_html: string; // HTML 본문(원문 — 표시 전 sanitize)
    body_text: string; // 평문
    attachments: MailAttachment[]; // 첨부
    in_reply_to: string | null; // In-Reply-To
    references: string[]; // References
}

/** 폴더별 건수 */
export interface MailFolderCounts {
    inbox_unread: number; // 받은편지함 미읽음
    inbox: number; // 받은편지함
    sent: number; // 보낸편지함
    draft: number; // 임시보관
    trash: number; // 휴지통
    spam: number; // 스팸함
    starred: number; // 중요(휴지통 제외)
    custom: Record<string, number>; // 사용자 메일함별 건수(mail_folder_seq → 건수)
}

/** 접속 테스트 결과 */
export interface MailConnectionTestResult {
    incoming: { ok: boolean; error?: string }; // 수신
    smtp: { ok: boolean; error?: string }; // SMTP
}

/** 동기화 결과 */
export interface MailSyncResult {
    added: number; // 새 메일 수
    skipped: boolean; // 건너뜀
    error?: string; // 오류
    account: MailAccount | null; // 갱신된 계정
}

/** 목록 필터 */
export interface MailFilters {
    mailAccountSeq: number; // 0 = 전체 계정
    folder: MailListFolder; // 폴더(가상 폴더 포함)
    mailFolderSeq: number; // 사용자 메일함 seq(folder=custom 일 때)
    search: string; // 검색어
    unreadOnly: boolean; // 미읽음만
    starredOnly: boolean; // 중요만
}

/** 페이지 크기 */
export const MAIL_PAGE_SIZE = 50;

/** 화면 상태 */
export interface MailState {
    accounts: MailAccount[]; // 내 계정 목록
    loadingAccounts: boolean; // 계정 로딩
    folders: MailUserFolder[]; // 사용자 메일함 목록
    rules: MailRule[]; // 규칙 목록
    messages: MailMessageListItem[]; // 목록(누적 페이지)
    total: number; // 서버 총 건수
    page: number; // 마지막으로 받은 페이지
    loadingList: boolean; // 목록 로딩
    filters: MailFilters; // 필터
    selectedSeq: number; // 선택 메시지
    detail: MailMessageDetail | null; // 선택 메시지 상세
    loadingDetail: boolean; // 상세 로딩
    counts: MailFolderCounts; // 폴더 건수(현재 계정 범위)
    syncingSeqs: number[]; // 동기화 중인 메일 계정 seq 목록(계정별 표시)
    error: string; // 목록 오류
}

/** 계정 등록/수정 폼 */
export interface MailAccountForm {
    seq: number; // 0 = 신규
    is_shared: boolean; // 공용 계정 여부(요청 시 scope 로 변환)
    name: string; // 표시 이름
    email: string; // 메일 주소
    incoming_protocol: IncomingProtocol; // 수신 프로토콜
    incoming_host: string; // 수신 호스트
    incoming_port: number | ""; // 수신 포트
    incoming_security: ConnectionSecurity; // 수신 보안
    incoming_username: string; // 수신 아이디
    incoming_password: string; // 수신 비밀번호(빈값=유지)
    smtp_host: string; // SMTP 호스트
    smtp_port: number | ""; // SMTP 포트
    smtp_security: ConnectionSecurity; // SMTP 보안
    smtp_use_incoming_auth: boolean; // SMTP 인증 = 수신 계정
    smtp_username: string; // SMTP 아이디
    smtp_password: string; // SMTP 비밀번호(빈값=유지)
    enabled: boolean; // 자동 동기화
    is_default: boolean; // 기본 발신
    pop3_delete_after_fetch: boolean; // POP3 서버 삭제
    imap_mailbox: string; // IMAP 메일함
    sync_interval_min: number; // 동기화 간격
    signature: string; // 서명
    has_incoming_password: boolean; // 저장된 비밀번호 있음(수정 시 안내)
    has_smtp_password: boolean; // 저장된 SMTP 비밀번호 있음
}

/** 작성 첨부(기존 uuid 또는 새 파일 base64) */
export interface ComposeAttachment {
    uuid?: string; // 기존 첨부
    name: string; // 파일명
    mime: string; // MIME
    size: number; // 크기
    content_base64?: string; // 새 파일 내용
    source_message_seq?: number; // uuid 가 가리키는 원문 메시지(전달 — 서버가 그 첨부를 복사한다)
    eml_message_seq?: number; // 이 메시지를 .eml 로 만들어 첨부(복수 전달)
}

/** 작성 모드 */
export type ComposeMode = "new" | "reply" | "replyAll" | "forward" | "draft";

/** 작성 폼 */
export interface ComposeForm {
    seq: number; // 임시보관 seq(0=신규)
    mode: ComposeMode; // 작성 모드
    mail_account_seq: number; // 발신 계정
    to: string; // 받는 사람(쉼표 구분)
    cc: string; // 참조
    bcc: string; // 숨은참조
    subject: string; // 제목
    body_html: string; // 본문
    attachments: ComposeAttachment[]; // 첨부
    in_reply_to: string; // 답장 대상 Message-ID
    references: string[]; // References
    showCcBcc: boolean; // 참조/숨은참조 노출
}

/** 발송/임시저장 요청 본문 */
export interface ComposeRequest {
    mail_account_seq: number; // 발신 계정
    seq?: number; // 임시보관 seq
    to: string[]; // 받는 사람
    cc: string[]; // 참조
    bcc: string[]; // 숨은참조
    subject: string; // 제목
    body_html: string; // 본문
    attachments: {
        uuid?: string;
        name: string;
        mime: string;
        content_base64?: string;
        source_message_seq?: number;
        eml_message_seq?: number;
    }[]; // 첨부
    in_reply_to?: string | null; // In-Reply-To
    references?: string[]; // References
}

/** 계정 저장 요청 본문(폼에서 변환) */
export type MailAccountRequest = Omit<
    MailAccountForm,
    "seq" | "has_incoming_password" | "has_smtp_password" | "incoming_port" | "smtp_port" | "is_shared"
> & {
    scope: MailAccountScope; // 개인/공용(폼 is_shared 에서 변환)
    seq?: number; // 테스트 시 저장값 참조용
    incoming_port?: number; // 포트(빈값이면 서버 기본)
    smtp_port?: number; // 포트
};

/** 주소록 연락처 */
export interface MailContact {
    seq: number; // seq
    account_seq: number; // 소유자(개인) / 등록자(공용)
    scope: "personal" | "shared"; // 개인/공용
    name: string; // 이름
    email: string; // 메일 주소
    organization: string; // 소속
    phone: string; // 전화번호
    memo: string; // 메모
    is_favorite: boolean; // 즐겨찾기
    created_time?: string; // 등록 일시
    updated_time?: string; // 수정 일시
    can_manage?: boolean; // 수정/삭제 가능(개인=소유자, 공용=관리자·등록자)
}

/** 연락처 등록/수정 요청 */
export type MailContactRequest = Partial<
    Pick<MailContact, "name" | "email" | "organization" | "phone" | "memo" | "is_favorite" | "scope">
>;

/** 연락처 폼 */
export interface MailContactForm {
    seq: number; // 0 = 신규
    name: string; // 이름
    email: string; // 메일 주소
    organization: string; // 소속
    phone: string; // 전화번호
    memo: string; // 메모
    is_favorite: boolean; // 즐겨찾기
    is_shared: boolean; // 공용 주소록
    can_manage: boolean; // 수정/삭제 가능(수정 모드 안내용)
}

/** 사용자 메일함 */
export interface MailUserFolder {
    seq: number; // seq
    account_seq: number; // 소유자(개인) / 등록자(공용)
    scope: "personal" | "shared"; // 개인/공용
    name: string; // 이름
    sort_order: number; // 정렬
    icon: string; // 아이콘 키(@ehfuse/taskbox PROJECT_ICON_OPTIONS, 빈 값=기본 폴더)
    color: string; // 아이콘 색(hex, 빈 값=기본)
    can_manage?: boolean; // 수정/삭제 가능(개인=소유자, 공용=관리자·등록자)
    message_count?: number; // 메일 수
    total_size?: number; // 메일 크기 합계(bytes)
    unread_count?: number; // 미읽음 수(사이드바 배지)
}

/** 규칙 조건 */
export interface MailRuleCondition {
    field: "from" | "to" | "subject" | "body"; // 대상
    op: "contains" | "not_contains" | "equals" | "starts" | "ends"; // 비교
    value: string; // 값
}

/** 규칙 동작 */
export interface MailRuleActions {
    move_to?: "inbox" | "spam" | "trash" | "custom"; // 이동
    mail_folder_seq?: number; // 이동할 메일함
    mark_read?: boolean; // 읽음으로 표시
    star?: boolean; // 중요 표시
}

/** 규칙 */
export interface MailRule {
    seq: number; // seq
    account_seq: number; // 소유자
    name: string; // 이름
    enabled: boolean; // 사용
    sort_order: number; // 순서
    match: "all" | "any"; // 조건 결합
    stop_processing: boolean; // 맞으면 뒤 규칙 중단
    conditions: MailRuleCondition[]; // 조건
    actions: MailRuleActions; // 동작
}

/** 규칙 요청 */
export type MailRuleRequest = Partial<
    Pick<MailRule, "name" | "enabled" | "sort_order" | "match" | "stop_processing" | "conditions" | "actions">
>;

/** 규칙 폼 */
export interface MailRuleForm {
    seq: number; // 0 = 신규
    name: string; // 이름
    enabled: boolean; // 사용
    match: "all" | "any"; // 조건 결합
    stop_processing: boolean; // 맞으면 뒤 규칙 중단
    conditions: MailRuleCondition[]; // 조건
    move_to: "" | "inbox" | "spam" | "trash" | "custom"; // 이동("" = 이동 안 함)
    mail_folder_seq: number; // 이동할 메일함
    mark_read: boolean; // 읽음으로 표시
    star: boolean; // 중요 표시
}

/** 규칙 폼 미리 채움(우클릭 "규칙 만들기") — hints 는 저장되지 않고 보낸 사람 값 후보(주소/이름)로만 쓴다 */
export type MailRuleFormPrefill = Partial<MailRuleForm> & {
    hints?: { from_address?: string; from_name?: string; subject?: string; to?: string };
};

/** 이동 대상 */
export type MailMoveTarget = { folder: "inbox" | "spam" | "trash" } | { folder: "custom"; mail_folder_seq: number };
