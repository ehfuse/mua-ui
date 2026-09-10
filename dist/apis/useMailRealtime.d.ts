/** 메일 변동 realtime 수신 훅 — AS plugins/mua/services/realtime.ts 의 mua.mail.changed 와 일치. */
/** 이벤트명 */
export declare const MAIL_CHANGED_EVENT = "mua.mail.changed";
/** payload */
export interface MailChangedData {
    mail_account_seq?: number;
    folder?: string;
    added?: number;
    changed_time?: string;
}
interface UseMailRealtimeOptions {
    enabled?: boolean;
    onEvent?: (data: MailChangedData) => void;
}
/** 메일 변동 이벤트를 수신한다. */
export declare function useMailRealtime({ enabled, onEvent }?: UseMailRealtimeOptions): void;
export {};
