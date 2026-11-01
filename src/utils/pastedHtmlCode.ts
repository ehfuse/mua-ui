/**
 * 서명 칸에 붙여 넣은 HTML 코드 알아보기(2026-11-01) — 다른 메일(다음 · 네이버 등)에서 만든 서명 코드를
 * 편집기 보통 화면에 그대로 붙이면 편집기가 코드를 글자로 받아 `<p>&lt;table …&gt;</p>` 로 저장했다.
 * 그 서명으로 보낸 메일은 받는 쪽에 코드가 그대로 보였다(아트릭트 2026-11-01).
 *
 * 편집기 내용이 "글자로 된 HTML 코드" 뿐이면 그 코드를 진짜 HTML 로 돌려준다. 아니면 null.
 */
const TAG_RE = /<\/?(?:table|tbody|thead|tr|td|th|div|p|span|img|a|br|b|strong|font|style|center|ul|ol|li|h[1-6])\b[^>]*>/i;

export function pastedHtmlCode(html: string): string | null {
    if (!html || !html.includes("&lt;")) return null;
    if (typeof DOMParser === "undefined") return null;
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    // 줄(문단)마다 글자를 꺼내 줄바꿈으로 잇는다 — 붙여 넣은 코드의 한 줄이 문단 하나가 됐다.
    const blocks = Array.from(doc.body.children);
    const text = (blocks.length ? blocks.map((el) => el.textContent ?? "") : [doc.body.textContent ?? ""]).join("\n").replace(/ /g, " ").trim();
    // 코드로 시작하고 닫는 태그가 있어야 HTML 코드로 본다 — "<중요>" 같은 보통 글은 건드리지 않는다.
    if (!text.startsWith("<") || !text.includes("</") || !TAG_RE.test(text)) return null;
    return text;
}
