/**
 * 메일 모듈 기본값.
 */

import type { MailContactForm, ComposeForm, MailAccountForm, MailFilters, MailFolderCounts, MailState } from "./types";

/** 폴더 건수 기본값 */
export const defaultMailFolderCounts: MailFolderCounts = {
    inbox_unread: 0,
    inbox: 0,
    sent: 0,
    draft: 0,
    trash: 0,
    spam: 0,
    starred: 0,
};

/** 필터 기본값 */
export const defaultMailFilters: MailFilters = {
    mailAccountSeq: 0,
    folder: "inbox",
    search: "",
    unreadOnly: false,
    starredOnly: false,
};

/** 상태 기본값 */
export const defaultMailState: MailState = {
    accounts: [],
    loadingAccounts: false,
    messages: [],
    total: 0,
    page: 0,
    loadingList: false,
    filters: defaultMailFilters,
    selectedSeq: 0,
    detail: null,
    loadingDetail: false,
    counts: defaultMailFolderCounts,
    syncingSeqs: [],
    error: "",
};

/** 계정 폼 기본값(IMAP/SSL) */
export const defaultMailAccountForm: MailAccountForm = {
    seq: 0,
    is_shared: false,
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
    sync_interval_min: 5,
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
};
