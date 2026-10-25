import { t } from "../../i18n";
/**
 * 목록 복수 선택 액션 바 — [삭제] [스팸 등록] [읽음으로 표시] [읽지 않음으로 표시] [라벨(config.labels)] (휴지통: [복원] [영구 삭제], 스팸함: [스팸 아님] [삭제]).
 * 선택 건수 표시 없이 버튼만 나란히 둔다(전체 선택 체크박스가 해제를 맡는다).
 * 데스크탑은 헤더 왼쪽(새 메일 버튼 옆), 모바일은 목록 위 툴바에 아이콘 버튼으로 그려진다.
 */

import { useState, type ReactNode } from "react";
import { Button, IconButton, Stack } from "@mui/material";
import { Tooltip } from "../../internal/Tooltip";
// 읽음은 열린 편지 봉투(0.3.125) — 체크 달린 봉투는 옆의 "읽지 않음"(점 달린 봉투)과 한눈에 갈리지 않았다.
import DraftsOutlinedIcon from "@mui/icons-material/DraftsOutlined";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import RestoreFromTrashOutlinedIcon from "@mui/icons-material/RestoreFromTrashOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import type { BulkMessageAction } from "../../apis/mailApi";
import { ForwardArrowIcon, ReplyAllArrowIcon, ReplyArrowIcon } from "./MailActionIcons";
import { TrashIcon } from "../../internal/icons";
import { ConfirmActionPopper } from "@ehfuse/mui-confirm-action";
import type { MailListFolder } from "../../models/types";
import { useMuaConfig } from "../../MuaProvider";

