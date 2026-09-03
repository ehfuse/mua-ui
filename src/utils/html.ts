/**
 * 메일 본문 HTML 정제/인용 유틸.
 */

import DOMPurify from "dompurify";
import type { MailMessageDetail } from "../models/types";
import { formatAddressLabel, formatAddressList, formatMailFullDate } from "./format";

/** 원격 이미지(http/https src)를 차단 표시로 바꾼다(data: 는 허용). */
function blockRemoteImages(html: string): string {
    return html.replace(
        /(<img\b[^>]*?)\ssrc\s*=\s*(["'])(https?:)?\/\/[^"']*\2/gi,
        '$1 data-blocked-src="remote" src=""'
    );
}

/** 본문 HTML 을 안전하게 정제한다. allowRemoteImages 가 false 면 외부 이미지를 막는다. */
export function sanitizeMailHtml(html: string, allowRemoteImages: boolean): string {
    const clean = DOMPurify.sanitize(html || "", {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "meta", "link", "base"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "srcdoc"],
        ADD_ATTR: ["target"],
    });
    return allowRemoteImages ? clean : blockRemoteImages(clean);
}

/**
 * 정제된 본문을 iframe srcDoc 용 문서로 감싼다(링크는 새 창, 폭 넘침 방지).
 * `upgrade-insecure-requests` — 메일 본문의 `http://` 이미지는 https 앱(특히 앱 웹뷰)에서 혼합 콘텐츠로
 * 조용히 차단돼 깨진 아이콘만 남는다(2026-09-03 국세청 홈택스 발급 메일: 이미지 11개 전부 http://srtk.hometax.go.kr).
 * 이 지시로 브라우저가 이미지·링크 요청을 https 로 올려 보낸다(https 가 없는 서버는 어차피 차단되던 것이라 손해 없음).
 */
export function wrapMailDocument(bodyHtml: string): string {
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"><base target="_blank">
<style>
body{margin:0;padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,"Malgun Gothic","Apple SD Gothic Neo",sans-serif;font-size:14px;line-height:1.6;color:#111;word-break:break-word;}
img{max-width:100%;height:auto;}
img[data-blocked-src]{display:inline-block;min-width:24px;min-height:24px;background:#f1f5f9;border:1px dashed #cbd5e1;}
table{max-width:100%;}
pre{white-space:pre-wrap;}
/* mua-fit — 본문이 화면 폭보다 넓을 때만 붙는다(MailBodyFrame). 고정폭(width=600 테이블 등)을 무력화해
   축소 없이 화면 폭에 맞춰 개행되게 한다. 이미지·비디오는 폭만 캡(비율 유지). */
body.mua-fit table,body.mua-fit tbody,body.mua-fit tr,body.mua-fit td,body.mua-fit th,
body.mua-fit div,body.mua-fit p,body.mua-fit section,body.mua-fit article,body.mua-fit center{
    width:auto !important;min-width:0 !important;max-width:100% !important;
}
body.mua-fit img,body.mua-fit video{max-width:100% !important;height:auto !important;}
body.mua-fit{overflow-wrap:break-word;}
blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #cbd5e1;color:#475569;}
</style></head><body>${bodyHtml}</body></html>`;
}

/** HTML 특수문자를 이스케이프한다. */
export function escapeHtml(text: string): string {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** 답장/전달용 인용 블록을 만든다(원문은 정제 후 인용). */
export function buildQuotedBody(detail: MailMessageDetail, mode: "reply" | "forward"): string {
    const original = sanitizeMailHtml(detail.body_html || escapeHtml(detail.body_text).replace(/\n/g, "<br>"), true);
    const header =
        mode === "forward"
            ? `<div>---------- 전달된 메일 ----------</div>
<div>보낸 사람: ${escapeHtml(formatAddressLabel(detail.from))}</div>
<div>날짜: ${escapeHtml(formatMailFullDate(detail.date_time))}</div>
<div>제목: ${escapeHtml(detail.subject || "")}</div>
<div>받는 사람: ${escapeHtml(formatAddressList(detail.to))}</div>`
            : `<div>${escapeHtml(formatMailFullDate(detail.date_time))}에 ${escapeHtml(formatAddressLabel(detail.from))} 님이 작성:</div>`;
    return `<p><br></p><p><br></p><div style="color:#475569;font-size:13px;">${header}</div><blockquote style="margin:8px 0;padding-left:12px;border-left:3px solid #cbd5e1;">${original}</blockquote>`;
}

/** 답장/전달 제목 접두사를 붙인다(이미 있으면 유지). */
export function prefixSubject(subject: string | null, prefix: "Re" | "Fwd"): string {
    const text = String(subject ?? "").trim();
    return new RegExp(`^${prefix}:`, "i").test(text) ? text : `${prefix}: ${text}`;
}
