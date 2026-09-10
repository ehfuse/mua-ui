/**
 * 메일 주소 도메인별 서버 프리셋 — 계정 등록 시 호스트/포트를 자동 채운다.
 */
import type { ConnectionSecurity, IncomingProtocol } from "../models/types";
/** 프리셋 */
export interface MailServerPreset {
    imap_host: string;
    pop3_host: string;
    smtp_host: string;
    smtp_port: number;
    smtp_security: ConnectionSecurity;
    note?: string;
    note_url?: string;
    note_link_label?: string;
}
/** 주소의 도메인 프리셋을 찾는다(없으면 null). */
export declare function findMailPreset(email: string): MailServerPreset | null;
/** 프로토콜·보안에 따른 기본 수신 포트. */
export declare function defaultIncomingPort(protocol: IncomingProtocol, security: ConnectionSecurity): number;
/** 보안에 따른 기본 SMTP 포트. */
export declare function defaultSmtpPort(security: ConnectionSecurity): number;
