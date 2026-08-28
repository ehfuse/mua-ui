/**
 * 메일 화면 Actions — 계정/목록/상세/건수/동기화/메시지 조작. API 호출은 전부 여기서만 한다.
 */

import type { ActionContext } from "@ehfuse/forma";
import { ErrorAlert, SuccessAlert } from "@ehfuse/alerts";
import { mailApi, unwrap, type BulkMessageAction } from "../apis/mailApi";
import { defaultMailFolderCounts } from "../models/defaults";
import {
    MAIL_PAGE_SIZE,
    type MailAccount,
    type MailFilters,
    type MailFolderCounts,
    type MailMessageDetail,
    type MailMessageListItem,
    type MailState,
} from "../models/types";

/** 목록 요청 시퀀스(오래된 응답 폐기용) */
let latestListRequestSeq = 0;
/** 상세 요청 시퀀스 */
let latestDetailRequestSeq = 0;

/** 오류 메시지 추출 */
function messageOf(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
}

/** 내 메일 계정 목록을 읽는다. */
export const loadAccounts =
    () =>
    async (context: ActionContext<MailState>): Promise<MailAccount[]> => {
        context.setValue("loadingAccounts", true);
        try {
            const data = unwrap(await mailApi.listAccounts(), "메일 계정을 불러오지 못했습니다.");
            const items = Array.isArray(data.items) ? data.items : [];
            context.setValue("accounts", items);
            return items;
        } catch (error) {
            ErrorAlert({ message: messageOf(error, "메일 계정을 불러오지 못했습니다.") });
            return [];
        } finally {
            context.setValue("loadingAccounts", false);
        }
    };

/** 필터를 바꾼다(목록 재조회는 Layout 의 effect 가 필터 변화를 보고 호출한다). */
export const setFilters =
    () =>
    (context: ActionContext<MailState>, patch: Partial<MailFilters>): void => {
        const current = context.getValue("filters") as MailFilters;
        const next = { ...current, ...patch };
        const same =
            current.mailAccountSeq === next.mailAccountSeq &&
            current.folder === next.folder &&
            current.search === next.search &&
            current.unreadOnly === next.unreadOnly &&
            current.starredOnly === next.starredOnly;
        if (same) return;
        context.setValue("filters", next);
        // 폴더/계정이 바뀌면 선택 상세는 의미가 없어진다.
        if (current.folder !== next.folder || current.mailAccountSeq !== next.mailAccountSeq) {
            context.setValue("selectedSeq", 0);
            context.setValue("detail", null);
            // 다른 폴더/계정의 목록이 새 목록이 오기 전까지 남아 보이지 않게 즉시 비운다
            // (모바일 서브페이지는 같은 전역 mail-state 를 쓰므로 이전 폴더 행이 그대로 보였다).
            context.setValue("messages", []);
            context.setValue("total", 0);
            context.setValue("page", 0);
            context.setValue("loadingList", true);
        }
    };

/** 목록을 읽는다. append=true 면 다음 페이지를 이어 붙인다. */
export const loadMessages =
    () =>
    async (context: ActionContext<MailState>, options?: { append?: boolean; silent?: boolean }): Promise<void> => {
        const filters = context.getValue("filters") as MailFilters;
        const append = Boolean(options?.append);
        const page = append ? (Number(context.getValue("page")) || 0) + 1 : 1;
        const requestSeq = ++latestListRequestSeq;
        if (!options?.silent) context.setValue("loadingList", true);
        context.setValue("error", "");
        try {
            const data = unwrap(
                await mailApi.listMessages({
                    mail_account_seq: filters.mailAccountSeq,
                    folder: filters.folder,
                    page,
                    limit: MAIL_PAGE_SIZE,
                    search: filters.search,
                    unread: filters.unreadOnly,
                    starred: filters.starredOnly,
                }),
                "메일 목록을 불러오지 못했습니다."
            );
            if (requestSeq !== latestListRequestSeq) return;
            const items = Array.isArray(data.items) ? data.items : [];
            if (append) {
                const prev = context.getValue("messages") as MailMessageListItem[];
                const seen = new Set(prev.map((row) => row.seq));
                context.setValue("messages", [...prev, ...items.filter((row) => !seen.has(row.seq))]);
            } else {
                context.setValue("messages", items);
            }
            context.setValue("total", Number(data.total) || items.length);
            context.setValue("page", page);
        } catch (error) {
            if (requestSeq !== latestListRequestSeq) return;
            context.setValue("error", messageOf(error, "메일 목록을 불러오지 못했습니다."));
        } finally {
            if (requestSeq === latestListRequestSeq) context.setValue("loadingList", false);
        }
    };

