/**
 * 메일(MUA) API 래퍼 — AS /v1/mua/* (entityAppServer 직접 호출, 오류는 throw).
 */

import { entityAppServer } from "entity-client";
import type {
    ComposeRequest,
    MailAccount,
    MailAccountRequest,
    MailHostedProfileRequest,
    MailAccountSecrets,
    MailConnectionTestResult,
    MailContact,
    MailContactRequest,
    MailFolder,
    MailFolderCounts,
    MailLabel,
    MailListFolder,
    MailTranslation,
    MailMessageDetail,
    MailMessageListItem,
    MailMoveTarget,
    MailReceipt,
    MailRule,
    MailRuleRequest,
    MailSyncResult,
    MailUserFolder,
} from "../models/types";

/** AS 표준 응답 */
interface ApiOk<T> {
    ok: boolean; // 성공 여부
    data: T; // 데이터
    error?: string; // 오류
}

/** 목록 조회 파라미터 */
export interface ListMessagesParams {
    mail_folder_seq?: number; // 사용자 메일함(folder=custom)
    mail_account_seq: number; // 0=전체
    folder: MailListFolder; // 폴더(가상 폴더 starred 포함)
    page: number; // 페이지
    limit: number; // 크기
    search?: string; // 검색어
    unread?: boolean; // 미읽음만
    starred?: boolean; // 중요만
    label_seq?: number; // 색상 라벨 하나만(0/생략 = 거르지 않음) — 휴지통·스팸함이 아니면 서버가 전 폴더에서 찾는다
    thread?: boolean; // 대화로 묶어 받기(2026-10-20) — 대화마다 한 줄, total 은 대화 수(임시보관 · 예약은 서버가 묶지 않는다)
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
    items: MailMessageListItem[]; // 행
    total: number; // 총 건수
    page: number; // 페이지
    limit: number; // 크기
}

/** 일괄 처리 액션 */
export type BulkMessageAction =
    "read" | "unread" | "star" | "unstar" | "trash" | "spam" | "restore" | "delete" | "move";

/** 쿼리스트링을 만든다(빈 값 제외). */
function toQuery(params: object): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
        if (value === undefined || value === null || value === "" || value === false) continue;
        search.set(key, String(value === true ? 1 : value));
    }
    const text = search.toString();
    return text ? `?${text}` : "";
}

/** 진입 부트스트랩 응답 — 각 목록은 GET /accounts · /folders · /rules 의 items 와 같다. */
export interface MailBootstrapData {
    accounts: MailAccount[]; // 내 메일 계정(+미읽음)
    folders: MailUserFolder[]; // 사용자 메일함
    rules: MailRule[]; // 규칙
}

/** 메일 API */
/** 원문 보기 응답 */
export interface MailMessageSource {
    source: string; // 원문 글(큰 메일은 앞 2MB 만)
    rebuilt: boolean; // 원문을 보관하지 않아 다시 만든 것(외부 계정 메일)
    truncated: boolean; // 앞부분만 실었다
    size: number; // 원문 전체 바이트
    file_name: string; // 내려받을 .eml 이름
}

