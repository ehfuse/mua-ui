/**
 * 목록 복수 선택 액션 바 — [삭제] [스팸 등록] [읽음] [읽지 않음] (휴지통: [복원] [영구 삭제], 스팸함: [스팸 아님] [삭제]).
 * 선택 건수 표시 없이 버튼만 나란히 둔다(전체 선택 체크박스가 해제를 맡는다).
 * 데스크탑은 헤더 왼쪽(새 메일 버튼 옆), 모바일은 목록 위 툴바에 아이콘 버튼으로 그려진다.
 */

import type { ReactNode } from "react";
import { Button, IconButton, Stack, Tooltip } from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import RestoreFromTrashOutlinedIcon from "@mui/icons-material/RestoreFromTrashOutlined";
import ReplyAllOutlinedIcon from "@mui/icons-material/ReplyAllOutlined";
import type { BulkMessageAction } from "../../apis/mailApi";
import { ForwardArrowIcon, ReplyArrowIcon } from "./MailActionIcons";
import { TrashIcon } from "../../internal/icons";
import type { MailListFolder } from "../../models/types";

interface MailBulkActionBarProps {
    count: number; // 선택 건수(0 이면 버튼 비활성)
    folder: MailListFolder; // 현재 폴더(휴지통/스팸함이면 액션이 달라진다)
    compact?: boolean; // 모바일(아이콘만)
    onAction: (action: BulkMessageAction) => void; // 액션 실행
    replyEnabled?: boolean; // 답장/전체 답장 가능(대상 메일이 1건일 때)
    forwardEnabled?: boolean; // 전달 가능(선택 1건 이상 — 여러 통은 한 메일에 이어 붙여 전달)
    canMarkRead?: boolean; // 선택 중 안 읽은 메일이 있음("읽음으로 표시" 활성 조건)
    canMarkUnread?: boolean; // 선택 중 읽은 메일이 있음("읽지 않음으로 표시" 활성 조건)
    onReply?: (mode: "reply" | "replyAll" | "forward") => void; // 답장/전체 답장/전달
}

/** 데스크탑 버튼 — 텍스트만, 넉넉한 좌우 여백(메일 서비스 툴바 규격). */
const BUTTON_SX = {
    px: 2.25,
    minHeight: 40,
    fontSize: "14.5px",
    fontWeight: 600,
    color: "#111",
    borderColor: "#cbd5e1",
    bgcolor: "#fff",
    whiteSpace: "nowrap",
    "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
} as const;

/** 복수 선택 액션 바 */
export function MailBulkActionBar({
    count,
    folder,
    compact = false,
    onAction,
    replyEnabled = false,
    forwardEnabled = false,
    canMarkRead = true,
    canMarkUnread = true,
    onReply,
}: MailBulkActionBarProps) {
    const isTrash = folder === "trash";
    const isSpam = folder === "spam";
    const disabled = count === 0;
    const item = (key: string, label: string, icon: ReactNode, onClick: () => void, isDisabled: boolean) =>
        compact ? (
            <Tooltip title={label} key={key}>
                <span>
                    <IconButton size="small" onClick={onClick} aria-label={label} disabled={isDisabled}>
                        {icon}
                    </IconButton>
                </span>
            </Tooltip>
        ) : (
            <Button key={key} variant="outlined" onClick={onClick} disabled={isDisabled} sx={BUTTON_SX}>
                {label}
            </Button>
        );
    const button = (label: string, icon: ReactNode, action: BulkMessageAction, enabled = true) =>
        item(action, label, icon, () => onAction(action), disabled || !enabled);
    const replyButton = (label: string, icon: ReactNode, mode: "reply" | "replyAll" | "forward") =>
        item(
            mode,
            label,
            icon,
            () => onReply?.(mode),
            !(mode === "forward" ? forwardEnabled : replyEnabled) || !onReply
        );
    const items: ReactNode[] = [];
    if (isTrash) {
        items.push(button("복원", <RestoreFromTrashOutlinedIcon fontSize="small" />, "restore"));
        items.push(button("영구 삭제", <TrashIcon fontSize="small" />, "delete"));
    } else if (isSpam) {
        items.push(button("스팸 아님", <RestoreFromTrashOutlinedIcon fontSize="small" />, "restore"));
        items.push(button("삭제", <TrashIcon fontSize="small" />, "trash"));
    } else {
        items.push(button("삭제", <TrashIcon fontSize="small" />, "trash"));
        if (folder === "inbox")
            items.push(button("스팸 등록", <ReportGmailerrorredOutlinedIcon fontSize="small" />, "spam"));
        if (folder !== "draft") {
            items.push(replyButton("답장", <ReplyArrowIcon fontSize="small" />, "reply"));
            items.push(replyButton("전체 답장", <ReplyAllOutlinedIcon fontSize="small" />, "replyAll"));
            items.push(replyButton("전달", <ForwardArrowIcon fontSize="small" />, "forward"));
        }
        items.push(button("읽음", <MarkEmailReadOutlinedIcon fontSize="small" />, "read", canMarkRead));
        items.push(button("읽지 않음", <MarkEmailUnreadOutlinedIcon fontSize="small" />, "unread", canMarkUnread));
    }
    return (
        <Stack
            direction="row"
            spacing={compact ? 0.5 : 1.5}
            alignItems="center"
            sx={{ flexWrap: "wrap", rowGap: 0.5, minWidth: 0 }}
        >
            {items}
        </Stack>
    );
}