/** 폴더/계정 건수를 읽고 계정별 미읽음도 갱신한다. */
export const loadCounts =
    () =>
    async (context: ActionContext<MailState>): Promise<void> => {
        const filters = context.getValue("filters") as MailFilters;
        try {
            const data = unwrap(await mailApi.counts(filters.mailAccountSeq), "건수를 불러오지 못했습니다.");
            context.setValue("counts", { ...defaultMailFolderCounts, ...(data.folders ?? {}) } as MailFolderCounts);
            const accounts = context.getValue("accounts") as MailAccount[];
            const byAccount = data.by_account ?? {};
            context.setValue(
                "accounts",
                accounts.map((acc) => ({ ...acc, unread_count: Number(byAccount[String(acc.seq)] ?? 0) }))
            );
        } catch {
            // 건수는 보조 정보 — 실패해도 조용히 둔다.
        }
    };

/** 목록 행을 부분 갱신한다(상세가 같은 메시지면 함께). */
function patchLocalMessage(context: ActionContext<MailState>, seq: number, patch: Partial<MailMessageListItem>): void {
    const rows = context.getValue("messages") as MailMessageListItem[];
    context.setValue(
        "messages",
        rows.map((row) => (row.seq === seq ? { ...row, ...patch } : row))
    );
    const detail = context.getValue("detail") as MailMessageDetail | null;
    if (detail && detail.seq === seq) context.setValue("detail", { ...detail, ...patch });
}

/** 목록에서 행들을 제거한다(선택 중이면 선택 해제). */
function removeLocalMessages(context: ActionContext<MailState>, seqs: number[]): void {
    const remove = new Set(seqs);
    const rows = context.getValue("messages") as MailMessageListItem[];
    const next = rows.filter((row) => !remove.has(row.seq));
    context.setValue("messages", next);
    context.setValue("total", Math.max(0, (Number(context.getValue("total")) || 0) - (rows.length - next.length)));
    if (remove.has(Number(context.getValue("selectedSeq")))) {
        context.setValue("selectedSeq", 0);
        context.setValue("detail", null);
    }
}

/** 메시지를 선택해 상세를 읽는다(받은편지함 메시지는 열면서 읽음 처리). */
export const selectMessage =
    () =>
    async (context: ActionContext<MailState>, seq: number): Promise<void> => {
        if (!(seq > 0)) {
            context.setValue("selectedSeq", 0);
            context.setValue("detail", null);
            return;
        }
        const requestSeq = ++latestDetailRequestSeq;
        context.setValue("selectedSeq", seq);
        context.setValue("loadingDetail", true);
        const rows = context.getValue("messages") as MailMessageListItem[];
        const row = rows.find((r) => r.seq === seq);
        const wasUnread = Boolean(row && !row.is_read);
        try {
            const detail = unwrap(await mailApi.getMessage(seq, true), "메일을 불러오지 못했습니다.");
            if (requestSeq !== latestDetailRequestSeq) return;
            context.setValue("detail", detail);
            patchLocalMessage(context, seq, { is_read: true });
            if (wasUnread) {
                // 미읽음 건수 낙관 감소(서버 재집계는 loadCounts 로).
                const counts = context.getValue("counts") as MailFolderCounts;
                context.setValue("counts", { ...counts, inbox_unread: Math.max(0, counts.inbox_unread - 1) });
                const accounts = context.getValue("accounts") as MailAccount[];
                context.setValue(
                    "accounts",
                    accounts.map((acc) =>
                        acc.seq === row?.mail_account_seq
                            ? { ...acc, unread_count: Math.max(0, (acc.unread_count ?? 0) - 1) }
                            : acc
                    )
                );
            }
        } catch (error) {
            if (requestSeq !== latestDetailRequestSeq) return;
            ErrorAlert({ message: messageOf(error, "메일을 불러오지 못했습니다.") });
            context.setValue("selectedSeq", 0);
            context.setValue("detail", null);
        } finally {
            if (requestSeq === latestDetailRequestSeq) context.setValue("loadingDetail", false);
        }
    };

