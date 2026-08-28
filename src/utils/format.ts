/**
 * 메일 표시 포맷 유틸.
 */

import type { MailAddress, MailMessageListItem } from "../models/types";

/** "YYYY-MM-DD HH:mm:ss" / ISO 문자열을 Date 로 만든다(실패 시 null). */
export function parseMailDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const text = String(value).trim();
    const date = new Date(text.includes("T") || text.endsWith("Z") ? text : text.replace(" ", "T"));
    return Number.isNaN(date.getTime()) ? null : date;
}

/** 목록용 짧은 일시 — 오늘은 HH:mm, 올해는 M월 D일, 그 외 YYYY.MM.DD */
export function formatMailListDate(value: string | null | undefined): string {
    const date = parseMailDate(value);
    if (!date) return "";
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    if (date.toDateString() === now.toDateString()) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/** 상세용 전체 일시 — YYYY년 M월 D일 (요일) HH:mm */
export function formatMailFullDate(value: string | null | undefined): string {
    const date = parseMailDate(value);
    if (!date) return "";
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]}) ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
        return row.to_summary || "(받는 사람 없음)";
    }
    return row.from_name || row.from_address || "(발신자 없음)";
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
