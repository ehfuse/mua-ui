/**
 * 하단 탭(페이지 모드) 메일 목록 — 자기 스크롤을 가진 VDT 가상 목록(0.3.168, 2026-10-19 업무함 사용자 지정 "모바일 메일 목록도 아트릭트 홈처럼").
 *
 * 받은 메일을 모두 그리던 카드 목록(MailMobileList)은 메일이 수천 통이면 무거웠다 — 보이는 줄만 그린다.
 * 목록 칸은 화면 맨 위(셸 앱바 밑)부터 끝까지 크기 · 자리가 그대로이고, 앱바(셸)와 덮개(탭 · 계정 줄)를 위에 겹쳐 띄운다.
 * 목록 첫머리는 [앱바 + 덮개] 높이만큼 비우고, 목록을 민 만큼(0 ~ 그 높이) 둘을 함께 올린다 — 올리면 그만큼 내려온다.
 * 칸 크기가 바뀌지 않아 짧은 목록에서도 떨리지 않는다. 접힌 양은 문서 루트의 --appbar-hidden 에 적는다(셸 앱바가 읽는다).
 *
 * 0.3.174(2026-10-19 사용자 지정 "앱바만 접히고 탭은 고정되고 전체 선택부터 목록은 스크롤되면 좋겠다"):
 *  · 덮개(head)에는 탭만 둔다 — 접히는 양은 앱바 높이까지라 앱바가 다 접히면 탭은 화면 맨 위에 붙어 선다.
 *  · 계정 줄(전체 선택 · 툴바, listHead)은 가상 목록의 첫 줄로 그려 메일과 함께 브라우저가 직접 굴린다(머리 접기 늦음이 없다).
 *  · 메일을 고른 동안(pinListHead) 그 줄이 탭 밑으로 지나가면 같은 줄을 탭 아래에 붙여 보인다 — 일괄 작업 단추가 사라지지 않게.
 *
 * 끝에 닿으면 다음 쪽을 읽는다 — 읽는 중에 끝 알림이 오면 기억했다가 읽기가 끝나면 바로 읽는다(가상 목록은 같은 길이에서 끝 알림을 한 번만 준다).
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Box, GlobalStyles } from "@mui/material";
import { VirtualDataTable, type DataColumn } from "@ehfuse/mui-virtual-data-table";
import { mfs } from "../../internal/mobileFontScale";
import { MOBILE_EDGE_GAP, MobileListLoadingMoreSpinner, MobileListLoadingSpinner } from "../../internal/mobileParts";
import type { MailLabel, MailMessageListItem } from "../../models/types";
import type { MuaMobileOwnScroll } from "../../types/config";
import { MailMobileRow } from "./MailMobileList";

/** CSS 스크롤 연동 애니메이션(+ 타임라인 이름 열기)을 쓸 수 있나 — 안드로이드 크롬 · WebView 116+ */
const OWN_SCROLL_CSS_OK =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("animation-timeline: scroll()") &&
    CSS.supports("timeline-scope: --a");
/**
 * 스크롤 연동 머리 접기 규칙 — data-own-scroll-move 요소(덮개 · 셸 앱바)가 목록 스크롤 0 ~ --own-dist 구간에서 그만큼 올라간다.
 * 애니메이션은 인라인 transform(예전 방식의 --appbar-hidden)보다 앞서므로 셸은 속성 두 개만 달면 된다.
 */
const OWN_SCROLL_STYLES = `
@keyframes mua-own-scroll-move { from { transform: translateY(0); } to { transform: translateY(calc(-1 * var(--own-dist, 0px))); } }
:root[data-own-scroll] { timeline-scope: --mua-own-scroll; }
.mua-mail-own-scroll [data-virtuoso-scroller] { scroll-timeline: --mua-own-scroll y; }
:root[data-own-scroll] [data-own-scroll-move] {
    animation: mua-own-scroll-move linear both;
    animation-timeline: --mua-own-scroll;
    animation-range: var(--own-start, 0px) calc(var(--own-start, 0px) + var(--own-dist, 0px));
}
`;

