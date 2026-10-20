/**
 * 메일 목록 컬럼 설정 — 중요 · 상대 · 제목/미리보기 · 첨부 · 일시.
 */

import { ThreadCount } from "../components/MailMobileList";
import type { DataColumn } from "@ehfuse/mui-virtual-data-table";
import { Box, Checkbox, IconButton, Typography } from "@mui/material";
import { StarRoundedIcon } from "../../internal/icons";
import { HighlightText } from "../../internal/HighlightText";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LabelIcon from "@mui/icons-material/Label";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import type { MailLabel, MailMessageListItem } from "../../models/types";
import { MailLabelChips } from "../components/MailLabels";
import { formatCounterpart, formatMailListDate, scheduledPrefix, sendStateColor, sendStateLabel } from "../../utils/format";

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
    showSnippet = true,
    labels: MailLabel[] = [], // 색상 라벨(config.labels) — 비어 있으면 칩을 그리지 않는다
    // 행의 라벨 단추(0.3.159) — 주면 별표 옆에 라벨 아이콘을 두고 누르면 그 메일의 라벨 메뉴를 연다(지메일처럼 한 통에 바로 단다).
    onLabelClick?: (row: MailMessageListItem, anchorEl: HTMLElement) => void
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
            width: onLabelClick ? 76 : 44,
            align: "center",
            style: { textAlign: "center" },
            render: (row) => (
                <Box sx={{ display: "inline-flex", alignItems: "center" }}>
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
                {onLabelClick ? (
                    <IconButton
                        size="small"
                        aria-label="라벨"
                        onClick={(event) => {
                            event.stopPropagation();
                            onLabelClick(row, event.currentTarget);
                        }}
                        sx={{ p: 0.5 }}
                    >
                        {/* 단 라벨이 있으면 첫 라벨 색으로 채운다 — 비어 있으면 별표와 같은 회색 테두리. */}
                        {(() => {
                            const first = labels.find((label) => row.label_seqs?.includes(label.seq));
                            return first ? (
                                <LabelIcon sx={{ fontSize: 20, color: first.color || "#64748b" }} />
                            ) : (
                                <LabelOutlinedIcon sx={{ fontSize: 20, color: "#94a3b8" }} />
                            );
                        })()}
                    </IconButton>
                ) : null}
                </Box>
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
                    <ThreadCount row={row} fontSize="14px" />
                </Typography>
            ),
        },
        {
            id: "subject",
            text: "제목",
            render: (row) => (
                <Box sx={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 1 }}>
                    {/* 색상 라벨 칩 — 지메일처럼 제목 앞. 칩이 많아도 제목 자리를 다 먹지 않게 칩마다 폭을 묶는다. */}
                    <MailLabelChips seqs={row.label_seqs} labels={labels} maxWidth={showSnippet ? 120 : 90} />
                    <Typography
                        noWrap
                        sx={{
                            fontWeight: row.is_read ? 400 : 700,
                            fontSize: "14px",
                            // 미리보기를 같이 그릴 때만 제목 폭을 제한한다(분할형 상세가 열리면 제목이 폭을 다 쓴다)
                            ...(showSnippet ? { flexShrink: 0, maxWidth: "60%" } : { minWidth: 0 }),
                        }}
                    >
                        {/* 번역본 보기 상태인 메일은 번역 제목을 보인다("원문 보기"로 되돌리면 원문 제목). */}
                        {scheduledPrefix(row.send_at)}
                        {/* 뒤에서 보내는 메일 — 보내는 중 · 발송 실패를 제목 앞에 세운다. */}
                        {sendStateLabel(row.send_state) ? (
                            <Box component="span" sx={{ color: sendStateColor(row.send_state), fontWeight: 700, mr: 0.75 }}>
                                {sendStateLabel(row.send_state)}
                            </Box>
                        ) : null}
                        <HighlightText text={row.translated_subject || row.subject || "(제목 없음)"} query={search} />
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
