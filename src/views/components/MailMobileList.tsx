/**
 * 메일 목록 모바일 카드(서브페이지 다이얼로그 본문).
 *
 * 좁은 화면에서는 데스크탑 표(중요·상대·제목/미리보기·첨부·일시)가 접혀 못 읽는다 — 메일 1통을 카드 하나로 축약한다.
 *   1줄: 상대(보낸 사람 / 보낸·임시보관함은 받는 사람) + 오른쪽 일시 칩
 *   2줄: 제목(안 읽은 메일은 굵게) + 첨부 아이콘
 *   3줄: 미리보기(2줄 말줄임)
 * 왼쪽 별은 중요 토글(카드 클릭과 분리), 카드를 누르면 상세(MobileDetailDialog)가 슬라이드로 열린다.
 * 안 읽은 메일은 왼쪽 파란 세로띠로 구분한다.
 */

import { Box, Checkbox, IconButton, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { mfs } from "../../internal/mobileFontScale";
import { MobileCardStack, MobileChip, MobileListLoadingSpinner } from "../../internal/mobileParts";
import type { MailMessageListItem } from "../../models/types";
import { formatCounterpart, formatMailListDate } from "../../utils/format";

interface MailMobileListProps {
    rows: MailMessageListItem[]; // 목록(누적 페이지)
    loading: boolean; // 목록 로딩 여부
    emptyMessage: string; // 비었을 때 문구(오류/계정 없음/메일 없음)
    onSelect: (row: MailMessageListItem) => void; // 카드 탭 — 상세 열기
    onToggleStar: (row: MailMessageListItem) => void; // 별 탭 — 중요 토글
    checkedSeqs: Set<number>; // 복수 선택된 seq
    onToggleCheck: (seq: number) => void; // 체크박스 토글
}

/** 메일 모바일 카드 목록을 렌더링한다. */
export function MailMobileList({
    rows,
    loading,
    emptyMessage,
    onSelect,
    onToggleStar,
    checkedSeqs,
    onToggleCheck,
}: MailMobileListProps) {
    if (rows.length === 0) {
        return loading ? (
            <MobileListLoadingSpinner />
        ) : (
            <Box sx={{ py: 6, px: 2, textAlign: "center", color: "#94a3b8", fontSize: mfs(15) }}>{emptyMessage}</Box>
        );
    }

    return (
        <MobileCardStack>
            {rows.map((row) => {
                const unread = !row.is_read;
                return (
                    // 카드 배경/모서리/그림자는 StackContentsLayout 이 감싸는 Paper 가 담당한다 — 안쪽만 그린다.
                    <Box
                        key={row.seq}
                        onClick={() => onSelect(row)}
                        sx={{
                            display: "flex",
                            alignItems: "stretch",
                            minWidth: 0,
                            width: "100%",
                            boxSizing: "border-box",
                            cursor: "pointer",
                            userSelect: "none",
                            // 안 읽은 메일 — 왼쪽 파란 띠(목록 표의 굵은 글씨에 대응).
                            borderLeft: unread ? "4px solid #3b82f6" : "4px solid transparent",
                        }}
                    >
                        {/* 체크박스(복수 선택) · 중요 토글 — 카드 클릭(상세 열기)과 분리한다. */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", pt: 1.25, pl: 0.5 }}>
                            <Checkbox
                                size="medium"
                                checked={checkedSeqs.has(row.seq)}
                                onChange={() => onToggleCheck(row.seq)}
                                onClick={(event) => event.stopPropagation()}
                                sx={{ p: 0.75 }}
                                inputProps={{ "aria-label": "선택" }}
                            />
                            <IconButton
                                size="small"
                                aria-label={row.is_starred ? "중요 해제" : "중요 표시"}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onToggleStar(row);
                                }}
                                sx={{ p: 0.75 }}
                            >
                                {row.is_starred ? (
                                    <StarIcon sx={{ color: "#f59e0b", fontSize: 24 }} />
                                ) : (
                                    <StarBorderIcon sx={{ color: "#94a3b8", fontSize: 24 }} />
                                )}
                            </IconButton>
                        </Box>
                        <Box
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                                py: 1.5,
                                pr: 1.75,
                                pl: 0.5,
                            }}
                        >
                            {/* 1줄: 상대 + 일시 */}
                            <Box sx={{ display: "flex", alignItems: "center", columnGap: 0.75, minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        flex: 1,
                                        width: 0,
                                        fontSize: mfs(16),
                                        fontWeight: unread ? 700 : 500,
                                        color: "#111827",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {formatCounterpart(row)}
                                </Typography>
                                <MobileChip tone={unread ? "blue" : "default"} bold={unread}>
                                    {formatMailListDate(row.date_time) || "-"}
                                </MobileChip>
                            </Box>
                            {/* 2줄: 제목 + 첨부 */}
                            <Box sx={{ display: "flex", alignItems: "center", columnGap: 0.5, minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        flex: 1,
                                        width: 0,
                                        fontSize: mfs(17),
                                        fontWeight: unread ? 700 : 500,
                                        color: "#0f172a",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {row.subject || "(제목 없음)"}
                                </Typography>
                                {row.has_attachment ? (
                                    <AttachFileIcon sx={{ color: "#64748b", fontSize: 20, flexShrink: 0 }} />
                                ) : null}
                            </Box>
                            {/* 3줄: 미리보기 */}
                            {row.snippet ? (
                                <Typography
                                    sx={{
                                        fontSize: mfs(15),
                                        color: "#475569",
                                        lineHeight: 1.4,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {row.snippet}
                                </Typography>
                            ) : null}
                        </Box>
                    </Box>
                );
            })}
        </MobileCardStack>
    );
}
