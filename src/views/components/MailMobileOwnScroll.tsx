/**
 * 하단 탭(페이지 모드) 메일 목록 — 자기 스크롤을 가진 VDT 가상 목록(0.3.168, 2026-10-19 업무함 사용자 지정 "모바일 메일 목록도 아트릭트 홈처럼").
 *
 * 받은 메일을 모두 그리던 카드 목록(MailMobileList)은 메일이 수천 통이면 무거웠다 — 보이는 줄만 그린다.
 * 목록 칸은 화면 맨 위(셸 앱바 밑)부터 끝까지 크기 · 자리가 그대로이고, 앱바(셸)와 덮개(탭 · 계정 줄)를 위에 겹쳐 띄운다.
 * 목록 첫머리는 [앱바 + 덮개] 높이만큼 비우고, 목록을 민 만큼(0 ~ 그 높이) 둘을 함께 올린다 — 올리면 그만큼 내려온다.
 * 칸 크기가 바뀌지 않아 짧은 목록에서도 떨리지 않는다. 접힌 양은 문서 루트의 --appbar-hidden 에 적는다(셸 앱바가 읽는다).
 *
 * 끝에 닿으면 다음 쪽을 읽는다 — 읽는 중에 끝 알림이 오면 기억했다가 읽기가 끝나면 바로 읽는다(가상 목록은 같은 길이에서 끝 알림을 한 번만 준다).
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Box } from "@mui/material";
import { VirtualDataTable, type DataColumn } from "@ehfuse/mui-virtual-data-table";
import { mfs } from "../../internal/mobileFontScale";
import { MOBILE_EDGE_GAP, MobileListLoadingMoreSpinner, MobileListLoadingSpinner } from "../../internal/mobileParts";
import type { MailLabel, MailMessageListItem } from "../../models/types";
import type { MuaMobileOwnScroll } from "../../types/config";
import { MailMobileRow } from "./MailMobileList";

/** 접힌 양 CSS 변수 — 셸 앱바가 읽는다 */
const HIDDEN_VAR = "--appbar-hidden";
/** 목록 첫머리 빈 높이 CSS 변수 — 가상 목록의 첫머리 여백 · 당겨서 새로고침 표시 위치가 쓴다 */
const TOP_VAR = "--mua-mail-list-top";
/** 화면 끝까지 쓰는 띠의 본문 좌우 여백(px) — 예전 페이지 여백(16)과 같은 값(카드 안쪽 들임이 그대로) */
const BLEED = 16;
/** 끝 줄(더 읽는 중) 표식 — 메일 seq 와 겹치지 않는 값 */
const MORE_SEQ = -1;
/** 표 줄 — 메일이거나 끝 줄 */
type Row = MailMessageListItem | { seq: typeof MORE_SEQ };
/** 표 열 — 카드 한 칸으로 그리므로 하나면 된다(VDT 는 열이 있어야 한다) */
const COLUMNS: DataColumn<Row>[] = [{ id: "subject", text: "메일" }];

interface MailMobileOwnScrollProps {
    config: MuaMobileOwnScroll; // 앱 셸 설정
    head: ReactNode; // 덮개 — 탭 · 검색칸 · 계정 줄
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
    const top = config.appBarHeight + headH; // 목록 첫머리 빈 높이 = 접히는 최대 양
    const topRef = useRef(top);
    topRef.current = top;

    // 스크롤과 1:1 머리 접기 — 민 만큼 접고 올린 만큼 편다(맨 위면 다 편다). 높이는 ref 로 읽어 다시 걸지 않는다
    useEffect(() => {
        const box = listRef.current;
        if (!box) return;
        const root = document.documentElement;
        let hidden = 0;
        let written = 0; // 마지막으로 적은 값(기기 픽셀에 맞춘 것)
        const tops = new WeakMap<EventTarget, number>();
        const onScroll = (e: Event) => {
            const t = e.target as HTMLElement | null;
            if (!t || typeof t.scrollTop !== "number") return;
            const y = t.scrollTop;
            const delta = y - (tops.get(t) ?? 0);
            tops.set(t, y);
            // 계산은 소수 그대로 쌓고, 적는 값만 기기 픽셀에 맞춘다 — 소수 배율(2.6 등) 폰에서 천천히 밀면 스크롤 위치가 12.38px 처럼 와서
            // 덮개를 그대로 옮기면 글자가 프레임마다 픽셀 경계에 붙었다 떨어지며 1px 씩 떨렸다(0.3.169, 2026-10-19 사용자 지적)
            const next = y <= 0 ? 0 : Math.min(topRef.current, Math.max(0, hidden + delta));
            if (next === hidden) return;
            hidden = next;
            const dpr = window.devicePixelRatio || 1;
            const shown = Math.round(hidden * dpr) / dpr;
            if (shown === written) return;
            written = shown;
            root.style.setProperty(HIDDEN_VAR, `${shown}px`);
        };
        box.addEventListener("scroll", onScroll, { passive: true, capture: true });
        return () => {
            box.removeEventListener("scroll", onScroll, { capture: true });
            root.style.removeProperty(HIDDEN_VAR);
        };
    }, []);

    // 끝 줄을 붙인 표 데이터
    const data = useMemo<Row[]>(() => (hasMore ? [...rows, { seq: MORE_SEQ }] : rows), [rows, hasMore]);
    // 읽는 중에 끝에 닿았다 — 기억했다가 읽기가 끝나면 바로 다음 쪽
    const pending = useRef(false);
    useEffect(() => {
        if (loadingMore || !pending.current) return;
        pending.current = false;
        if (hasMore) onLoadMore();
    }, [loadingMore, hasMore, onLoadMore]);

    /** 줄 하나 — 띠(흰 바탕 + 아래 간격) 안의 메일 카드, 또는 끝 줄 */
    const renderRow = (r: Row) =>
        r.seq === MORE_SEQ ? (
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
            {/* 덮개 — 앱바 밑에 겹쳐 띄우고 목록을 민 만큼 함께 올라간다. 좌우 여백은 예전 페이지 여백(띠는 음수 여백으로 끝까지 나간다) */}
            <Box
                ref={headRef}
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
            </Box>
            {/* 목록 칸 — 화면 맨 위부터 끝까지(크기 · 자리 고정) */}
            <Box ref={listRef} sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
                {rows.length === 0 ? (
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pt: `${top}px` }}>
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
