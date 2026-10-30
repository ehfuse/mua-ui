/**
 * 메일 모듈 기본값.
 */

import type {
    MailContactForm,
    ComposeForm,
    MailAccountForm,
    MailFilters,
    MailFolderCounts,
    MailRuleForm,
    MailState,
} from "./types";

/** 폴더 건수 기본값 */
export const defaultMailFolderCounts: MailFolderCounts = {
    inbox_unread: 0,
    inbox: 0,
    sent: 0,
    draft: 0,
    trash: 0,
    spam: 0,
    starred: 0,
    scheduled: 0,
    custom: {},
};

/** 고른 갈래(전체 · 안읽음 · 별표)를 적어 두는 자리 — 탭마다 따로(sessionStorage)라 새로고침에는 남고 새로 열면 전체부터다. */
const SCOPE_STORAGE_KEY = "mua.mail.scope";

/** 적어 둔 갈래를 읽는다. 저장소를 못 쓰는 환경(사생활 보호 창 등)에서는 전체다. */
function readStoredScope(): Pick<MailFilters, "unreadOnly" | "starredOnly" | "labelSeq"> {
    try {
        const scope = window.sessionStorage.getItem(SCOPE_STORAGE_KEY) ?? "";
        // 라벨 탭은 "label:<seq>" — 라벨이 지워졌으면 화면이 라벨 목록을 받은 뒤 전체로 되돌린다.
        const labelSeq = /^label:(\d+)$/.exec(scope)?.[1];
        return { unreadOnly: scope === "unread", starredOnly: scope === "starred", labelSeq: labelSeq ? Number(labelSeq) : 0 };
    } catch {
        return { unreadOnly: false, starredOnly: false, labelSeq: 0 };
    }
}

/** 고른 갈래를 적어 둔다 — 새로고침해도 보던 탭(별표 등)에 그대로 있게(2026-10-12). */
export function storeMailScope(filters: Pick<MailFilters, "unreadOnly" | "starredOnly" | "labelSeq">): void {
    try {
        window.sessionStorage.setItem(
            SCOPE_STORAGE_KEY,
            filters.labelSeq > 0 ? `label:${filters.labelSeq}` : filters.unreadOnly ? "unread" : filters.starredOnly ? "starred" : "all"
        );
    } catch {
        // 저장소를 못 쓰면 기억하지 않을 뿐이다.
    }
}

/** 필터 기본값 — 갈래만 새로고침 전에 보던 것을 잇는다. */
export const defaultMailFilters: MailFilters = {
    mailAccountSeq: 0,
    folder: "inbox",
    mailFolderSeq: 0,
    search: "",
    ...readStoredScope(),
};

/** 상태 기본값 */
export const defaultMailState: MailState = {
    accounts: [],
    loadingAccounts: false,
    folders: [],
    rules: [],
    messages: [],
    total: 0,
    page: 0,
    loadingList: false,
    filters: defaultMailFilters,
    selectedSeq: 0,
    detail: null,
    loadingDetail: false,
    thread: [],
    counts: defaultMailFolderCounts,
    syncingSeqs: [],
    labels: [],
    lastAccountSeq: 0,
    error: "",
};

/** 계정 폼 기본값(IMAP/SSL) */
export const defaultMailAccountForm: MailAccountForm = {
    seq: 0,
    is_shared: false,
    team_seq: 0,
    name: "",
    email: "",
    incoming_protocol: "imap",
    incoming_host: "",
    incoming_port: 993,
    incoming_security: "ssl",
    incoming_username: "",
    incoming_password: "",
    smtp_host: "",
    smtp_port: 465,
    smtp_security: "ssl",
    smtp_use_incoming_auth: true,
    smtp_username: "",
    smtp_password: "",
    enabled: true,
    is_default: false,
    pop3_delete_after_fetch: false,
    imap_mailbox: "INBOX",
    sync_interval_min: 1,
    signature: "",
    has_incoming_password: false,
    has_smtp_password: false,
};

/** 작성 폼 기본값 */
export const defaultComposeForm: ComposeForm = {
    seq: 0,
    mode: "new",
    mail_account_seq: 0,
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body_html: "",
    attachments: [],
    in_reply_to: "",
    references: [],
    showCcBcc: false,
    scheduled: false,
    send_at: "",
    read_receipt: false,
    secure: false,
    secure_password: "",
    secure_hint: "",
    signature_html: "",
    signature_place: "",
};

/** 연락처 폼 기본값 */
export const defaultMailContactForm: MailContactForm = {
    seq: 0,
    name: "",
    email: "",
    organization: "",
    phone: "",
    memo: "",
    is_favorite: false,
    is_shared: false,
    can_manage: true,
    label_seqs: [],
};

/** 규칙 폼 기본값 */
export const defaultMailRuleForm: MailRuleForm = {
    seq: 0,
    name: "",
    enabled: true,
    match: "all",
    stop_processing: false,
    conditions: [{ field: "from", op: "contains", value: "" }],
    move_to: "",
    mail_folder_seq: 0,
    mark_read: false,
    star: false,
};
