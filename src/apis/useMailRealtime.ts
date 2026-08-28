/** 메일 변동 realtime 수신 훅 — AS plugins/mua/services/realtime.ts 의 mua.mail.changed 와 일치. */

import { useEffect, useRef } from "react";
import { entityAppServer, type RealtimeEnvelope } from "entity-client";

/** 이벤트명 */
export const MAIL_CHANGED_EVENT = "mua.mail.changed";

/** payload */
export interface MailChangedData {
    mail_account_seq?: number; // 변동 계정
    folder?: string; // 변동 폴더
    added?: number; // 새 메시지 수
    changed_time?: string; // 시각
}

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
        return () => {
            entityAppServer.removeRealtimeEventListener(MAIL_CHANGED_EVENT, handler);
        };
    }, [enabled]);
}
