/** 메일 변동 realtime 수신 훅 — AS plugins/mua/services/realtime.ts 의 mua.mail.changed 와 일치. */

import { useEffect, useRef } from "react";
import { entityAppServer, type RealtimeEnvelope, type RealtimeStatusChange } from "entity-client";

/** 이벤트명 */
export const MAIL_CHANGED_EVENT = "mua.mail.changed";

/** payload */
export interface MailChangedData {
    mail_account_seq?: number; // 변동 계정
    folder?: string; // 변동 폴더
    added?: number; // 새 메시지 수
    changed_time?: string; // 시각
    /** 서버가 보낸 것이 아니라 "끊겼다 돌아왔으니 다시 읽어라" 는 신호(2026-10-12) — 어느 계정·폴더인지 모르므로 보고 있는 것을 그대로 다시 읽는다. */
    resync?: boolean;
}

/** 돌아왔을 때 다시 읽기의 최소 간격 — 창을 오갈 때마다 읽지 않는다. */
const RESYNC_MIN_GAP_MS = 30_000;
/** 다시 붙음과 다시 보임이 거의 같이 온다 — 그 사이는 한 번으로. */
const RECONNECT_MIN_GAP_MS = 3_000;

interface UseMailRealtimeOptions {
    enabled?: boolean; // 활성화(로그인 상태)
    onEvent?: (data: MailChangedData) => void; // 수신 콜백
}

/**
 * 다시 읽기 신호는 모듈에서 한 벌만 듣는다(0.4.87) — 전에는 훅마다 상태 리스너를 붙이고 "처음 open 은 뺀다" 를 따로 셌다:
 *   · 소켓이 이미 열린 뒤에 뜬 훅(메일 화면 · 직원 목록 등)은 다음 재연결을 처음 붙음으로 여겨 건너뛰었다 — 끊긴 사이 온 메일 · 읽음이 안 맞았다.
 *   · 훅마다 따로 불러 같은 목록 다시 읽기가 훅 수만큼 나갔다(계정 · 메일함이 재연결마다 두 번).
 * 이제 처음 붙음은 앱에서 한 번만 세고(붙일 때 이미 열려 있으면 지난 것으로 본다), 가려진 탭에서 다시 붙으면 보일 때 한 번 부른다.
 * 듣는 쪽(훅)마다 마지막으로 부른 때를 따로 둔다 — 막 뜬 훅은 방금 읽었으니 30초 안의 다시 보임 · 포커스로는 또 읽지 않는다.
 */
interface ResyncListener {
    call: () => void;
    lastAt: number;
}
const resyncListeners = new Set<ResyncListener>();
let resyncBound = false;
let everOpened = false;
let resyncPending = false;

function resyncAll(minGapMs: number): void {
    const now = Date.now();
    for (const listener of resyncListeners) {
        if (now - listener.lastAt < minGapMs) continue;
        listener.lastAt = now;
        listener.call();
    }
}

function bindResync(): void {
    if (resyncBound || typeof window === "undefined") return;
    resyncBound = true;
    if ((entityAppServer as unknown as { realtimeStatus?: string }).realtimeStatus === "open") everOpened = true;
    entityAppServer.addRealtimeStatusListener((change: RealtimeStatusChange) => {
        // 다시 붙을 때의 상태는 closed → connecting → open 이다 — "open 이 아니던 것이 open 이 됐다" 로 본다.
        if (change.status !== "open" || change.previousStatus === "open") return;
        if (!everOpened) {
            everOpened = true;
            return;
        }
        if (document.visibilityState === "hidden") {
            resyncPending = true;
            return;
        }
        resyncAll(RECONNECT_MIN_GAP_MS);
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible") return;
        // 가려진 채 다시 붙었으면 끊긴 사이를 모른다 — 30초 간격과 상관없이 맞춘다.
        const pending = resyncPending;
        resyncPending = false;
        resyncAll(pending ? RECONNECT_MIN_GAP_MS : RESYNC_MIN_GAP_MS);
    });
    window.addEventListener("focus", () => resyncAll(RESYNC_MIN_GAP_MS));
}

/** 메일 변동 이벤트를 수신한다. */
export function useMailRealtime({ enabled = true, onEvent }: UseMailRealtimeOptions = {}): void {
    const onEventRef = useRef(onEvent);
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        if (!enabled) return;
        const handler = (envelope: RealtimeEnvelope) => {
            const data = (envelope as { data?: MailChangedData })?.data;
            if (data) onEventRef.current?.(data);
        };
        entityAppServer.addRealtimeEventListener(MAIL_CHANGED_EVENT, handler);
        const client = entityAppServer as unknown as { connectRealtime?: () => Promise<void> };
        void client.connectRealtime?.().catch(() => undefined);
        // 끊겨 있던 동안의 변동은 다시 오지 않는다 — 창을 내려 뒀다 올리면 다른 기기에서 읽은 메일이 안 읽음으로 남았다(2026-10-12).
        // 다시 붙었을 때와 화면으로 돌아왔을 때 다시 읽게 알린다(모듈 한 벌 — bindResync).
        bindResync();
        const listener: ResyncListener = { call: () => onEventRef.current?.({ resync: true }), lastAt: Date.now() };
        resyncListeners.add(listener);
        return () => {
            entityAppServer.removeRealtimeEventListener(MAIL_CHANGED_EVENT, handler);
            resyncListeners.delete(listener);
        };
    }, [enabled]);
}
