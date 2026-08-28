/**
 * 메일 헤더 오른쪽 액션 — 새로고침(동기화) · 계정 설정(톱니). (계정 선택 버튼은 검색칸 옆 필터 그룹에 있다)
 */

import { Badge, CircularProgress, IconButton, Stack } from "@mui/material";
import { Tooltip } from "../../internal/Tooltip";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import type { MailAccount } from "../../models/types";

interface MailHeaderActionsProps {
    accounts: MailAccount[]; // 계정 목록
    syncing: boolean; // 동기화 중
    onSync: () => void; // 새로고침(동기화)
    onOpenSettings: () => void; // 계정 설정
}

/** 헤더 오른쪽 액션 묶음 */
export function MailHeaderActions({ accounts, syncing, onSync, onOpenSettings }: MailHeaderActionsProps) {
    const hasError = accounts.some((a) => a.last_error);
    return (
        <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="새로고침 (새 메일 받기)">
                <span>
                    <IconButton
                        size="small"
                        onClick={onSync}
                        disabled={syncing || accounts.length === 0}
                        aria-label="새로고침"
                    >
                        {syncing ? <CircularProgress size={18} /> : <SyncIcon />}
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={hasError ? "메일 계정 설정 (동기화 오류 있음)" : "메일 계정 설정"}>
                <IconButton size="small" onClick={onOpenSettings} aria-label="계정 설정">
                    <Badge color="error" variant="dot" invisible={!hasError}>
                        <SettingsOutlinedIcon />
                    </Badge>
                </IconButton>
            </Tooltip>
        </Stack>
    );
}
