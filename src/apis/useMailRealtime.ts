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

interface UseMailRealtimeOptions {
    enabled?: boolean; // 활성화(로그인 상태)
    onEvent?: (data: MailChangedData) => void; // 수신 콜백
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
        // 다시 붙었을 때(closed → connecting → open 이라 "처음 붙은 것이 아닌 open" 으로 본다)와 화면으로 돌아왔을 때 다시 읽게 알린다.
        let openedOnce = false;
        let lastResyncAt = Date.now();
        const resync = (minGapMs: number) => {
            if (Date.now() - lastResyncAt < minGapMs) return;
            lastResyncAt = Date.now();
            onEventRef.current?.({ resync: true });
        };
        const onStatus = (change: RealtimeStatusChange) => {
            if (change.status !== "open" || change.previousStatus === "open") return;
            if (openedOnce) resync(3000);
            openedOnce = true;
        };
        const onVisible = () => {
            if (document.visibilityState === "visible") resync(RESYNC_MIN_GAP_MS);
        };
        const onFocus = () => resync(RESYNC_MIN_GAP_MS);
        entityAppServer.addRealtimeStatusListener(onStatus);
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);
        return () => {
            entityAppServer.removeRealtimeEventListener(MAIL_CHANGED_EVENT, handler);
            entityAppServer.removeRealtimeStatusListener(onStatus);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [enabled]);
}
