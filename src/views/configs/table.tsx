/**
 * 메일 목록 컬럼 설정 — 중요 · 상대 · 제목/미리보기 · 첨부 · 일시.
 */

import type { DataColumn } from "@ehfuse/mui-virtual-data-table";
import { Box, Checkbox, IconButton, Typography } from "@mui/material";
import { StarRoundedIcon } from "../../internal/icons";
import { HighlightText } from "../../internal/HighlightText";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import type { MailMessageListItem } from "../../models/types";
import { formatCounterpart, formatMailListDate } from "../../utils/format";

/** 복수 선택 상태(체크박스 컬럼) */
export interface MailListSelection {
    checked: Set<number>; // 선택된 seq
    allChecked: boolean; // 현재 목록 전부 선택
    someChecked: boolean; // 일부 선택
    onToggle: (seq: number) => void; // 행 토글
    onToggleAll: () => void; // 전체 토글
}

/** 목록 컬럼을 만든다. */
export function getMailColumns(
    onToggleStar: (row: MailMessageListItem) => void,
    selection: MailListSelection,
    search = "",
    showSnippet = true
): DataColumn<MailMessageListItem>[] {
    return [
        {
            id: "_check",
            text: (
                <Checkbox
                    size="small"
                    checked={selection.allChecked}
                    indeterminate={!selection.allChecked && selection.someChecked}
                    onChange={selection.onToggleAll}
                    onClick={(event) => event.stopPropagation()}
                    sx={{ p: 0.5 }}
                    inputProps={{ "aria-label": "전체 선택" }}
                />
            ),
            width: 40,
            align: "center",
            style: { textAlign: "center" },
            render: (row) => (
                <Checkbox
                    size="small"
                    checked={selection.checked.has(row.seq)}
                    onChange={() => selection.onToggle(row.seq)}
                    onClick={(event) => event.stopPropagation()}
                    sx={{ p: 0.5 }}
                    inputProps={{ "aria-label": "선택" }}
                />
            ),
        },
        {
            id: "is_starred",
            text: "",
            width: 44,
            align: "center",
            style: { textAlign: "center" },
            render: (row) => (
                <IconButton
                    size="small"
                    aria-label={row.is_starred ? "중요 해제" : "중요 표시"}
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleStar(row);
                    }}
                    sx={{ p: 0.5 }}
                >
                    <StarRoundedIcon
                        sx={{
                            fontSize: 20,
                            ...(row.is_starred ? { color: "#f59e0b", fill: "currentColor" } : { color: "#94a3b8" }),
                        }}
                    />
                </IconButton>
            ),
        },
        {
            id: "from_name",
            text: "보낸 사람",
            // 분할형 상세가 열려 목록이 좁아지면 보낸 사람 컬럼도 줄인다
            width: showSnippet ? 200 : 140,
            render: (row) => (
                <Typography
                    noWrap
                    sx={{ fontWeight: row.is_read ? 400 : 700, fontSize: "14px" }}
                    title={row.from_address ?? undefined}
                >
                    <HighlightText text={formatCounterpart(row)} query={search} />
                </Typography>
            ),
        },
        {
            id: "subject",
            text: "제목",
            render: (row) => (
                <Box sx={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography
                        noWrap
                        sx={{
                            fontWeight: row.is_read ? 400 : 700,
                            fontSize: "14px",
                            // 미리보기를 같이 그릴 때만 제목 폭을 제한한다(분할형 상세가 열리면 제목이 폭을 다 쓴다)
                            ...(showSnippet ? { flexShrink: 0, maxWidth: "60%" } : { minWidth: 0 }),
                        }}
                    >
                        <HighlightText text={row.subject || "(제목 없음)"} query={search} />
                    </Typography>
                    {showSnippet ? (
                        <Typography noWrap sx={{ color: "#64748b", fontSize: "13.5px", minWidth: 0 }}>
                            {row.snippet ? `— ${row.snippet}` : ""}
                        </Typography>
                    ) : null}
                </Box>
            ),
        },
        {
            id: "has_attachment",
            text: "",
            width: 36,
            align: "center",
            style: { textAlign: "center" },
            render: (row) =>
                row.has_attachment ? <AttachFileIcon fontSize="small" sx={{ color: "#64748b" }} /> : null,
        },
        {
            id: "date_time",
            text: "일시",
            width: 110,
            align: "right",
            style: { textAlign: "right" },
            render: (row) => (
                <Typography noWrap sx={{ fontWeight: row.is_read ? 400 : 700, fontSize: "13.5px", color: "#111" }}>
                    {formatMailListDate(row.date_time)}
                </Typography>
            ),
        },
    ];
}
