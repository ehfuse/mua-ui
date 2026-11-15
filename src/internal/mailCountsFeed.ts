/**
 * 건수 알림(0.4.84) — 메일 화면이 GET /counts(또는 진입 묶음)로 받은 건수를 앱에도 알린다.
 * 앱 사이드바의 임시보관 · 예약 알약이 같은 값을 쓰는데, 메일 화면에 들어올 때마다 따로 /counts 를 불러 같은 요청이 겹쳤다(2026-11-15).
 * mailAccountSeq 는 그 건수를 센 계정(0 = 전체) — 전체 건수가 필요한 쪽은 0 일 때만 받아 쓴다.
 */

import type { MailCountsData } from "../apis/mailApi";

type Listener = (data: MailCountsData, mailAccountSeq: number) => void;
const listeners = new Set<Listener>();

/** 건수를 받을 때마다 알린다(구독 해제 함수를 돌려준다). */
export function subscribeMailCounts(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** 받은 건수를 알린다 — loadCounts 가 부른다. */
export function emitMailCounts(data: MailCountsData, mailAccountSeq: number): void {
    listeners.forEach((listener) => {
        try {
            listener(data, mailAccountSeq);
        } catch {
            // 앱 쪽 오류가 메일 화면을 막지 않게
        }
    });
}
