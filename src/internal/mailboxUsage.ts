/**
 * 사서함 사용량 공용 저장소(0.4.84) — 메일 화면 게이지(MailboxUsageGauge)와 앱 사이드바 판이 같은 값을 나눠 쓴다.
 *
 * 예전엔 둘이 따로 GET /accounts/:seq/usage 를 불러, 메일 화면에 들어올 때마다 같은 요청이 두 번 나갔다(2026-11-15 지적).
 * 이제 한 곳에서 읽고(같은 사서함을 읽는 중이면 그 요청을 이어받는다) 값이 바뀌면 구독자에게 알린다.
 * 메일 화면 진입 묶음(GET /entry)이 실어 온 값도 여기 넣는다 — 그 응답을 기다리는 동안 따로 읽지 않게 읽는 중으로 걸어 둔다.
 */

import { mailApi, type MailboxUsage } from "../apis/mailApi";
import type { MailAccount } from "../models/types";

const cache = new Map<number, { usage: MailboxUsage; at: number }>();
const inflight = new Map<number, Promise<MailboxUsage | null>>();
const listeners = new Set<(usage: MailboxUsage) => void>();

/** 보일 사서함 — 계정 하나를 보면 그 계정(사서함일 때만), 전체 보기면 내 개인 사서함 → 첫 사서함. 없으면 0. */
export function mailboxUsageTarget(accounts: MailAccount[] | undefined, mailAccountSeq: number): number {
    const hosted = (accounts ?? []).filter((account) => account.kind === "hosted");
    const target =
        mailAccountSeq > 0
            ? hosted.find((account) => account.seq === mailAccountSeq)
            : (hosted.find((account) => account.scope === "personal") ?? hosted[0]);
    return target?.seq ?? 0;
}

/** 기억해 둔 값(없으면 null) */
export function getMailboxUsage(seq: number): MailboxUsage | null {
    return cache.get(seq)?.usage ?? null;
}

/** 값이 바뀌면 알린다(구독 해제 함수를 돌려준다). */
export function subscribeMailboxUsage(listener: (usage: MailboxUsage) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** 다른 응답이 실어 온 값을 넣는다. */
export function seedMailboxUsage(usage: MailboxUsage): void {
    if (!usage || !(usage.seq > 0)) return;
    cache.set(usage.seq, { usage, at: Date.now() });
    listeners.forEach((listener) => listener(usage));
}

/** 그 사서함 값을 가져올 요청을 읽는 중으로 걸어 둔다 — 진입 묶음이 쓴다(그동안 loadMailboxUsage 는 이 응답을 기다린다). */
export function trackMailboxUsage(seq: number, pending: Promise<MailboxUsage | null>): void {
    if (!(seq > 0)) return;
    const tracked = pending.then((usage) => {
        if (usage) seedMailboxUsage(usage);
        return usage;
    });
    inflight.set(seq, tracked);
    void tracked.finally(() => {
        if (inflight.get(seq) === tracked) inflight.delete(seq);
    });
}

/**
 * 서버에서 읽는다. 같은 사서함을 읽는 중이면 그 요청을 이어받고, maxAgeMs 안에 받은 값이 있으면 다시 읽지 않는다.
 * 진입 묶음이 그 사서함을 빼고 왔으면(옛 서버 · 실패) 따로 읽는다.
 */
export function loadMailboxUsage(seq: number, maxAgeMs = 0, join = true): Promise<MailboxUsage | null> {
    if (!(seq > 0)) return Promise.resolve(null);
    const hit = cache.get(seq);
    if (hit && maxAgeMs > 0 && Date.now() - hit.at < maxAgeMs) return Promise.resolve(hit.usage);
    const running = join ? inflight.get(seq) : undefined;
    // 이어받은 요청이 값 없이 끝났으면 한 번만 따로 읽는다(다시 이어받지 않는다).
    if (running) return running.then((usage) => usage ?? loadMailboxUsage(seq, 0, false));
    const request = mailApi
        .getAccountUsage(seq)
        .then((res) => (res && res.ok !== false && res.data ? res.data : null))
        .catch(() => null);
    trackMailboxUsage(seq, request);
    return inflight.get(seq) ?? request;
}

/**
 * 조금 뒤에 읽는다 — 메일 화면 밖에서도 사용량을 그리는 앱 사이드바가 쓴다. 같은 순간 메일 화면이 열리면 진입 묶음이 이 값을 실어 오므로,
 * 기다렸다가 그사이 받은 값이 있으면(또는 읽는 중이면 그것을 이어받아) 따로 부르지 않는다.
 */
export function refreshMailboxUsageSoon(seq: number, delayMs = 1500): () => void {
    if (!(seq > 0)) return () => undefined;
    const askedAt = Date.now();
    const timer = setTimeout(() => {
        const hit = cache.get(seq);
        if (hit && hit.at >= askedAt) return;
        void loadMailboxUsage(seq);
    }, delayMs);
    return () => clearTimeout(timer);
}
