/**
 * 메일 헤더 오른쪽 액션 — 새로고침(동기화) · 계정 설정(톱니). (계정 선택 버튼은 검색칸 옆 필터 그룹에 있다)
 */

import { Badge, CircularProgress, IconButton, Stack } from "@mui/material";
import { OptionToggleGroup } from "../../internal/OptionToggleGroup";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
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
        // 간격은 gap 으로 준다(2026-10-16) — Stack spacing 은 둘째 칸부터 margin-left 를 덮어써 토글의 mx 가 왼쪽에서 먹지 않았고,
        // 새로고침 단추와 보기 토글이 붙어 보였다. 토글 양옆은 gap + mx 로 한 단계 더 띄운다.
        <Stack direction="row" alignItems="center" sx={{ columnGap: 1 }}>
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
            {viewMode && onViewModeChange ? (
                <OptionToggleGroup<MailViewMode>
                    value={viewMode}
                    onChange={(next) => next && onViewModeChange(next)}
                    options={[
                        {
                            value: "list",
                            label: (
                                <Tooltip title="목록형">
                                    <FormatListBulletedIcon fontSize="small" />
                                </Tooltip>
                            ),
                        },
                        {
                            value: "split",
                            label: (
                                <Tooltip title="분할형">
                                    <VerticalSplitOutlinedIcon fontSize="small" />
                                </Tooltip>
                            ),
                        },
                    ]}
                    sx={{ mx: 1, "& .MuiToggleButtonGroup-grouped": { px: 1.25, py: 0.5 } }}
                />
            ) : null}
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