/** 접힌 양 CSS 변수 — 셸 앱바가 읽는다 */
const HIDDEN_VAR = "--appbar-hidden";
/** 목록 첫머리 빈 높이 CSS 변수 — 가상 목록의 첫머리 여백 · 당겨서 새로고침 표시 위치가 쓴다 */
const TOP_VAR = "--mua-mail-list-top";
/** 화면 끝까지 쓰는 띠의 본문 좌우 여백(px) — 예전 페이지 여백(16)과 같은 값(카드 안쪽 들임이 그대로) */
const BLEED = 16;
/** 끝 줄(더 읽는 중) 표식 — 메일 seq 와 겹치지 않는 값 */
const MORE_SEQ = -1;
/** 첫 줄(계정 줄 · 전체 선택) 표식 */
const HEAD_SEQ = -2;
/** 표 줄 — 메일이거나 첫 줄 · 끝 줄 */
type Row = MailMessageListItem | { seq: typeof MORE_SEQ | typeof HEAD_SEQ };
/** 표 열 — 카드 한 칸으로 그리므로 하나면 된다(VDT 는 열이 있어야 한다) */
const COLUMNS: DataColumn<Row>[] = [{ id: "subject", text: "메일" }];

interface MailMobileOwnScrollProps {
    config: MuaMobileOwnScroll; // 앱 셸 설정
    head: ReactNode; // 덮개 — 탭 · 검색칸(앱바와 함께 앱바 높이만큼 접히고 그 뒤로는 맨 위에 선다)
    listHead?: ReactNode; // 목록 첫 줄 — 계정 줄 · 전체 선택(메일과 함께 굴러간다, 0.3.174)
    pinListHead?: boolean; // 첫 줄이 지나간 뒤에도 탭 아래에 붙여 보인다(메일을 고른 동안 — 일괄 작업 단추)
    rows: MailMessageListItem[]; // 목록(누적 쪽)
    loading: boolean; // 목록 읽는 중
    loadingMore: boolean; // 다음 쪽 읽는 중
    hasMore: boolean; // 더 읽을 쪽이 있다
    onLoadMore: () => void; // 다음 쪽 읽기
    emptyMessage: string; // 비었을 때 문구
    onSelect: (row: MailMessageListItem) => void; // 카드 탭 — 상세 열기
    onToggleStar: (row: MailMessageListItem) => void; // 별 탭
    checkedSeqs: Set<number>; // 복수 선택된 seq
    onToggleCheck: (seq: number) => void; // 체크박스 토글
    onRowContextMenu?: (row: MailMessageListItem, event: MouseEvent) => void; // 길게 누르기 메뉴
    labels: MailLabel[]; // 색상 라벨
}

