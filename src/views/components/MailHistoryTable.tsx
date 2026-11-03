/**
 * 메일 상세의 메일 목록 표(2026-11-03 사용자 지시 "표 디자인을 업무함표 스타일") — "이 대화 N통" 과 "주고받은 메일" 이 같이 쓴다.
 * 업무함 목록표(VirtualDataTable 노션풍 — 연락처 · 메일 목록과 같은 모양)로 그린다: 구분(받음 · 보냄) · 상대 · 제목(미리보기) · 날짜.
 * 보고 있는 메일 줄을 칠하고, 다른 줄을 누르면 그 메일을 연다. 줄이 많으면 표 높이를 묶고 안에서 스크롤한다.
 */
import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { VirtualDataTable, type DataColumn } from "@ehfuse/mui-virtual-data-table";
import { t } from "../../i18n";
import type { MailThreadEntry } from "../../models/types";
import { formatMailListDate } from "../../utils/format";

/** 줄 높이 · 머리 높이 — 연락처 표(48)보다 한 단계 낮다: 상세 안의 보조 목록이라 본문을 덜 밀어낸다. */
const ROW_HEIGHT = 40;
const HEAD_HEIGHT = 40;
/** 이 줄 수까지는 표가 늘어나고, 넘으면 이 높이에서 안쪽 스크롤. */
const MAX_VISIBLE_ROWS = 8;

const isOutgoing = (row: MailThreadEntry) => row.folder === "sent" || row.folder === "draft";

export function MailHistoryTable({
    title,
    items,
    currentSeq,
    onSelect,
    note,
}: {
    title: string;
    items: MailThreadEntry[];
    currentSeq: number;
    onSelect?: (seq: number) => void;
    /** 표 아래 작은 안내(최근 N통만 보일 때 등) */
    note?: string;
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
    const many = items.length > MAX_VISIBLE_ROWS;
    return (
        <Box sx={{ mx: 2, mt: 1.5, mb: 1.5 }}>
            <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 600, color: "#475569" }}>{title}</Typography>
            <Box sx={many ? { height: HEAD_HEIGHT + ROW_HEIGHT * MAX_VISIBLE_ROWS + 2 } : undefined}>
                <VirtualDataTable<MailThreadEntry>
                    variant="notion"
                    columns={columns}
                    data={items}
                    totalCount={items.length}
                    getRowId={(row) => row.seq}
                    selectedRowId={currentSeq}
                    rowHeight={ROW_HEIGHT}
                    columnHeight={HEAD_HEIGHT}
                    autoHeight={!many}
                    showPaper={false}
                    onRowClick={(row) => row.seq !== currentSeq && onSelect?.(row.seq)}
                />
            </Box>
            {note ? <Typography sx={{ mt: 0.75, fontSize: 13, color: "#64748b" }}>{note}</Typography> : null}
        </Box>
    );
}
