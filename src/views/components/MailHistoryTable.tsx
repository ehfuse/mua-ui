/**
 * 메일 상세의 메일 목록 표(2026-11-03 사용자 지시 "표 디자인을 업무함표 스타일") — "이 대화 N통" 과 "주고받은 메일" 이 같이 쓴다.
 * 업무함 목록표(VirtualDataTable 노션풍 — 연락처 · 메일 목록과 같은 모양)로 그린다: 구분(받음 · 보냄) · 상대 · 제목(미리보기) · 날짜.
 * 보고 있는 메일 줄을 칠하고, 다른 줄을 누르면 그 메일을 연다. 표 안에서 따로 스크롤하지 않고 모든 줄을 그린다(2026-11-03 사용자 지시) — 상세 화면이 함께 스크롤한다.
 */
import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { VirtualDataTable, type DataColumn } from "@ehfuse/mui-virtual-data-table";
import { t } from "../../i18n";
import type { MailThreadEntry } from "../../models/types";
import { formatMailListDate } from "../../utils/format";
import { useIsMobile } from "../../internal/useIsMobile";

/** 줄 높이 · 머리 높이 — 연락처 표(48)보다 한 단계 낮다: 상세 안의 보조 목록이라 본문을 덜 밀어낸다. */
const ROW_HEIGHT = 40;
const HEAD_HEIGHT = 40;

const isOutgoing = (row: MailThreadEntry) => row.folder === "sent" || row.folder === "draft";

export function MailHistoryTable({
    title,
    items,
    currentSeq,
    onSelect,
    note,
    hideWho = false,
}: {
    /** 표 위 제목 — 없으면 그리지 않는다(같은 대화 표는 제목 없이, 2026-11-03 사용자 지시). */
    title?: string;
    items: MailThreadEntry[];
    currentSeq: number;
    onSelect?: (seq: number) => void;
    /** 표 아래 작은 안내(최근 N통만 보일 때 등) */
    note?: string;
    /** 보낸 사람 칸을 뺀다 — 한 상대와 주고받은 메일 표는 상대가 정해져 있다(2026-11-03 사용자 지시). 받음 · 보냄 구분은 남는다. */
    hideWho?: boolean;
}) {
    const cell = (text: string, secondary = false, strong = false) => (
        <Box
            component="span"
            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...(secondary ? { color: "text.secondary" } : {}), ...(strong ? { fontWeight: 600 } : {}) }}
        >
            {text}
        </Box>
    );
    const columns = useMemo<DataColumn<MailThreadEntry>[]>(
        () => [
            {
                id: "direction",
                text: t("historyDirection"),
                width: 64,
                align: "center",
                render: (row) => cell(isOutgoing(row) ? t("historySent") : t("historyReceived"), true),
            },
            {
                id: "who",
                text: t("historyWho"),
                width: 160,
                render: (row) =>
                    cell(isOutgoing(row) ? t("meTo", { to: row.to_summary || "" }) : row.from_name || row.from_address || t("noSender"), false, !row.is_read),
            },
            {
                id: "subject",
                text: t("subject"),
                render: (row) => (
                    <Box component="span" sx={{ display: "block", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Box component="span" sx={{ fontWeight: row.is_read ? 400 : 600 }}>
                            {row.subject || t("noSubject")}
                        </Box>
                        {row.snippet ? (
                            <Box component="span" sx={{ color: "text.secondary", ml: 1 }}>
                                {row.snippet}
                            </Box>
                        ) : null}
                    </Box>
                ),
            },
            {
                id: "date",
                text: t("date"),
                width: 104,
                align: "right",
                render: (row) => cell(formatMailListDate(row.date_time), true),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );
    const shownColumns = hideWho ? columns.filter((column) => column.id !== "who") : columns;
    const isMobile = useIsMobile();
    // 폰은 칸 표 대신 두 줄 목록(2026-11-03 사용자 지시) — 1행 제목, 2행 보조 글(받음 · 보냄 · 상대 · 일시). 4칸 표는 폰 폭에서 제목이 반도 안 보였다.
    const mobileList = (
        <Box sx={{ borderTop: "1px solid #e2e8f0" }}>
            {items.map((row) => {
                const current = row.seq === currentSeq;
                const who = isOutgoing(row) ? t("meTo", { to: row.to_summary || "" }) : row.from_name || row.from_address || t("noSender");
                return (
                    <Box
                        key={row.seq}
                        role="button"
                        tabIndex={0}
                        onClick={() => !current && onSelect?.(row.seq)}
                        sx={{
                            py: 1,
                            px: 1.5,
                            borderBottom: "1px solid #e2e8f0",
                            // 보고 있는 메일 — 표의 고른 줄과 같은 연파랑 바탕 + 왼쪽 파란 선.
                            bgcolor: current ? "#dbeafe" : "transparent",
                            boxShadow: current ? "inset 3px 0 0 #2563eb" : "none",
                            cursor: current ? "default" : "pointer",
                        }}
                    >
                        <Box sx={{ fontSize: 15, fontWeight: row.is_read ? 400 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.subject || t("noSubject")}
                        </Box>
                        <Box sx={{ mt: 0.25, fontSize: 13, color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {[isOutgoing(row) ? t("historySent") : t("historyReceived"), who, formatMailListDate(row.date_time)].filter(Boolean).join(" · ")}
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
    return (
        // 제 층(zIndex 0)에 가둔다 — 표 머리 줄은 스크롤하면 위에 붙는데, 메일 상세 머리(제목 · 보낸 사람, 위에 붙는 zIndex 1)보다 위로 올라와
        // 머리를 덮었다(2026-11-03 사용자 지적). 층을 가두면 표 머리는 메일 머리 뒤로 지나간다.
        <Box sx={{ mx: 2, mt: 1.5, mb: 1.5, position: "relative", zIndex: 0 }}>
            {title ? <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 600, color: "#475569" }}>{title}</Typography> : null}
            {isMobile ? mobileList : (
            <Box>
                <VirtualDataTable<MailThreadEntry>
                    variant="notion"
                    columns={shownColumns}
                    data={items}
                    totalCount={items.length}
                    getRowId={(row) => row.seq}
                    selectedRowId={currentSeq}
                    rowHeight={ROW_HEIGHT}
                    columnHeight={HEAD_HEIGHT}
                    autoHeight
                    showPaper={false}
                    // 표 틀을 제목 · 도구 줄과 같은 왼쪽 선에 세운다(기본 좌우 여백이 있으면 표만 안으로 들어가 보였다).
                    paddingX={0}
                    onRowClick={(row) => row.seq !== currentSeq && onSelect?.(row.seq)}
                />
            </Box>
            )}
            {note ? <Typography sx={{ mt: 0.75, fontSize: 13, color: "#64748b" }}>{note}</Typography> : null}
        </Box>
    );
}
