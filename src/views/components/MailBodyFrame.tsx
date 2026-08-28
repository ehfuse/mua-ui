/**
 * 메일 본문 뷰어 — 정제한 HTML 을 샌드박스 iframe(srcDoc)에 그린다(스크립트 불가, 링크는 새 창).
 */

import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import { sanitizeMailHtml, wrapMailDocument } from "../../utils/html";

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
            if (!doc) return;
            const height = Math.max(doc.documentElement?.scrollHeight ?? 0, doc.body?.scrollHeight ?? 0);
            if (height > 0) frame.style.height = `${height + 8}px`;
        };
        const onLoad = () => {
            fit();
            timers = [200, 800, 2000].map((ms) => setTimeout(fit, ms));
        };
        frame.addEventListener("load", onLoad);
        return () => {
            frame.removeEventListener("load", onLoad);
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
