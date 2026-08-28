/**
 * 목록 복수 선택 액션 바 — [N개 선택] 읽음 · 읽지 않음 · 삭제(휴지통은 복원/영구 삭제) · 스팸(받은편지함) · 선택 해제.
 * 데스크탑은 헤더 왼쪽(새 메일 버튼 자리), 모바일은 목록 위 툴바에 그려진다.
 */

import { Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import RestoreFromTrashOutlinedIcon from "@mui/icons-material/RestoreFromTrashOutlined";
import type { BulkMessageAction } from "../../apis/mailApi";
import { TrashIcon } from "../../internal/icons";
import type { MailListFolder } from "../../models/types";

interface MailBulkActionBarProps {
    count: number; // 선택 건수
    folder: MailListFolder; // 현재 폴더(휴지통/스팸함이면 액션이 달라진다)
    compact?: boolean; // 모바일(아이콘만)
    onAction: (action: BulkMessageAction) => void; // 액션 실행
    onClear: () => void; // 선택 해제
}

/** 복수 선택 액션 바 */
export function MailBulkActionBar({ count, folder, compact = false, onAction, onClear }: MailBulkActionBarProps) {
    const isTrash = folder === "trash";
    const isSpam = folder === "spam";
    const button = (label: string, icon: React.ReactNode, action: BulkMessageAction, color?: "error") =>
        compact ? (
            <Tooltip title={label} key={action}>
                <IconButton size="small" color={color} onClick={() => onAction(action)} aria-label={label}>
                    {icon}
                </IconButton>
            </Tooltip>
        ) : (
            <Button
                key={action}
                size="small"
                variant="outlined"
                color={color}
                startIcon={icon}
                onClick={() => onAction(action)}
                sx={{ fontSize: "13.5px" }}
            >
                {label}
            </Button>
        );
    return (
        <Stack
            direction="row"
            spacing={compact ? 0.5 : 1}
            alignItems="center"
            sx={{ flexWrap: "wrap", rowGap: 0.5, minWidth: 0 }}
        >
            <Typography
                sx={{ fontSize: compact ? "15px" : "14px", fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}
            >
                {count}개 선택
            </Typography>
            {!isTrash && !isSpam ? button("읽음", <MarkEmailReadOutlinedIcon fontSize="small" />, "read") : null}
            {!isTrash && !isSpam
                ? button("읽지 않음", <MarkEmailUnreadOutlinedIcon fontSize="small" />, "unread")
                : null}
            {isTrash || isSpam
                ? button(isSpam ? "스팸 아님" : "복원", <RestoreFromTrashOutlinedIcon fontSize="small" />, "restore")
                : null}
            {folder === "inbox" ? button("스팸", <ReportGmailerrorredOutlinedIcon fontSize="small" />, "spam") : null}
            {isTrash
                ? button("영구 삭제", <TrashIcon fontSize="small" />, "delete", "error")
                : button("삭제", <TrashIcon fontSize="small" />, "trash")}
            <Tooltip title="선택 해제">
                <IconButton size="small" onClick={onClear} aria-label="선택 해제">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Stack>
    );
}
