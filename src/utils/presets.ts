/**
 * 메일 주소 도메인별 서버 프리셋 — 계정 등록 시 호스트/포트를 자동 채운다.
 */

import type { ConnectionSecurity, IncomingProtocol } from "../models/types";

/** 프리셋 */
export interface MailServerPreset {
    imap_host: string; // IMAP 호스트
    pop3_host: string; // POP3 호스트
    smtp_host: string; // SMTP 호스트
    smtp_port: number; // SMTP 포트
    smtp_security: ConnectionSecurity; // SMTP 보안
    note?: string; // 안내
    note_url?: string; // 안내 링크(설정 방법 도움말)
    note_link_label?: string; // 링크 표시 문구
}

const PRESETS: Record<string, MailServerPreset> = {
    "gmail.com": {
        imap_host: "imap.gmail.com",
        pop3_host: "pop.gmail.com",
        smtp_host: "smtp.gmail.com",
        smtp_port: 465,
        smtp_security: "ssl",
        note: "Gmail 은 2단계 인증 후 발급한 앱 비밀번호를 사용해야 합니다.",
        note_url: "https://support.google.com/accounts/answer/185833?hl=ko",
        note_link_label: "앱 비밀번호 만드는 방법",
    },
    "naver.com": {
        imap_host: "imap.naver.com",
        pop3_host: "pop.naver.com",
        smtp_host: "smtp.naver.com",
        smtp_port: 465,
        smtp_security: "ssl",
        note: "네이버 메일 환경설정에서 IMAP/POP3 사용을 켜야 합니다.",
        note_url: "https://help.naver.com/service/5640/contents/8342?lang=ko",
        note_link_label: "설정 방법 보기",
    },
    "daum.net": {
        imap_host: "imap.daum.net",
        pop3_host: "pop.daum.net",
        smtp_host: "smtp.daum.net",
        smtp_port: 465,
        smtp_security: "ssl",
    },
    "hanmail.net": {
        imap_host: "imap.daum.net",
        pop3_host: "pop.daum.net",
        smtp_host: "smtp.daum.net",
        smtp_port: 465,
        smtp_security: "ssl",
    },
    "kakao.com": {
        imap_host: "imap.kakao.com",
        pop3_host: "pop3.kakao.com",
        smtp_host: "smtp.kakao.com",
        smtp_port: 465,
        smtp_security: "ssl",
    },
    "outlook.com": {
        imap_host: "outlook.office365.com",
        pop3_host: "outlook.office365.com",
        smtp_host: "smtp.office365.com",
        smtp_port: 587,
        smtp_security: "starttls",
    },
    "hotmail.com": {
        imap_host: "outlook.office365.com",
        pop3_host: "outlook.office365.com",
        smtp_host: "smtp.office365.com",
        smtp_port: 587,
        smtp_security: "starttls",
    },
    "nate.com": {
        imap_host: "imap.nate.com",
        pop3_host: "pop.nate.com",
        smtp_host: "smtp.nate.com",
        smtp_port: 465,
        smtp_security: "ssl",
    },
};

/** 주소의 도메인 프리셋을 찾는다(없으면 null). */
export function findMailPreset(email: string): MailServerPreset | null {
    const domain = String(email ?? "")
        .split("@")[1]
        ?.trim()
        .toLowerCase();
    return domain ? (PRESETS[domain] ?? null) : null;
}

/** 프로토콜·보안에 따른 기본 수신 포트. */
export function defaultIncomingPort(protocol: IncomingProtocol, security: ConnectionSecurity): number {
    if (protocol === "pop3") return security === "ssl" ? 995 : 110;
    return security === "ssl" ? 993 : 143;
}

/** 보안에 따른 기본 SMTP 포트. */
export function defaultSmtpPort(security: ConnectionSecurity): number {
    return security === "ssl" ? 465 : 587;
}
