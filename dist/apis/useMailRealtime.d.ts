/** 메일 변동 realtime 수신 훅 — AS plugins/mua/services/realtime.ts 의 mua.mail.changed 와 일치. */
/** 이벤트명 */
export declare const MAIL_CHANGED_EVENT = "mua.mail.changed";
/** payload */
export interface MailChangedData {
    mail_account_seq?: number;
    folder?: string;
    added?: number;
    changed_time?: string;
    /** 서버가 보낸 것이 아니라 "끊겼다 돌아왔으니 다시 읽어라" 는 신호(2026-10-12) — 어느 계정·폴더인지 모르므로 보고 있는 것을 그대로 다시 읽는다. */
    resync?: boolean;
}
interface UseMailRealtimeOptions {
    enabled?: boolean;
    onEvent?: (data: MailChangedData) => void;
}
/** 메일 변동 이벤트를 수신한다. */
export declare function useMailRealtime({ enabled, onEvent }?: UseMailRealtimeOptions): void;
export {};
