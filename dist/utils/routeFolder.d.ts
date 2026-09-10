/**
 * 메일 라우트 :folder 파라미터 → 목록 폴더 정규화(Layout·MailRouteEntry 공용).
 */
import type { MailListFolder } from "../models/types";
/** 라우트 :folder 값을 목록 폴더로 정규화한다. */
export declare function toRouteFolder(value: string | undefined): MailListFolder;
