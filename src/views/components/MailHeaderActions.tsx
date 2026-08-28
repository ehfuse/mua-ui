/**
 * 메일 헤더 오른쪽 액션 — 새로고침(동기화) · 계정 설정(톱니). (계정 선택 버튼은 검색칸 옆 필터 그룹에 있다)
 */

import { Badge, CircularProgress, IconButton, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import VerticalSplitOutlinedIcon from "@mui/icons-material/VerticalSplitOutlined";
import { Tooltip } from "../../internal/Tooltip";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import type { MailAccount } from "../../models/types";

/** 목록 보기 타입 — 목록형(상세는 드로어) / 분할화면(오른쪽 상세 패널) */
export type MailViewMode = "list" | "split";

interface MailHeaderActionsProps {
    accounts: MailAccount[]; // 계정 목록
    viewMode?: MailViewMode; // 보기 타입(데스크탑만 — 미지정이면 토글을 그리지 않는다)
    onViewModeChange?: (mode: MailViewMode) => void; // 보기 타입 변경
    syncing: boolean; // 동기화 중
    onSync: () => void; // 새로고침(동기화)
    onOpenSettings: () => void; // 계정 설정
}

/** 헤더 오른쪽 액션 묶음 */
export function MailHeaderActions({
    accounts,
    viewMode,
    onViewModeChange,
    syncing,
    onSync,
    onOpenSettings,
}: MailHeaderActionsProps) {
    const hasError = accounts.some((a) => a.last_error);
    return (
        <Stack direction="row" spacing={0.5} alignItems="center">
            {viewMode && onViewModeChange ? (
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={viewMode}
                    onChange={(_, next: MailViewMode | null) => next && onViewModeChange(next)}
                    aria-label="보기 타입"
                    sx={{ mr: 0.5, "& .MuiToggleButton-root": { px: 1, py: 0.5, border: "1px solid #cbd5e1" } }}
                >
                    <ToggleButton value="list" aria-label="목록형">
                        <Tooltip title="목록형 (상세는 오른쪽 드로어)">
                            <ViewListOutlinedIcon fontSize="small" />
                        </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="split" aria-label="분할화면">
                        <Tooltip title="분할화면 (목록 + 오른쪽 상세)">
                            <VerticalSplitOutlinedIcon fontSize="small" />
                        </Tooltip>
                    </ToggleButton>
                </ToggleButtonGroup>
            ) : null}
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
