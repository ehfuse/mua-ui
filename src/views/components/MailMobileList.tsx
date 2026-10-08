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

import { useRef, type MouseEvent } from "react";
import { Box, Checkbox, IconButton, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { StarRoundedIcon } from "../../internal/icons";
import { mfs } from "../../internal/mobileFontScale";
import { MobileChip, MobileListLoadingSpinner, MobilePlainList } from "../../internal/mobileParts";
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
    // 길게 누르기(contextmenu) → 팝업 메뉴. 데스크톱 표의 우클릭 메뉴와 같은 항목을 그대로 띄운다.
    onRowContextMenu?: (row: MailMessageListItem, event: MouseEvent) => void;
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
    onRowContextMenu,
}: MailMobileListProps) {
    // 길게 눌러 메뉴를 연 직후 손을 떼면 click 이 이어져 상세가 함께 열린다 — 그 한 번만 삼킨다.
    const suppressClickRef = useRef(false);
    if (rows.length === 0) {
        return loading ? (
            <MobileListLoadingSpinner />
        ) : (
            <Box sx={{ py: 6, px: 2, textAlign: "center", color: "#94a3b8", fontSize: mfs(15) }}>{emptyMessage}</Box>
        );
    }

    return (
        <MobilePlainList>
            {rows.map((row) => {
                const unread = !row.is_read;
                return (
                    // 목록형(2026-10-08) — 바탕·모서리·줄 사이 구분선은 MobilePlainList 가 그린다. 여기서는 줄 안쪽만 그린다.
                    <Box
                        key={row.seq}
                        onClick={() => {
                            // 방금 길게 눌러 메뉴를 연 것이면 상세를 열지 않는다.
                            if (suppressClickRef.current) {
                                suppressClickRef.current = false;
                                return;
                            }
                            onSelect(row);
                        }}
                        // 폰에서 카드를 길게 누르면 브라우저가 contextmenu 를 쏜다 — 그 자리에 팝업 메뉴를 띄운다.
                        // 기본 동작(텍스트 선택 핸들·브라우저 메뉴)은 핸들러 안에서 막는다.
                        onContextMenu={
                            onRowContextMenu
                                ? (event) => {
                                      suppressClickRef.current = true;
                                      onRowContextMenu(row, event);
                                  }
                                : undefined
                        }
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                            width: "100%",
                            boxSizing: "border-box",
                            cursor: "pointer",
                            userSelect: "none",
                            // iOS 사파리는 길게 누르면 링크/이미지 콜아웃을 띄운다 — 팝업 메뉴와 겹치지 않게 끈다.
                            WebkitTouchCallout: "none",
                            py: 1,
                            pr: 1.75,
                            pl: 0.5,
                            // 안 읽은 메일 — 왼쪽 파란 띠(목록 표의 굵은 글씨에 대응).
                            borderLeft: unread ? "4px solid #3b82f6" : "4px solid transparent",
                        }}
                    >
                        {/* 1행: 체크박스(복수 선택) · 중요 토글 · 상대 · 일시 — 체크/별은 카드 클릭(상세 열기)과 분리한다. */}
                        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
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
                                <StarRoundedIcon
                                    sx={{
                                        fontSize: 24,
                                        ...(row.is_starred
                                            ? { color: "#f59e0b", fill: "currentColor" }
                                            : { color: "#94a3b8" }),
                                    }}
                                />
                            </IconButton>
                            <Typography
                                sx={{
                                    flex: 1,
                                    width: 0,
                                    ml: 0.5,
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
                        {/* 2·3행: 제목(+첨부)·미리보기 — 별표 오른쪽이 아니라 아래 행에 전폭으로. */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0, pl: 1, pt: 0.25 }}>
                            {/* 2줄: 제목 + 첨부 */}
                            {/* 제목은 말줄임하지 않고 줄을 바꿔 다 보인다(0.3.105) — 한 줄로 자르면 앞머리 말머리만 남아 무슨 메일인지 몰랐다. */}
                            <Box sx={{ display: "flex", alignItems: "flex-start", columnGap: 0.5, minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        flex: 1,
                                        width: 0,
                                        // 17→16(2026-10-08 지시) — 목록형으로 바뀌어 줄이 촘촘해진 만큼 제목·내용을 1px 씩 줄였다.
                                        fontSize: mfs(16),
                                        fontWeight: unread ? 700 : 500,
                                        color: "#0f172a",
                                        // 줄 간격은 아래 미리보기 줄과 같은 값.
                                        lineHeight: 1.4,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {row.translated_subject || row.subject || "(제목 없음)"}
                                </Typography>
                                {row.has_attachment ? (
                                    <AttachFileIcon sx={{ color: "#64748b", fontSize: 20, flexShrink: 0, mt: 0.25 }} />
                                ) : null}
                            </Box>
                            {/* 3줄: 미리보기 — 15→14(2026-10-01): 제목과 차이를 벌려 제목이 먼저 읽히게.
                                14→13(2026-10-08 사용자 지시 — 제목과 함께 1px 씩). 앱 규칙(14px 미만 금지)의 예외라 여기서 더 줄이지 않는다. */}
                            {row.snippet ? (
                                <Typography
                                    sx={{
                                        fontSize: mfs(13),
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
        </MobilePlainList>
    );
}
