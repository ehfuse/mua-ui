/**
 * 메일 화면 진입 묶음(0.4.84) — 메일 화면이 열릴 때 읽는 것을 GET /v1/mua/entry **한 번**으로 받아 각 로더가 나눠 쓴다.
 *
 * 다른 화면에서 메일로 옮기면 목록 · 건수(2번) · 라벨 · 설정 · 규칙 · 사서함 사용량(2번)이 따로 나갔다(2026-11-15 사용자 지시
 * "최소 호출로 통합하고 AS 에서 조립해서 응답하게"). 메일 화면(Layout)이 마운트될 때 beginMailScreenEntry 로 걸어 두면,
 * 같은 커밋의 effect 들이 모두 돈 뒤(마이크로태스크) 그때의 거르기로 요청 한 건을 낸다 — 라우트 → 거르기 effect 가 거르기를 바꾼 뒤라 목록 쿼리가 맞다.
 *
 * 각 로더(loadMessages · loadCounts · loadLabels · loadRules · 설정 · 사용량 게이지)는 takeMailScreenEntry 로 자기 조각을 **한 번만** 받는다.
 *   - undefined     : 줄 것이 없다(진입 묶음이 없음 · 이미 가져감 · 쿼리가 다름) → 개별 라우트로 읽는다.
 *   - Promise       : 응답을 기다린다 — 값이 undefined 로 오면(서버 실패 · 옛 서버 · 그 조각만 실패 · 쿼리 불일치) 개별 라우트로 읽는다.
 * 옛 서버(라우트 없음 404)면 이번 세션은 다시 부르지 않고 처음부터 개별 라우트로 읽는다.
 * 나중 동작(폴더 옮기기 · 쪽 넘기기 · 새로고침)은 지금처럼 개별 라우트를 쓴다 — 묶음은 마운트할 때 한 번이다.
 */

import { mailApi, unwrap, type ListMessagesParams, type MailScreenEntryData, type MailScreenEntryParams } from "../apis/mailApi";
import { trackMailboxUsage } from "./mailboxUsage";

type Part = keyof MailScreenEntryData;

interface Entry {
    params: MailScreenEntryParams | null; // 실제로 보낸 쿼리(보내기 전엔 null)
    promise: Promise<MailScreenEntryData | null>;
    taken: Set<Part>;
    createdAt: number;
}

/** 이만큼 지난 묶음은 버린다 — 뒤늦게 마운트된 다른 메일 화면(서브페이지 창)이 낡은 값을 받지 않게. */
const ENTRY_TTL_MS = 15_000;

let current: Entry | null = null;
let unsupported = false;

/** 목록 쿼리를 비교할 열쇠(쪽 · 크기까지) */
export function listParamsKey(params: ListMessagesParams): string {
    return [
        params.mail_account_seq,
        params.folder,
        params.mail_folder_seq ?? 0,
        params.page,
        params.limit,
        params.search ?? "",
        params.unread ? 1 : 0,
        params.starred ? 1 : 0,
        params.label_seq ?? 0,
        params.label_seqs ?? "",
        params.thread ? 1 : 0,
    ].join("|");
}

/**
 * 메일 화면이 마운트될 때 부른다. getParams 는 같은 커밋의 effect 가 모두 돈 뒤에 불린다(그때의 거르기 · 계정으로 쿼리를 만든다).
 * 이미 걸어 둔 묶음이 아직 보내기 전이면 그것을 쓴다(같은 커밋에 화면이 둘 마운트돼도 한 건).
 */
export function beginMailScreenEntry(getParams: () => MailScreenEntryParams): void {
    if (unsupported) return;
    if (current && current.params === null) return;
    const entry: Entry = { params: null, promise: Promise.resolve(null), taken: new Set(), createdAt: Date.now() };
    entry.promise = new Promise<MailScreenEntryData | null>((resolve) => {
        queueMicrotask(() => {
            let params: MailScreenEntryParams;
            try {
                params = getParams();
            } catch {
                resolve(null);
                return;
            }
            entry.params = params;
            const request = mailApi
                .screenEntry(params)
                .then((res) => unwrap(res, ""))
                .catch((error: unknown) => {
                    const status = Number((error as { status?: unknown; statusCode?: unknown })?.status ?? (error as { statusCode?: unknown })?.statusCode ?? 0);
                    if (status === 404) unsupported = true;
                    return null;
                });
            // 사용량은 앱 사이드바도 같은 값을 쓴다 — 이 응답을 기다리는 동안 따로 읽지 않게 걸어 둔다.
            if ((params.usage_seq ?? 0) > 0) trackMailboxUsage(params.usage_seq!, request.then((data) => data?.usage ?? null));
            resolve(request);
        });
    });
    current = entry;
}

/**
 * 진입 묶음에서 그 조각을 가져온다(한 번만). match 를 주면 실제로 보낸 쿼리로 그 조각이 쓸 만한지 본다.
 * 돌려주는 값의 뜻은 파일 머리 주석.
 */
export function takeMailScreenEntry<K extends Part>(
    part: K,
    match?: (params: MailScreenEntryParams) => boolean
): Promise<NonNullable<MailScreenEntryData[K]> | undefined> | undefined {
    const entry = current;
    if (!entry || entry.taken.has(part) || Date.now() - entry.createdAt > ENTRY_TTL_MS) return undefined;
    entry.taken.add(part);
    return entry.promise.then((data) => {
        if (!data || !entry.params) return undefined;
        if (match && !match(entry.params)) return undefined;
        const value = data[part];
        return (value ?? undefined) as NonNullable<MailScreenEntryData[K]> | undefined;
    });
}
