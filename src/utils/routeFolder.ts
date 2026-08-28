/**
 * 메일 라우트 :folder 파라미터 → 목록 폴더 정규화(Layout·MailRouteEntry 공용).
 */

import type { MailListFolder } from "../models/types";

/** 라우트 :folder 로 허용하는 값(없거나 모르는 값이면 받은편지함). */
const ROUTE_FOLDERS: MailListFolder[] = ["inbox", "sent", "starred", "spam", "draft", "trash"];

/** 라우트 :folder 값을 목록 폴더로 정규화한다. */
export function toRouteFolder(value: string | undefined): MailListFolder {
    return ROUTE_FOLDERS.includes(value as MailListFolder) ? (value as MailListFolder) : "inbox";
}
