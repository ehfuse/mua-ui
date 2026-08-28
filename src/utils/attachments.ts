/**
 * 작성 첨부 파일 읽기 유틸 — File → base64.
 */

import type { ComposeAttachment } from "../models/types";

/** 첨부 1개 최대 크기(MB) — AS max_attachment_mb 와 맞춘다. */
export const MAX_ATTACHMENT_MB = 20;

/** File 을 base64 첨부 항목으로 읽는다. */
export function readFileAsAttachment(file: File): Promise<ComposeAttachment> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error("파일을 읽지 못했습니다."));
        reader.onload = () => {
            const result = String(reader.result ?? "");
            const base64 = result.includes(",") ? result.slice(result.indexOf(",") + 1) : result;
            resolve({
                name: file.name,
                mime: file.type || "application/octet-stream",
                size: file.size,
                content_base64: base64,
            });
        };
        reader.readAsDataURL(file);
    });
}
