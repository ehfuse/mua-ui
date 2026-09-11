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

    // 로드 후 문서 높이에 맞춰 iframe 높이를 맞춘다.
    //
    // 몇 번 재기(200·800·2000ms)만으로는 부족했다(2026-09-11): 이미지가 많은 메일은 폰에서 2초 뒤에도 계속 커졌다.
    // 그래서 안쪽 문서를 ResizeObserver 로 따라가고 이미지 load 도 듣는다(srcDoc 은 같은 출처라 안쪽을 만질 수 있다).
    //
    // ⚠️ **바깥 iframe 도 함께 관찰해야 한다**(2026-09-11). 상세는 오른쪽에서 미끄러져 들어오는 창이라, 로드 시점에는
    // iframe 폭이 아직 0~좁은 값이다. 그 폭으로 잰 높이가 그대로 굳어 본문이 중간에서 잘렸다 —
    // 앱을 전환했다 돌아오면 멀쩡했던 이유가 이것이다(그때 리플로가 한 번 더 돌아 제 폭으로 다시 쟀다).
    // 안쪽 문서만 보면 바깥이 넓어져도 알 수 없다(내용은 그대로고 레이아웃만 바뀐다).
    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return;
        let timers: ReturnType<typeof setTimeout>[] = [];
        // fit() 이 mua-fit 을 붙였다 떼면 문서 크기가 바뀌어 ResizeObserver 가 다시 fit() 을 부른다.
        // 재진입을 막지 않으면 붙임/뗌이 번갈아 도는 무한 루프가 된다(폭이 경계값일 때).
        let fitting = false;
        const fit = () => {
            if (fitting) return;
            const doc = frame.contentDocument;
            if (!doc?.body) return;
            // 가로 넘침 — 고정폭(테이블 width=600 등) 메일은 max-width 로도 최소 내용 폭 이하로 안 줄어
            // 가로 스크롤이 생긴다. 축소(zoom)는 글자까지 작아져 못 쓴다 — 넘칠 때만 mua-fit 클래스를 붙여
            // 고정 width 를 무력화(html.ts 의 body.mua-fit 규칙)하고 글자 크기 그대로 화면 폭에 맞춰 개행시킨다.
            const frameWidth = frame.clientWidth;
            // 폭이 아직 0 이면(창이 미끄러져 들어오는 중) 재지 않는다 — 그 값으로 잰 높이가 굳으면 본문이 잘린다.
            if (frameWidth <= 0) return;

            // mua-fit 은 **폭이 바뀔 때마다 다시 판정한다**(2026-09-11). 한 번 붙이고 끝내면, 좁은 폭에서 붙은 채로
            // 창이 넓어져도 그대로 남아 좁은 레이아웃의 높이가 굳는다(앱 전환으로도 안 풀렸던 이유).
            // 판정은 클래스를 뗀 상태의 내용 폭으로 해야 한다 — 붙인 상태에서는 이미 접혀 있어 항상 "안 넘친다" 가 된다.
            fitting = true;
            try {
                const wasFit = doc.body.classList.contains("mua-fit");
                if (wasFit) doc.body.classList.remove("mua-fit");
                const naturalWidth = Math.max(doc.documentElement?.scrollWidth ?? 0, doc.body?.scrollWidth ?? 0);
                const shouldFit = naturalWidth > frameWidth + 1;
                doc.body.classList.toggle("mua-fit", shouldFit);

                // 클래스를 막 바꿨으면 레이아웃이 다시 잡힌 뒤의 높이를 재야 한다 — 강제 리플로를 한 번 일으킨다.
                if (shouldFit !== wasFit) void doc.body.offsetHeight;
                const height = Math.max(doc.documentElement?.scrollHeight ?? 0, doc.body?.scrollHeight ?? 0);
                if (height > 0) frame.style.height = `${height + 8}px`;
            } finally {
                fitting = false;
            }
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
        let observer: ResizeObserver | null = null;
        const imageListeners: Array<{ img: HTMLImageElement; handler: () => void }> = [];
        const onLoad = () => {
            fit();
            // 초기 몇 번은 그대로 둔다 — 관찰자가 붙기 전 폰트 적용·mua-fit 개행으로 바뀌는 높이를 잡는다.
            timers = [200, 800, 2000].map((ms) => setTimeout(fit, ms));
            const doc = frame.contentDocument;
            if (doc) {
                doc.addEventListener("click", onDocClick);
                listenedDoc = doc;
                // 문서가 커지거나 줄어들 때마다 — 이미지 지연 로드·mua-fit 개행 모두 여기서 잡힌다.
                // iframe 자신도 함께 본다 — 창이 미끄러져 들어오며 폭이 커지는 것은 여기서만 잡힌다.
                if (typeof ResizeObserver !== "undefined") {
                    observer = new ResizeObserver(() => fit());
                    if (doc.documentElement) observer.observe(doc.documentElement);
                    if (doc.body) observer.observe(doc.body);
                    observer.observe(frame);
                }
                // 이미지 load 도 직접 듣는다 — 크기 변화가 없는 경우(같은 크기 자리표시자)에도 한 번 더 재 준다.
                doc.querySelectorAll("img").forEach((img) => {
                    if (img.complete) return;
                    const handler = () => fit();
                    img.addEventListener("load", handler);
                    img.addEventListener("error", handler);
                    imageListeners.push({ img, handler });
                });
            }
        };
        frame.addEventListener("load", onLoad);
        // 앱을 내렸다 올리면(모바일 웹뷰) 그동안 레이아웃이 멈춰 있어 폭이 어긋난 채로 남을 수 있다.
        // 지금까지는 복귀 때 리플로가 우연히 한 번 돌아 고쳐졌을 뿐이라, 여기서 직접 다시 잰다.
        const onWake = () => {
            if (document.visibilityState === "hidden") return;
            fit();
            timers.push(setTimeout(fit, 100));
        };
        document.addEventListener("visibilitychange", onWake);
        window.addEventListener("pageshow", onWake);
        return () => {
            frame.removeEventListener("load", onLoad);
            document.removeEventListener("visibilitychange", onWake);
            window.removeEventListener("pageshow", onWake);
            listenedDoc?.removeEventListener("click", onDocClick);
            observer?.disconnect();
            imageListeners.forEach(({ img, handler }) => {
                img.removeEventListener("load", handler);
                img.removeEventListener("error", handler);
            });
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