/** 자기 스크롤 메일 목록 */
export function MailMobileOwnScroll({
    config,
    head,
    listHead,
    pinListHead = false,
    rows,
    loading,
    loadingMore,
    hasMore,
    onLoadMore,
    emptyMessage,
    onSelect,
    onToggleStar,
    checkedSeqs,
    onToggleCheck,
    onRowContextMenu,
    labels,
}: MailMobileOwnScrollProps) {
    // 셸에 알린다 — 앱바를 겹쳐 띄우고 본문 여백 · 당김 · 맨 위로 · 자기 접기를 끈다
    config.useOwnScroll();
    const headRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const [headH, setHeadH] = useState(0);
    useLayoutEffect(() => {
        const el = headRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setHeadH(Math.round(el.getBoundingClientRect().height)));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const top = config.appBarHeight + headH; // 목록 첫머리 빈 높이(앱바 + 탭)
    // 접히는 최대 양 = 앱바 높이(0.3.174 — 탭은 접히지 않고 맨 위에 선다)
    const collapse = config.appBarHeight;
    const topRef = useRef(collapse);
    topRef.current = collapse;
    // 첫 줄(계정 줄)이 탭 밑으로 지나갔나 — 고른 메일이 있으면 탭 아래에 붙여 보인다
    const [passed, setPassed] = useState(false);
    const passedRef = useRef(false);

    /*
     * 머리 접기(0.3.170, 2026-10-19 사용자 지적 "스크롤을 내리면 머리가 바로 안 접히고 살짝 차이 · 천천히 내리면 계단식").
     * 스크롤은 화면 합성 쪽(별도 스레드)이 바로 움직이고 스크롤 이벤트는 다음 프레임에 JS 로 온다 — JS 로 옮기면 한 박자 늦고 띄엄띄엄 움직였다.
     * 그래서 지원하는 브라우저는 **CSS 스크롤 연동 애니메이션**으로 머리 위치를 스크롤에 묶는다(ownScrollCss — 아래 GlobalStyles):
     *  · 목록 스크롤러에 타임라인(--mua-own-scroll)을 붙이고 문서 루트에서 이름을 연다(timeline-scope).
     *  · data-own-scroll-move 가 달린 요소(덮개 · 셸 앱바)는 스크롤 0 ~ 제 거리(--own-dist) 구간에서 합성 쪽이 직접 밀어 올린다.
     *  · 목록 중간에서 방향을 바꾸면 기준점(--own-start)만 옮겨 거기서부터 다시 1:1 로 움직인다(0.3.171 — 아래 effect).
     * 지원하지 않는 브라우저는 예전 방식(JS 로 --appbar-hidden 을 적는다 — 셸 앱바 · 덮개가 그 값을 따른다).
     */
    // 앱이 끌 수 있다(0.3.172 — 안드로이드 WebView 에서 스크롤 연동 애니메이션이 있으면 관성 스크롤이 진행되지 않고 손을 뗀 뒤 한 번에 건너뛰었다)
    const cssLinked = OWN_SCROLL_CSS_OK && config.cssLinked !== false;
    useEffect(() => {
        if (!cssLinked) return;
        const root = document.documentElement;
        root.setAttribute("data-own-scroll", "");
        return () => {
            root.removeAttribute("data-own-scroll");
            root.removeAttribute("data-own-scroll-peek");
        };
    }, [cssLinked]);
    useEffect(() => {
        const box = listRef.current;
        if (!box) return;
        const root = document.documentElement;
        const tops = new WeakMap<EventTarget, number>();
        /*
         * 스크롤 연동의 기준점(--own-start, 0.3.171) — 머리 위치 = clamp(스크롤 − 기준점, 0, 거리). 방향이 바뀌는 순간에만 기준점을 옮겨
         * "지금 위치에서 머리가 지금 모습 그대로" 이게 한다 — 그 뒤로는 올린 만큼 내려오고 내린 만큼 올라간다(1:1, 합성 쪽이 움직인다).
         * 예전(0.3.170)에는 목록 중간에서 0.2초 미끄러져 보이고 숨어 스크롤 속도와 달랐다(2026-10-19 사용자 지적).
         * 기준점은 늘 0 이상 · 늘어나기만 해서(맨 위로 돌아오면 0) 맨 위에서는 머리가 다 보인다.
         */
        let start = 0;
        let dir = 0;
        const setStart = (v: number) => {
            if (v === start) return;
            start = v;
            root.style.setProperty("--own-start", `${start}px`);
        };
        // 예전 방식(JS) — 민 만큼 접고 올린 만큼 편다. 적는 값은 기기 픽셀에 맞춘다(소수 배율 폰에서 1px 떨림, 0.3.169)
        let hidden = 0;
        let written = 0;
        /*
         * 접힌 양은 머리 요소(data-own-scroll-move — 덮개 · 셸 앱바)의 transform 에 바로 쓴다(0.3.173).
         * 문서 루트 변수(--appbar-hidden)에 매번 쓰면 문서 전체 스타일을 다시 계산해 머리가 1~3프레임 늦고 몰아서 따라잡아 흔들렸다.
         * 루트 변수는 스크롤이 멈춘 뒤에만 맞춰 둔다 — 머리가 다시 그려져도(React) 같은 자리에 선다.
         */
        let moves: HTMLElement[] = [];
        let settle = 0;
        /** 머리 요소들에 접힌 양을 쓴다(요소마다 제 거리 --own-dist 까지) */
        const paint = (v: number) => {
            if (!moves.length || moves.some((el) => !el.isConnected)) moves = [...document.querySelectorAll<HTMLElement>("[data-own-scroll-move]")];
            for (const el of moves) {
                const dist = parseFloat(el.style.getPropertyValue("--own-dist")) || 0;
                el.style.transform = `translate3d(0, ${-Math.min(v, dist || v)}px, 0)`;
            }
            window.clearTimeout(settle);
            settle = window.setTimeout(() => root.style.setProperty(HIDDEN_VAR, `${v}px`), 150);
        };
        const onScroll = (e: Event) => {
            const t = e.target as HTMLElement | null;
            if (!t || typeof t.scrollTop !== "number") return;
            const y = t.scrollTop;
            const delta = y - (tops.get(t) ?? 0);
            tops.set(t, y);
            const past = y > topRef.current + 4;
            if (past !== passedRef.current) {
                passedRef.current = past;
                setPassed(past);
            }
            if (cssLinked) {
                if (y <= 0) {
                    dir = 0;
                    setStart(0);
                    return;
                }
                const d = delta > 0.5 ? 1 : delta < -0.5 ? -1 : 0;
                if (d && d !== dir) {
                    // 방향이 바뀐 순간 — 지금 머리 모습(v)을 그대로 두는 기준점으로
                    const v = Math.min(topRef.current, Math.max(0, y - start));
                    dir = d;
                    setStart(Math.max(0, y - v));
                }
                return;
            }
            const next = y <= 0 ? 0 : Math.min(topRef.current, Math.max(0, hidden + delta));
            if (next === hidden) return;
            hidden = next;
            const dpr = window.devicePixelRatio || 1;
            const shown = Math.round(hidden * dpr) / dpr;
            if (shown === written) return;
            written = shown;
            paint(shown);
        };
        box.addEventListener("scroll", onScroll, { passive: true, capture: true });
        return () => {
            box.removeEventListener("scroll", onScroll, { capture: true });
            window.clearTimeout(settle);
            // 직접 쓴 transform 을 걷어 React 가 준 값(루트 변수를 따르는 식)으로 돌린다 — 셸 앱바는 이 화면을 떠나도 남는다
            for (const el of moves) if (el.isConnected) el.style.transform = "";
            root.style.removeProperty("--own-start");
            root.style.removeProperty(HIDDEN_VAR);
        };
    }, [cssLinked]);

    // 끝 줄을 붙인 표 데이터
    const data = useMemo<Row[]>(
        () => [...(listHead ? [{ seq: HEAD_SEQ } as Row] : []), ...rows, ...(hasMore ? [{ seq: MORE_SEQ } as Row] : [])],
        [rows, hasMore, listHead]
    );
    // 읽는 중에 끝에 닿았다 — 기억했다가 읽기가 끝나면 바로 다음 쪽
    const pending = useRef(false);
    useEffect(() => {
        if (loadingMore || !pending.current) return;
        pending.current = false;
        if (hasMore) onLoadMore();
    }, [loadingMore, hasMore, onLoadMore]);

    /** 줄 하나 — 띠(흰 바탕 + 아래 간격) 안의 메일 카드, 또는 끝 줄 */
    const renderRow = (r: Row) =>
        r.seq === HEAD_SEQ ? (
            // 계정 줄 — 덮개와 같은 좌우 여백(띠는 음수 여백으로 끝까지 나간다)
            <Box sx={{ px: `${BLEED}px` }}>{listHead}</Box>
        ) : r.seq === MORE_SEQ ? (
            loadingMore ? (
                <MobileListLoadingMoreSpinner />
            ) : (
                <Box sx={{ height: 24 }} />
            )
        ) : (
            <Box sx={{ bgcolor: "#fff", mb: MOBILE_EDGE_GAP }}>
                <MailMobileRow
                    row={r as MailMessageListItem}
                    labels={labels}
                    checked={checkedSeqs.has(r.seq)}
                    onSelect={onSelect}
                    onToggleStar={onToggleStar}
                    onToggleCheck={onToggleCheck}
                    onRowContextMenu={onRowContextMenu}
                    bleed={BLEED}
                />
            </Box>
        );

    return (
        <Box
            className="mua-mail-own-scroll"
            style={{ [TOP_VAR as string]: `${top}px` }}
            sx={{
                height: `var(${config.heightVar ?? "--shell-own-height"}, 100%)`,
                position: "relative",
                overflow: "hidden",
                bgcolor: config.background,
                // 당겨서 새로고침 표시를 덮개 아래로 — 위 끝(top 0)에 그리면 겹친 앱바 · 덮개에 가린다
                "& .overlay-scrollbar-pull-indicator": { marginTop: `var(${TOP_VAR}, 0px)` },
            }}
        >
            {cssLinked && <GlobalStyles styles={OWN_SCROLL_STYLES} />}
            {/* 덮개 — 앱바 밑에 겹쳐 띄우고 목록을 민 만큼 함께 올라간다. 좌우 여백은 예전 페이지 여백(띠는 음수 여백으로 끝까지 나간다) */}
            <Box
                ref={headRef}
                data-own-scroll-move=""
                style={{ ["--own-dist" as string]: `${collapse}px` }}
                sx={{
                    position: "absolute",
                    top: config.appBarHeight,
                    left: 0,
                    right: 0,
                    zIndex: 2,
                    px: `${BLEED}px`,
                    pt: 2,
                    bgcolor: config.background,
                    transform: `translateY(calc(-1 * var(${HIDDEN_VAR}, 0px)))`,
                    // 움직이는 동안 글자를 다시 그리지 않게 GPU 층에 둔다(1px 떨림 — 위 주석)
                    willChange: "transform",
                }}
            >
                {head}
                {/* 고른 메일이 있는데 첫 줄이 지나갔으면 탭 아래에 붙인다 — 덮개 높이(목록 첫머리 여백)는 바꾸지 않게 겹쳐 띄운다 */}
                {pinListHead && passed && listHead && (
                    <Box sx={{ position: "absolute", top: "100%", left: 0, right: 0, px: `${BLEED}px`, bgcolor: config.background }}>{listHead}</Box>
                )}
            </Box>
            {/* 목록 칸 — 화면 맨 위부터 끝까지(크기 · 자리 고정) */}
            <Box ref={listRef} sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
                {rows.length === 0 ? (
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pt: `${top}px` }}>
                        {listHead && <Box sx={{ px: `${BLEED}px` }}>{listHead}</Box>}
                        {loading ? (
                            <MobileListLoadingSpinner />
                        ) : (
                            <Box sx={{ py: 6, px: 2, textAlign: "center", color: "#94a3b8", fontSize: mfs(15) }}>
                                {emptyMessage}
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <VirtualDataTable<Row>
                            data={data}
                            totalCount={data.length}
                            columns={COLUMNS}
                            getRowId={(r) => r.seq}
                            // 줄 최소 높이(작게) — 카드는 내용만큼 선다
                            rowHeight={40}
                            rowDivider={false}
                            showPaper={false}
                            framed={false}
                            // 화면 폭과 상관없이 늘 카드 목록
                            mobile={{ query: "all", renderRow }}
                            // 첫머리 여백 — VDT 는 처음 값만 쓰므로 CSS 변수로(덮개 높이가 바뀌어도 다시 그리지 않고 따라 늘어난다)
                            paddingTop={`var(${TOP_VAR}, 0px)`}
                            scrollbars={config.scrollbars}
                            onEndReached={() => {
                                if (!hasMore) return;
                                if (loadingMore) pending.current = true;
                                else onLoadMore();
                            }}
                            emptyMessage=""
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
