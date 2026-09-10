/**
 * 메일 표시 포맷 유틸.
 */
import type { MailAddress, MailMessageListItem } from "../models/types";
/** "YYYY-MM-DD HH:mm:ss" / ISO 문자열을 Date 로 만든다(실패 시 null). */
export declare function parseMailDate(value: string | null | undefined): Date | null;
/** 목록용 짧은 일시 — 오늘은 HH:mm, 올해는 M월 D일, 그 외 YYYY.MM.DD */
export declare function formatMailListDate(value: string | null | undefined): string;
/** 상세용 전체 일시 — YYYY년 M월 D일 (요일) HH:mm */
export declare function formatMailFullDate(value: string | null | undefined): string;
/** 주소를 "이름 <addr>" 또는 "addr" 로 표시한다. */
export declare function formatAddressLabel(addr: MailAddress | null | undefined): string;
/** 주소 목록을 쉼표로 잇는다. */
export declare function formatAddressList(list: MailAddress[] | undefined): string;
/** 목록 행의 상대(발신자 또는 수신자) 표시명을 만든다. */
export declare function formatCounterpart(row: MailMessageListItem): string;
/** 바이트를 읽기 쉬운 크기로 만든다. */
export declare function formatBytes(bytes: number): string;
/** 쉼표/세미콜론/줄바꿈 구분 주소 문자열을 배열로 나눈다. */
export declare function splitAddressInput(text: string): string[];