interface MailBulkActionBarProps {
    count: number; // 선택 건수(0 이면 버튼 비활성)
    folder: MailListFolder; // 현재 폴더(휴지통/스팸함이면 액션이 달라진다)
    compact?: boolean; // 모바일(아이콘만)
    onAction: (action: BulkMessageAction) => void; // 액션 실행
    replyEnabled?: boolean; // 답장/전체 답장 가능(대상 메일이 1건일 때)
    forwardEnabled?: boolean; // 전달 가능(선택 1건 이상 — 여러 통은 한 메일에 이어 붙여 전달)
    replyAllEnabled?: boolean; // 전체 답장 가능(대상 1건 + 참조 있음)
    canMarkRead?: boolean; // 선택 중 안 읽은 메일이 있음("읽음으로 표시" 활성 조건)
    canMarkUnread?: boolean; // 선택 중 읽은 메일이 있음("읽지 않음으로 표시" 활성 조건)
    onReply?: (mode: "reply" | "replyAll" | "forward") => void; // 답장/전체 답장/전달
    onLabel?: (anchorEl: HTMLElement) => void; // [라벨] — 고른 메일에 라벨 달기 메뉴(config.labels 를 켰을 때만 넘긴다)
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
    replyAllEnabled = false,
    canMarkRead = true,
    canMarkUnread = true,
    onReply,
    onLabel,
}: MailBulkActionBarProps) {
    // 넓은 화면도 아이콘으로(config.desktop.iconToolbar) — 단추 일곱 개가 글로 서면 검색칸 오른쪽을 다 차지했다.
    const iconDesktop = Boolean(useMuaConfig().desktop?.iconToolbar) && !compact;
    const isTrash = folder === "trash";
    const isSpam = folder === "spam";
    const disabled = count === 0;
    // 스팸 등록/삭제/영구 삭제는 확인 팝퍼를 거친다(앵커 = 누른 버튼).
    const [confirm, setConfirm] = useState<{ anchorEl: HTMLElement | null; action: BulkMessageAction } | null>(null);
    const needsConfirm = (action: BulkMessageAction) => action === "spam" || action === "trash" || action === "delete";
    const confirmTitle =
        confirm?.action === "spam"
            ? t("bulkSpamConfirm", { count })
            : confirm?.action === "delete"
              ? t("bulkDeleteForeverConfirm", { count })
              : t("bulkDeleteConfirm", { count });
    const confirmLabel = confirm?.action === "spam" ? t("reportSpam") : confirm?.action === "delete" ? t("deleteForever") : t("delete");
    const item = (
        key: string,
        label: string,
        icon: ReactNode,
        onClick: (anchorEl: HTMLElement) => void,
        isDisabled: boolean
    ) =>
        compact || iconDesktop ? (
            <Tooltip title={label} key={key}>
                <span>
                    <IconButton
                        size={iconDesktop ? "medium" : "small"}
                        onClick={(e) => onClick(e.currentTarget)}
                        aria-label={label}
                        disabled={isDisabled}
                    >
                        {icon}
                    </IconButton>
                </span>
            </Tooltip>
        ) : (
            <Button
                key={key}
                variant="outlined"
                onClick={(e) => onClick(e.currentTarget)}
                disabled={isDisabled}
                sx={BUTTON_SX}
            >
                {label}
            </Button>
        );
    const button = (label: string, icon: ReactNode, action: BulkMessageAction, enabled = true) =>
        item(
            action,
            label,
            icon,
            (anchorEl) => (needsConfirm(action) ? setConfirm({ anchorEl, action }) : onAction(action)),
            disabled || !enabled
        );
    const replyButton = (label: string, icon: ReactNode, mode: "reply" | "replyAll" | "forward") =>
        item(
            mode,
            label,
            icon,
            () => onReply?.(mode),
            !(mode === "forward" ? forwardEnabled : mode === "replyAll" ? replyAllEnabled : replyEnabled) || !onReply
        );
    const items: ReactNode[] = [];
    if (isTrash) {
        items.push(button(t("restore"), <RestoreFromTrashOutlinedIcon fontSize="small" />, "restore"));
        items.push(button(t("deleteForever"), <TrashIcon fontSize="small" />, "delete"));
    } else if (isSpam) {
        items.push(button(t("notSpam"), <RestoreFromTrashOutlinedIcon fontSize="small" />, "restore"));
        items.push(button(t("delete"), <TrashIcon fontSize="small" />, "trash"));
    } else {
        items.push(button(t("delete"), <TrashIcon fontSize="small" />, "trash"));
        if (folder === "inbox")
            items.push(button(t("markSpam"), <ReportGmailerrorredOutlinedIcon fontSize="small" />, "spam"));
        if (folder !== "draft") {
            // 폰(아이콘만)에서 답장 · 전체 답장을 못 쓰는 때(여러 통을 고름)는 숨긴다 — 흐린 아이콘이 자리만 차지해 줄이 넘어갔다
            // (0.3.170, 2026-10-19 사용자 지적 "전체 선택 개수가 많아지면 아이콘이 개행"). 전달은 여러 통도 되니 남긴다
            if (!compact || replyEnabled) items.push(replyButton(t("reply"), <ReplyArrowIcon fontSize="small" />, "reply"));
            if (!compact || replyAllEnabled)
                items.push(replyButton(t("replyAll"), <ReplyAllArrowIcon fontSize="small" />, "replyAll"));
            items.push(replyButton(t("forward"), <ForwardArrowIcon fontSize="small" />, "forward"));
        }
        // 이름은 "읽음으로 표시"(0.3.158) — "읽음" 만으로는 상태 표시인지 단추인지 갈리지 않았다(아이콘 모드의 툴팁도 이 이름이다).
        items.push(button(t("markRead"), <DraftsOutlinedIcon fontSize="small" />, "read", canMarkRead));
        items.push(button(t("markUnread"), <MarkEmailUnreadOutlinedIcon fontSize="small" />, "unread", canMarkUnread));
        if (onLabel) items.push(item("label", t("label"), <LabelOutlinedIcon fontSize="small" />, onLabel, disabled));
    }
    return (
        <>
            <Stack
                direction="row"
                spacing={compact || iconDesktop ? 0.5 : 1.5}
                alignItems="center"
                // 폰은 한 줄로 — 좁으면 줄을 바꾸지 않고 옆으로 민다(줄이 바뀌면 계정 줄이 두 줄로 커져 목록이 밀렸다)
                sx={
                    compact
                        ? { flexWrap: "nowrap", minWidth: 0, overflowX: "auto", scrollbarWidth: "none", "& > *": { flexShrink: 0 } }
                        : { flexWrap: "wrap", rowGap: 0.5, minWidth: 0 }
                }
            >
                {items}
            </Stack>
            <ConfirmActionPopper
                open={Boolean(confirm)}
                anchorEl={confirm?.anchorEl ?? null}
                placement="bottom"
                zIndex={1400}
                title={confirmTitle}
                confirmText={confirmLabel}
                cancelText={t("cancel")}
                onCancel={() => setConfirm(null)}
                onConfirm={() => {
                    const action = confirm?.action;
                    setConfirm(null);
                    if (action) onAction(action);
                }}
            />
        </>
    );
}