export const mailApi = {
    /** 진입 1회 — 계정·메일함·규칙을 한 번에(사이드바+메일 화면이 나눠 쓴다) */
    bootstrap: () => entityAppServer.http.get<ApiOk<MailBootstrapData>>("/v1/mua/bootstrap"),
    /** 내 메일 계정 목록 */
    listAccounts: () => entityAppServer.http.get<ApiOk<{ items: MailAccount[] }>>("/v1/mua/accounts"),
    /** 계정 표시 순서 저장 — 새 목록을 그대로 돌려받아 다시 조회하지 않는다. */
    reorderAccounts: (seqs: number[]) =>
        entityAppServer.http.post<ApiOk<{ items: MailAccount[] }>>("/v1/mua/accounts/reorder", { seqs }),
    /** 계정 등록 */
    createAccount: (body: MailAccountRequest) =>
        entityAppServer.http.post<ApiOk<MailAccount>>("/v1/mua/accounts", body),
    /** 계정 수정 */
    updateAccount: (seq: number, body: MailAccountRequest) =>
        entityAppServer.http.patch<ApiOk<MailAccount>>(`/v1/mua/accounts/${seq}`, body),
    /**
     * 기업메일 사서함 프로필 수정 — 표시 이름·서명·기본 발신만. 같은 PATCH 를 쓰지만 본문이 이 셋뿐이라
     * 서버가 hosted 전용 경로로 받는다(수신/발신 서버 값은 아예 보내지 않는다).
     */
    updateHostedProfile: (seq: number, body: MailHostedProfileRequest) =>
        entityAppServer.http.patch<ApiOk<MailAccount>>(`/v1/mua/accounts/${seq}`, body),
    /** 서명만 저장(0.3.154) — 메일 쓰기 창의 [기본 서명으로 저장]. 서버 PATCH /v1/mua/accounts/:seq/signature 가 있어야 한다. */
    updateSignature: (seq: number, signature: string) =>
        entityAppServer.http.patch<ApiOk<MailAccount>>(`/v1/mua/accounts/${seq}/signature`, { signature }),
    /** 계정 삭제 */
    deleteAccount: (seq: number) =>
        entityAppServer.http.delete<ApiOk<{ deleted: boolean }>>(`/v1/mua/accounts/${seq}`, {}),
    /** 접속 테스트 */
    testAccount: (body: MailAccountRequest) =>
        entityAppServer.http.post<ApiOk<MailConnectionTestResult>>("/v1/mua/accounts/test", body),
    /** 즉시 동기화 */
    syncAccount: (seq: number) => entityAppServer.http.post<ApiOk<MailSyncResult>>(`/v1/mua/accounts/${seq}/sync`, {}),
    /** 저장된 비밀번호(수정 폼 채우기) */
    getAccountSecrets: (seq: number) =>
        entityAppServer.http.get<ApiOk<MailAccountSecrets>>(`/v1/mua/accounts/${seq}/secrets`),
    /** 건수 */
    counts: (mailAccountSeq: number) =>
        entityAppServer.http.get<
            ApiOk<{ by_account: Record<string, number>; by_folder?: Record<string, number>; folders: MailFolderCounts }>
        >(`/v1/mua/counts${toQuery({ mail_account_seq: mailAccountSeq })}`),
    /** 목록 */
    listMessages: (params: ListMessagesParams) =>
        entityAppServer.http.get<ApiOk<ListMessagesResponse>>(`/v1/mua/messages${toQuery(params)}`),
    /** 상세(+읽음 처리) */
    /** 제목·본문 AI 번역(Gemini) — 저장 안 함, 실패는 throw(502/503). */
    translateMessage: (seq: number, target = "ko") =>
        entityAppServer.http.post<ApiOk<MailTranslation>>(`/v1/mua/messages/${seq}/translate`, { target }),
    /** 원문(RFC 822) — 기업메일은 받은 원문, 외부 계정은 다시 만든 것(rebuilt). full=true 면 잘리지 않은 전체. */
    getMessageSource: (seq: number, full = false) =>
        entityAppServer.http.get<ApiOk<MailMessageSource>>(`/v1/mua/messages/${seq}/source${full ? "?full=1" : ""}`),
    /** 이 메일이 든 대화의 메일들(오래된 것부터). markRead 면 같은 폴더의 안 읽은 메일을 함께 읽음으로. */
    getThread: (seq: number, markRead: boolean) =>
        entityAppServer.http.get<ApiOk<{ items: MailThreadItem[] }>>(`/v1/mua/messages/${seq}/thread${toQuery({ mark_read: markRead })}`),
    getMessage: (seq: number, markRead: boolean) =>
        entityAppServer.http.get<ApiOk<MailMessageDetail>>(
            `/v1/mua/messages/${seq}${toQuery({ mark_read: markRead })}`
        ),
    /** 읽음/중요/폴더 변경 */
    patchMessage: (
        seq: number,
        body: { is_read?: boolean; is_starred?: boolean; folder?: MailFolder | "restore"; translation_shown?: boolean }
    ) => entityAppServer.http.patch<ApiOk<MailMessageDetail>>(`/v1/mua/messages/${seq}`, body),
    /** 일괄 처리 */
    /** threads — 대화로 묶은 목록의 줄이면 같은 폴더의 같은 대화 메일 전부에 적용한다(별표는 그 줄에만). */
    bulkMessages: (seqs: number[], action: BulkMessageAction, move?: MailMoveTarget, threads = false) =>
        entityAppServer.http.post<ApiOk<{ affected: number }>>("/v1/mua/messages/bulk", {
            seqs,
            action,
            ...(threads ? { threads: true } : {}),
            ...(move
                ? { folder: move.folder, mail_folder_seq: move.folder === "custom" ? move.mail_folder_seq : 0 }
                : {}),
        }),
    /** 사용자 화면 설정(보기 타입) */
    getPreferences: () =>
        entityAppServer.http.get<ApiOk<{ view_mode: "list" | "split"; last_account_seq: number }>>(
            "/v1/mua/preferences"
        ),
    /** 사용자 화면 설정 저장 */
    updatePreferences: (body: { view_mode?: "list" | "split"; last_account_seq?: number }) =>
        entityAppServer.http.patch<ApiOk<{ view_mode: "list" | "split"; last_account_seq: number }>>(
            "/v1/mua/preferences",
            body
        ),
    /** 내 색상 라벨(순서대로) — config.labels 를 켠 앱만 부른다 */
    listLabels: () => entityAppServer.http.get<ApiOk<{ items: MailLabel[] }>>("/v1/mua/labels"),
    /** 라벨 만들기(맨 뒤) — 같은 이름이면 ok:false */
    createLabel: (body: { name: string; color: string }) => entityAppServer.http.post<ApiOk<MailLabel>>("/v1/mua/labels", body),
    /** 라벨 이름·색 고치기 */
    updateLabel: (seq: number, body: { name?: string; color?: string }) =>
        entityAppServer.http.patch<ApiOk<MailLabel>>(`/v1/mua/labels/${seq}`, body),
    /** 라벨 순서 — 새 목록을 돌려받는다 */
    reorderLabels: (seqs: number[]) => entityAppServer.http.post<ApiOk<{ items: MailLabel[] }>>("/v1/mua/labels/reorder", { seqs }),
    /** 라벨 지우기 — 단 메일에서도 떼어진다(메일은 그대로) */
    deleteLabel: (seq: number) => entityAppServer.http.delete<ApiOk<{ deleted: boolean; detached: number }>>(`/v1/mua/labels/${seq}`, {}),
    /** 휴지통 · 스팸함 비우기(영구 삭제) — mailAccountSeq 0 이면 내가 쓸 수 있는 모든 계정 */
    emptySpecialFolder: (folder: "trash" | "spam", mailAccountSeq = 0) =>
        entityAppServer.http.post<ApiOk<{ deleted: number }>>("/v1/mua/messages/empty", { folder, mail_account_seq: mailAccountSeq }),
    /** 사서함 사용량 · 스팸 수 · 크기(기업메일 사서함만 한도가 있다 — 받은편지함 탭 줄 게이지, 2026-10-27) */
    getAccountUsage: (seq: number) =>
        entityAppServer.http.get<ApiOk<{ seq: number; kind: string; quota_mb: number; used_bytes: number; spam_count: number; spam_bytes: number }>>(
            `/v1/mua/accounts/${seq}/usage`
        ),
    /** 주소록 전용 라벨(2026-10-27 — 메일 라벨과 따로). 모양 · 규칙은 메일 라벨과 같다. */
    listContactLabels: () => entityAppServer.http.get<ApiOk<{ items: MailLabel[] }>>("/v1/mua/contact-labels"),
    createContactLabel: (body: { name: string; color: string }) =>
        entityAppServer.http.post<ApiOk<MailLabel>>("/v1/mua/contact-labels", body),
    updateContactLabel: (seq: number, body: { name?: string; color?: string }) =>
        entityAppServer.http.patch<ApiOk<MailLabel>>(`/v1/mua/contact-labels/${seq}`, body),
    reorderContactLabels: (seqs: number[]) =>
        entityAppServer.http.post<ApiOk<{ items: MailLabel[] }>>("/v1/mua/contact-labels/reorder", { seqs }),
    deleteContactLabel: (seq: number) =>
        entityAppServer.http.delete<ApiOk<{ deleted: boolean; detached: number }>>(`/v1/mua/contact-labels/${seq}`, {}),
    /** 여러 메일에 라벨 달기·떼기 */
    applyLabels: (seqs: number[], add: number[], remove: number[]) =>
        entityAppServer.http.post<ApiOk<{ affected: number; changed: number }>>("/v1/mua/messages/labels", { seqs, add, remove }),
    /** 사용자 메일함 목록 */
    listFolders: () => entityAppServer.http.get<ApiOk<{ items: MailUserFolder[] }>>("/v1/mua/folders"),
    /** 메일함 추가 */
    createFolder: (body: { name: string; scope?: "personal" | "shared"; team_seq?: number; icon?: string; color?: string }) =>
        entityAppServer.http.post<ApiOk<MailUserFolder>>("/v1/mua/folders", body),
    /** 메일함 수정 */
    updateFolder: (
        seq: number,
        body: { name?: string; sort_order?: number; scope?: "personal" | "shared"; team_seq?: number; icon?: string; color?: string }
    ) => entityAppServer.http.patch<ApiOk<MailUserFolder>>(`/v1/mua/folders/${seq}`, body),
    /** 메일함 삭제(메일은 받은편지함으로) */
    deleteFolder: (seq: number) =>
        entityAppServer.http.delete<ApiOk<{ deleted: boolean; moved: number }>>(`/v1/mua/folders/${seq}`, {}),
    /** 메일함 비우기 — 안의 메일을 휴지통으로 옮긴다(되돌리면 이 메일함으로 돌아온다). */
    emptyFolder: (seq: number) => entityAppServer.http.post<ApiOk<{ moved: number }>>(`/v1/mua/folders/${seq}/empty`, {}),
    /** 규칙 목록 */
    listRules: () => entityAppServer.http.get<ApiOk<{ items: MailRule[] }>>("/v1/mua/rules"),
    /** 규칙 추가 */
    createRule: (body: MailRuleRequest) => entityAppServer.http.post<ApiOk<MailRule>>("/v1/mua/rules", body),
    /** 규칙 수정 */
    updateRule: (seq: number, body: MailRuleRequest) =>
        entityAppServer.http.patch<ApiOk<MailRule>>(`/v1/mua/rules/${seq}`, body),
    /** 규칙 삭제 */
    reorderRules: (seqs: number[]) =>
        entityAppServer.http.post<ApiOk<{ updated: number }>>("/v1/mua/rules/reorder", { seqs }),
    deleteRule: (seq: number) => entityAppServer.http.delete<ApiOk<{ deleted: boolean }>>(`/v1/mua/rules/${seq}`, {}),
    /** 규칙 지금 적용(seq=0 이면 전체) — 내가 소유한 계정의 받은편지함 최근 1000건 */
    applyRules: (seq: number) =>
        entityAppServer.http.post<ApiOk<{ scanned: number; affected: number }>>(`/v1/mua/rules/${seq}/apply`, {}),
    /** 영구 삭제 */
    deleteMessage: (seq: number) =>
        entityAppServer.http.delete<ApiOk<{ deleted: boolean }>>(`/v1/mua/messages/${seq}`, {}),
    /** 발송 */
    send: (body: ComposeRequest) =>
        entityAppServer.http.post<ApiOk<{ seq: number; message_id: string; failed_recipients?: string[]; scheduled?: boolean; pending?: boolean }>>(
            "/v1/mua/send",
            body
        ),
    /** 발송 실패로 남은 보낸편지함 메일을 다시 보낸다(뒤에서) */
    resend: (seq: number) => entityAppServer.http.post<ApiOk<{ seq: number; pending: boolean }>>(`/v1/mua/messages/${seq}/resend`, {}),
    /** 보낸 메일의 받는 사람별 수신확인 */
    receipts: (seq: number) =>
        entityAppServer.http.get<ApiOk<{ items: MailReceipt[] }>>(`/v1/mua/messages/${seq}/receipts`),
    /** 임시보관 저장 */
    saveDraft: (body: ComposeRequest) => entityAppServer.http.post<ApiOk<MailMessageDetail>>("/v1/mua/drafts", body),
    /** 주소록 목록(이름/메일 검색) */
    listContacts: (search = "") =>
        entityAppServer.http.get<ApiOk<{ items: MailContact[]; total: number }>>(
            `/v1/mua/contacts${toQuery({ search, limit: 500 })}`
        ),
    /** 연락처 등록(같은 주소가 있으면 ok:false + 409 문구, data = 기존 행) */
    /** 내가 한 번이라도 메일을 보낸 주소(많이 보낸 차례) — 받는 사람 고르기 창의 "보낸 주소" 묶음(2026-10-27) */
    listSentRecipients: () =>
        entityAppServer.http.get<ApiOk<{ items: Array<{ name: string; email: string; count: number }> }>>("/v1/mua/contacts/sent"),
    createContact: (body: MailContactRequest) =>
        entityAppServer.http.post<ApiOk<MailContact>>("/v1/mua/contacts", body),
    /** 연락처 수정 */
    updateContact: (seq: number, body: MailContactRequest) =>
        entityAppServer.http.patch<ApiOk<MailContact>>(`/v1/mua/contacts/${seq}`, body),
    /** 연락처 삭제 */
    deleteContact: (seq: number) =>
        entityAppServer.http.delete<ApiOk<{ deleted: boolean }>>(`/v1/mua/contacts/${seq}`, {}),
    /** 첨부 다운로드(ES 파일 스토리지, 앵커 mail_message) */
    downloadAttachment: (uuid: string) => entityAppServer.fileDownload("mail_message", uuid),
};

/** 응답에서 data 를 꺼내고 실패면 throw 한다. */
export function unwrap<T>(res: ApiOk<T> | null | undefined, fallbackMessage: string): T {
    if (!res || res.ok === false) {
        throw new Error(res?.error || fallbackMessage);
    }
    return res.data;
}
