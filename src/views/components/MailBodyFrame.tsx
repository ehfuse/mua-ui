/**
 * 메일 본문 뷰어 — 정제한 HTML 을 샌드박스 iframe(srcDoc)에 그린다(스크립트 불가, 링크는 새 창).
 */

import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import { sanitizeMailHtml, wrapMailDocument } from "../../utils/html";
import { useMuaConfig } from "../../MuaProvider";

interface MailBodyFrameProps {
    html: string; // 원문 HTML
    text: string; // 평문(HTML 없을 때)
    allowRemoteImages: boolean; // 외부 이미지 허용
}

/** 평문을 HTML 로 바꾼다. */
function textToHtml(text: string): string {
    return `<pre style="white-space:pre-wrap;font-family:inherit;margin:0;">${text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>`;
}

/** 본문 iframe 컴포넌트 — 내용 높이에 맞춰 자동으로 늘어난다. */
export function MailBodyFrame({ html, text, allowRemoteImages }: MailBodyFrameProps) {
    const frameRef = useRef<HTMLIFrameElement | null>(null);
    // 링크 열기 — 소비처 주입(앱 웹뷰=외부 브라우저) 우선, 없으면 부모 창의 새 탭.
    // iframe 의 <base target=_blank> 는 앱 웹뷰에서 새 창을 못 열어 링크가 먹통이었다(2026-08-31).
    const { openExternalUrl } = useMuaConfig();
    const openExternalRef = useRef(openExternalUrl);
    openExternalRef.current = openExternalUrl;
    const srcDoc = useMemo(
        () => wrapMailDocument(html ? sanitizeMailHtml(html, allowRemoteImages) : textToHtml(text)),
        [html, text, allowRemoteImages]
    );

    // 로드 후 문서 높이에 맞춰 iframe 높이를 맞춘다(이미지 로딩 등으로 늦게 커지는 경우까지 몇 번 재측정).
    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return;
        let timers: ReturnType<typeof setTimeout>[] = [];
        const fit = () => {
            const doc = frame.contentDocument;
            if (!doc?.body) return;
            // 가로 넘침 — 고정폭(테이블 width=600 등) 메일은 max-width 로도 최소 내용 폭 이하로 안 줄어
            // 가로 스크롤이 생긴다. 축소(zoom)는 글자까지 작아져 못 쓴다 — 넘칠 때만 mua-fit 클래스를 붙여
            // 고정 width 를 무력화(html.ts 의 body.mua-fit 규칙)하고 글자 크기 그대로 화면 폭에 맞춰 개행시킨다.
            const frameWidth = frame.clientWidth;
            const contentWidth = Math.max(doc.documentElement?.scrollWidth ?? 0, doc.body?.scrollWidth ?? 0);
            if (frameWidth > 0 && contentWidth > frameWidth + 1 && !doc.body.classList.contains("mua-fit")) {
                doc.body.classList.add("mua-fit");
            }
            const height = Math.max(doc.documentElement?.scrollHeight ?? 0, doc.body?.scrollHeight ?? 0);
            if (height > 0) frame.style.height = `${height + 8}px`;
        };
        /** 본문 링크 클릭 — http(s) 링크는 기본 동작(새 창)을 막고 부모에서 연다. mailto 등은 그대로 둔다. */
        const onDocClick = (event: Event) => {
            const target = event.target as Element | null;
            const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
            if (!anchor) return;
            const href = anchor.href;
            if (!/^https?:\/\//i.test(href)) return;
            event.preventDefault();
            const open = openExternalRef.current;
            if (open) open(href);
            else window.open(href, "_blank", "noopener,noreferrer");
        };
        let listenedDoc: Document | null = null;
        const onLoad = () => {
            fit();
            timers = [200, 800, 2000].map((ms) => setTimeout(fit, ms));
            const doc = frame.contentDocument;
            if (doc) {
                doc.addEventListener("click", onDocClick);
                listenedDoc = doc;
            }
        };
        frame.addEventListener("load", onLoad);
        return () => {
            frame.removeEventListener("load", onLoad);
            listenedDoc?.removeEventListener("click", onDocClick);
            timers.forEach(clearTimeout);
        };
    }, [srcDoc]);

    return (
        <Box sx={{ width: "100%", bgcolor: "#fff" }}>
            <iframe
                ref={frameRef}
                title="메일 본문"
                srcDoc={srcDoc}
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                referrerPolicy="no-referrer"
                style={{ width: "100%", border: 0, minHeight: 120, display: "block" }}
            />
        </Box>
    );
}