/** 선택을 해제한다. */
export const clearSelection =
    () =>
    (context: ActionContext<MailState>): void => {
        context.setValue("selectedSeq", 0);
        context.setValue("detail", null);
    };

/** 메시지 일괄/단건 액션(읽음·중요·휴지통·복원·영구삭제)을 적용하고 목록을 낙관 갱신한다. */
export const applyMessageAction =
    () =>
    async (context: ActionContext<MailState>, seqs: number[], action: BulkMessageAction): Promise<boolean> => {
        const targets = Array.from(new Set(seqs.filter((s) => s > 0)));
        if (targets.length === 0) return false;
        try {
            unwrap(await mailApi.bulkMessages(targets, action), "처리하지 못했습니다.");
        } catch (error) {
            ErrorAlert({ message: messageOf(error, "처리하지 못했습니다.") });
            return false;
        }
        if (action === "read" || action === "unread") {
            for (const seq of targets) patchLocalMessage(context, seq, { is_read: action === "read" });
        } else if (action === "star" || action === "unstar") {
            for (const seq of targets) patchLocalMessage(context, seq, { is_starred: action === "star" });
        } else {
            removeLocalMessages(context, targets);
            const label =
                action === "trash"
                    ? "휴지통으로 이동했습니다."
                    : action === "spam"
                      ? "스팸함으로 이동했습니다."
                      : action === "restore"
                        ? "복원했습니다."
                        : "영구 삭제했습니다.";
            SuccessAlert(`${targets.length}건을 ${label}`);
        }
        return true;
    };

/** 계정(0=전체 활성 계정)을 즉시 동기화하고 목록/건수를 다시 읽는다. */
export const syncNow =
    () =>
    async (context: ActionContext<MailState>, mailAccountSeq: number): Promise<void> => {
        const accounts = context.getValue("accounts") as MailAccount[];
        const targets =
            mailAccountSeq > 0 ? accounts.filter((a) => a.seq === mailAccountSeq) : accounts.filter((a) => a.enabled);
        if (targets.length === 0) {
            ErrorAlert({ message: "동기화할 메일 계정이 없습니다. 먼저 계정을 등록하세요." });
            return;
        }
        // 동기화 중 표시는 계정별로 — 눌린 계정(또는 전체 대상)만 켜고, 각 계정이 끝날 때마다 내린다.
        const targetSeqs = targets.map((a) => a.seq);
        const markDone = (seq: number) =>
            context.setValue(
                "syncingSeqs",
                (context.getValue("syncingSeqs") as number[]).filter((s) => s !== seq)
            );
        context.setValue("syncingSeqs", [
            ...new Set([...(context.getValue("syncingSeqs") as number[]), ...targetSeqs]),
        ]);
        let added = 0;
        const errors: string[] = [];
        try {
            for (const account of targets) {
                try {
                    const result = unwrap(await mailApi.syncAccount(account.seq), "동기화에 실패했습니다.");
                    added += Number(result.added) || 0;
                    if (result.error) errors.push(`${account.email}: ${result.error}`);
                    if (result.account) {
                        const current = context.getValue("accounts") as MailAccount[];
                        context.setValue(
                            "accounts",
                            current.map((a) =>
                                a.seq === account.seq ? { ...a, ...result.account, unread_count: a.unread_count } : a
                            )
                        );
                    }
                } catch (error) {
                    errors.push(`${account.email}: ${messageOf(error, "동기화 실패")}`);
                } finally {
                    markDone(account.seq);
                }
            }
        } finally {
            targetSeqs.forEach(markDone);
        }
        if (errors.length > 0) ErrorAlert({ message: errors.join("\n") });
        else SuccessAlert(added > 0 ? `새 메일 ${added}건을 받았습니다.` : "새 메일이 없습니다.");
    };
