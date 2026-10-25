import { t } from "../i18n";
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
/* 표의 칸 폭은 <col width> 로도 못박히고(워드·아웃룩이 만든 표), 칸의 nowrap 은 글이 줄을 못 바꾸게 해 표가 글 폭 아래로 줄지 못한다 —
   낱말을 안 끊는 keep-all 도 같다 —
   모두 풀어야 표가 화면 폭 안으로 접힌다(2026-10-12 KCP 안내 메일: 칸마다 180px 로 서서 가로로 밀어야 했다). pre 는 건드리지 않는다. */
body.mua-fit col,body.mua-fit colgroup{width:auto !important;min-width:0 !important;}
body.mua-fit td,body.mua-fit th,body.mua-fit p,body.mua-fit div,body.mua-fit span,body.mua-fit a,body.mua-fit b,body.mua-fit font,body.mua-fit li,body.mua-fit nobr{white-space:normal !important;word-break:break-word !important;}
body.mua-fit img,body.mua-fit video{max-width:100% !important;height:auto !important;}
body.mua-fit{overflow-wrap:break-word;}
/* mua-scroll — 접어도 화면 폭 안으로 안 들어오는 표(칸 안 글이 줄을 바꾸지 않는 표)를 감싼 상자(wrapWideTables).
   그 표만 제자리에서 가로로 민다. 스크롤 막대가 표 바로 아래에 서므로 마우스로도 잡아 끌 수 있다. */
.mua-scroll{overflow-x:auto;max-width:100%;-webkit-overflow-scrolling:touch;}
blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #cbd5e1;color:#475569;}
</style></head><body>${bodyHtml}</body></html>`;
}

/**
 * 화면 폭보다 넓은 표를 가로 스크롤 상자(.mua-scroll)로 감싼다(2026-10-12).
 *
 * mua-fit 으로 고정 폭을 풀어도 줄지 않는 표가 있다 — 칸 안의 글이 줄을 바꾸지 않으면 표는 그 글 폭 아래로 못 줄어든다.
 * 전에는 본문 문서 전체가 가로로 넘쳤는데, 본문 프레임은 내용 높이만큼 길어서 **가로 스크롤 막대가 메일 맨 아래에만** 생겼다:
 * 폰은 손가락으로 밀면 되지만 PC(마우스)에서는 막대를 찾아 맨 아래까지 내려가야 해 가려진 칸을 사실상 볼 수 없었다.
 * 넓은 표만 제자리에서 밀게 하면 막대가 그 표 바로 아래에 서고, 나머지 글은 화면 폭에 맞춰 그대로 읽힌다.
 *
 * 안쪽 표부터 본다 — 안쪽 표를 감싸면 그것을 품은 바깥(배치용) 표가 줄어들 수 있어, 바깥까지 감쌀 일이 없어진다.
 */
export function wrapWideTables(doc: Document): void {
    const root = doc.documentElement;
    const limit = root?.clientWidth ?? 0;
    if (limit <= 0 || !doc.defaultView) return;
    const padRight = parseFloat(doc.defaultView.getComputedStyle(doc.body).paddingRight) || 0;
    /**
     * 상자의 폭을 화면에 남은 폭으로 못박는다. 폭을 정해 주지 않으면 두 가지로 틀어진다:
     *   · 그냥 두면 상자가 안의 표만큼 넓어져(스크롤 상자도 제 내용 폭을 바깥에 그대로 알린다) 바깥 배치 표까지 넘친다 — 결국 메일 전체가 밀린다.
     *   · 내용 폭을 0 으로 알리게 하면(contain) 바깥 표가 옆 칸 폭까지 줄어 상자가 몇십 px 로 쪼그라든다.
     * mua-fit 의 `div{width:auto !important}` 를 이겨야 해서 important 로 넣는다. 조상 칸의 오른쪽 여백·테두리만큼 넘치면 그만큼 더 줄인다.
     */
    const size = (wrap: HTMLElement) => {
        const width = Math.max(120, Math.floor(limit - padRight - wrap.getBoundingClientRect().left));
        wrap.style.setProperty("width", `${width}px`, "important");
        const excess = root.scrollWidth - limit;
        if (excess > 0) wrap.style.setProperty("width", `${Math.max(120, width - excess)}px`, "important");
    };
    // 이미 감싼 상자는 폭만 다시 잰다 — 창 폭이 바뀌었을 수 있다(fit 은 폭이 바뀔 때마다 다시 돈다).
    doc.body.querySelectorAll<HTMLElement>(".mua-scroll").forEach(size);
    const tables = Array.from(doc.body.querySelectorAll("table")).reverse();
    for (const table of tables) {
        const parent = table.parentElement;
        if (!parent || parent.classList.contains("mua-scroll")) continue;
        if (table.getBoundingClientRect().width <= limit + 1) continue;
        const wrap = doc.createElement("div");
        wrap.className = "mua-scroll";
        parent.insertBefore(wrap, table);
        wrap.appendChild(table);
        size(wrap);
    }
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
            ? `<div>${escapeHtml(t("quoteForwarded"))}</div>
<div>${escapeHtml(t("quoteFrom", { value: formatAddressLabel(detail.from) }))}</div>
<div>${escapeHtml(t("quoteDate", { value: formatMailFullDate(detail.date_time) }))}</div>
<div>${escapeHtml(t("quoteSubject", { value: detail.subject || "" }))}</div>
<div>${escapeHtml(t("quoteTo", { value: formatAddressList(detail.to) }))}</div>`
            : `<div>${escapeHtml(t("quoteWrote", { date: formatMailFullDate(detail.date_time), sender: formatAddressLabel(detail.from) }))}</div>`;
    return `<p><br></p><p><br></p><div style="color:#475569;font-size:13px;">${header}</div><blockquote style="margin:8px 0;padding-left:12px;border-left:3px solid #cbd5e1;">${original}</blockquote>`;
}

/** 답장/전달 제목 접두사를 붙인다(이미 있으면 유지). */
export function prefixSubject(subject: string | null, prefix: "Re" | "Fwd"): string {
    const text = String(subject ?? "").trim();
    return new RegExp(`^${prefix}:`, "i").test(text) ? text : `${prefix}: ${text}`;
}
