/**
 * 작성 첨부 파일 읽기 유틸 — File → base64.
 */
import type { ComposeAttachment } from "../models/types";
/** 첨부 1개 최대 크기(MB) — AS max_attachment_mb 와 맞춘다. */
export declare const MAX_ATTACHMENT_MB = 20;
/** File 을 base64 첨부 항목으로 읽는다. */
export declare function readFileAsAttachment(file: File): Promise<ComposeAttachment>;
