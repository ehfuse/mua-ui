/**
 * 메일(MUA) API 래퍼 — AS /v1/mua/* (entityAppServer 직접 호출, 오류는 throw).
 */

import { entityAppServer } from "entity-client";
import type {
    ComposeRequest,
    MailAccount,
    MailAccountRequest,
    MailConnectionTestResult,
    MailFolder,
    MailFolderCounts,
    MailListFolder,
    MailMessageDetail,
    MailMessageListItem,
    MailSyncResult,
    MailAccountSecrets,
} from "../models/types";

/** AS 표준 응답 */
interface ApiOk<T> {
    ok: boolean; // 성공 여부
    data: T; // 데이터
    error?: string; // 오류
}

/** 목록 조회 파라미터 */
export interface ListMessagesParams {
    mail_account_seq: number; // 0=전체
    folder: MailListFolder; // 폴더(가상 폴더 starred 포함)
    page: number; // 페이지
    limit: number; // 크기
    search?: string; // 검색어
    unread?: boolean; // 미읽음만
    starred?: boolean; // 중요만
}

/** 목록 응답 */
export interface ListMessagesResponse {
    items: MailMessageListItem[]; // 행
    total: number; // 총 건수
    page: number; // 페이지
    limit: number; // 크기
}

/** 일괄 처리 액션 */
export type BulkMessageAction = "read" | "unread" | "star" | "unstar" | "trash" | "spam" | "restore" | "delete";

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

/** 메일 API */
export const mailApi = {
    /** 내 메일 계정 목록 */
    listAccounts: () => entityAppServer.http.get<ApiOk<{ items: MailAccount[] }>>("/v1/mua/accounts"),
    /** 계정 등록 */
    createAccount: (body: MailAccountRequest) =>
        entityAppServer.http.post<ApiOk<MailAccount>>("/v1/mua/accounts", body),
    /** 계정 수정 */
    updateAccount: (seq: number, body: MailAccountRequest) =>
        entityAppServer.http.patch<ApiOk<MailAccount>>(`/v1/mua/accounts/${seq}`, body),
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
        entityAppServer.http.get<ApiOk<{ by_account: Record<string, number>; folders: MailFolderCounts }>>(
            `/v1/mua/counts${toQuery({ mail_account_seq: mailAccountSeq })}`
        ),
    /** 목록 */
    listMessages: (params: ListMessagesParams) =>
        entityAppServer.http.get<ApiOk<ListMessagesResponse>>(`/v1/mua/messages${toQuery(params)}`),
    /** 상세(+읽음 처리) */
    getMessage: (seq: number, markRead: boolean) =>
        entityAppServer.http.get<ApiOk<MailMessageDetail>>(
            `/v1/mua/messages/${seq}${toQuery({ mark_read: markRead })}`
        ),
    /** 읽음/중요/폴더 변경 */
    patchMessage: (seq: number, body: { is_read?: boolean; is_starred?: boolean; folder?: MailFolder | "restore" }) =>
        entityAppServer.http.patch<ApiOk<MailMessageDetail>>(`/v1/mua/messages/${seq}`, body),
    /** 일괄 처리 */
    bulkMessages: (seqs: number[], action: BulkMessageAction) =>
        entityAppServer.http.post<ApiOk<{ affected: number }>>("/v1/mua/messages/bulk", { seqs, action }),
    /** 영구 삭제 */
    deleteMessage: (seq: number) =>
        entityAppServer.http.delete<ApiOk<{ deleted: boolean }>>(`/v1/mua/messages/${seq}`, {}),
    /** 발송 */
    send: (body: ComposeRequest) =>
        entityAppServer.http.post<ApiOk<{ seq: number; message_id: string }>>("/v1/mua/send", body),
    /** 임시보관 저장 */
    saveDraft: (body: ComposeRequest) => entityAppServer.http.post<ApiOk<MailMessageDetail>>("/v1/mua/drafts", body),
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
