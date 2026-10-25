import { intlTag, t } from "../i18n";
/**
 * 메일 표시 포맷 유틸.
 */

import type { MailAddress, MailMessageListItem } from "../models/types";

/** "YYYY-MM-DD HH:mm:ss" / ISO 문자열을 Date 로 만든다(실패 시 null). */
export function parseMailDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const text = String(value).trim();
    // AS 가 저장하는 date_time("YYYY-MM-DD HH:mm:ss", formatSqlDateTime)은 UTC 다 — 시간대 표기가 없는 값은 UTC 로 읽어
    // 브라우저 로컬(KST)로 표시한다. 시간대가 붙은 ISO 문자열은 그대로 파싱한다.
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(text);
    const iso = text.includes("T") ? text : text.replace(" ", "T");
    const date = new Date(hasZone ? iso : `${iso}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** 목록용 짧은 일시 — 오늘은 HH:mm, 올해는 M월 D일, 그 외 YYYY.MM.DD */
export function formatMailListDate(value: string | null | undefined): string {
    const date = parseMailDate(value);
    if (!date) return "";
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    if (date.toDateString() === now.toDateString()) {
        // 오늘은 "오후 6:31" 처럼 12시간제(0시 = 오전 12시).
        // 화면 언어의 Intl 꼴(한국어 "오후 6:31")
        return new Intl.DateTimeFormat(intlTag(), { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
    }
    if (date.getFullYear() === now.getFullYear()) return new Intl.DateTimeFormat(intlTag(), { month: "short", day: "numeric" }).format(date);
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/** 상세용 전체 일시 — YYYY년 M월 D일 (요일) HH:mm */
export function formatMailFullDate(value: string | null | undefined): string {
    const date = parseMailDate(value);
    if (!date) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    // 날짜 · 요일은 화면 언어의 Intl 꼴(한국어 "2026년 10월 26일 (월)") + 24시간 시각
    const day = new Intl.DateTimeFormat(intlTag(), { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);
    return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 뒤에서 보내는 메일의 상태 글자 — 보낸편지함 목록의 제목 앞과 상세에 쓴다. 다 보낸 메일은 빈 문자열. */
export function sendStateLabel(state: string | null | undefined): string {
    if (state === "sending") return t("sendingNow");
    if (state === "failed") return t("sendFailed");
    if (state === "partial") return t("partialSendFailed");
    return "";
}

/** 상태 글자의 색 — 보내는 중은 눌러 두고, 실패는 빨갛게 세운다. */
export function sendStateColor(state: string | null | undefined): string {
    return state === "sending" ? "#64748b" : "#dc2626";
}

/** 예약 메일의 제목 머리 — "[예약 10월 12일 09:00] ". 예약이 아니면 빈 문자열. */
export function scheduledPrefix(sendAt: string | null | undefined): string {
    const date = parseMailDate(sendAt);
    if (!date) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `[${t("scheduledPrefix", { date: `${new Intl.DateTimeFormat(intlTag(), { month: "short", day: "numeric" }).format(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}` })}] `;
}

/** 주소를 "이름 <addr>" 또는 "addr" 로 표시한다. */
export function formatAddressLabel(addr: MailAddress | null | undefined): string {
    if (!addr) return "";
    return addr.name ? `${addr.name} <${addr.address}>` : addr.address;
}

/** 주소 목록을 쉼표로 잇는다. */
export function formatAddressList(list: MailAddress[] | undefined): string {
    return (list ?? []).map(formatAddressLabel).join(", ");
}

/** 목록 행의 상대(발신자 또는 수신자) 표시명을 만든다. */
export function formatCounterpart(row: MailMessageListItem): string {
    if (row.folder === "sent" || row.folder === "draft") {
        return row.to_summary || t("noRecipient");
    }
    return row.from_name || row.from_address || t("noSender");
}

/** 바이트를 읽기 쉬운 크기로 만든다. */
export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

/** 쉼표/세미콜론/줄바꿈 구분 주소 문자열을 배열로 나눈다. */
export function splitAddressInput(text: string): string[] {
    return String(text ?? "")
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
