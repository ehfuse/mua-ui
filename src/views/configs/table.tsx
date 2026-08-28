/**
 * 메일 목록 컬럼 설정 — 중요 · 상대 · 제목/미리보기 · 첨부 · 일시.
 */

import type { DataColumn } from "@ehfuse/mui-virtual-data-table";
import { Box, IconButton, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import type { MailMessageListItem } from "../../models/types";
import { formatCounterpart, formatMailListDate } from "../../utils/format";

/** 목록 컬럼을 만든다. */
export function getMailColumns(onToggleStar: (row: MailMessageListItem) => void): DataColumn<MailMessageListItem>[] {
    return [
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
                    {row.is_starred ? (
                        <StarIcon sx={{ color: "#f59e0b" }} fontSize="small" />
                    ) : (
                        <StarBorderIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                    )}
                </IconButton>
            ),
        },
        {
            id: "from_name",
            text: "보낸 사람",
            width: "22%",
            render: (row) => (
                <Typography
                    noWrap
                    sx={{ fontWeight: row.is_read ? 400 : 700, fontSize: "14px" }}
                    title={row.from_address ?? undefined}
                >
                    {formatCounterpart(row)}
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
                        sx={{ fontWeight: row.is_read ? 400 : 700, fontSize: "14px", flexShrink: 0, maxWidth: "60%" }}
                    >
                        {row.subject || "(제목 없음)"}
                    </Typography>
                    <Typography noWrap sx={{ color: "#64748b", fontSize: "13.5px", minWidth: 0 }}>
                        {row.snippet ? `— ${row.snippet}` : ""}
                    </Typography>
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
