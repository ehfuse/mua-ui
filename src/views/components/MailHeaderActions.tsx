import { t } from "../../i18n";
/**
 * 메일 헤더 오른쪽 액션 — [비우기](휴지통 · 스팸함만) · 새로고침(동기화) · 계정 설정(톱니). (계정 선택 버튼은 검색칸 옆 필터 그룹에 있다)
 */

import { Badge, CircularProgress, IconButton, Stack } from "@mui/material";
import { OptionToggleGroup } from "../../internal/OptionToggleGroup";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import VerticalSplitOutlinedIcon from "@mui/icons-material/VerticalSplitOutlined";
import { Tooltip } from "../../internal/Tooltip";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
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
    /** 휴지통 · 스팸함 비우기(2026-10-27) — 그 폴더를 볼 때만 준다. label 은 단추 풀이(툴팁 · 읽기 프로그램). */
    emptyAction?: { label: string; onClick: () => void; disabled?: boolean };
}

/** 헤더 오른쪽 액션 묶음 */
export function MailHeaderActions({
    accounts,
    viewMode,
    onViewModeChange,
    syncing,
    onSync,
    onOpenSettings,
    emptyAction,
}: MailHeaderActionsProps) {
    const hasError = accounts.some((a) => a.last_error);
    return (
        // 간격은 gap 으로 준다(2026-10-16) — Stack spacing 은 둘째 칸부터 margin-left 를 덮어써 토글의 mx 가 왼쪽에서 먹지 않았고,
        // 새로고침 단추와 보기 토글이 붙어 보였다. 토글 양옆은 gap + mx 로 한 단계 더 띄운다.
        <Stack direction="row" alignItems="center" sx={{ columnGap: 1 }}>
            {emptyAction ? (
                <Tooltip title={emptyAction.label}>
                    <span>
                        <IconButton size="small" onClick={emptyAction.onClick} disabled={emptyAction.disabled} aria-label={emptyAction.label}>
                            <DeleteSweepOutlinedIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            ) : null}
            <Tooltip title={t("refreshTooltip")}>
                <span>
                    <IconButton
                        size="small"
                        onClick={onSync}
                        disabled={syncing || accounts.length === 0}
                        aria-label={t("refresh")}
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
                                <Tooltip title={t("listView")}>
                                    <FormatListBulletedIcon fontSize="small" />
                                </Tooltip>
                            ),
                        },
                        {
                            value: "split",
                            label: (
                                <Tooltip title={t("splitView")}>
                                    <VerticalSplitOutlinedIcon fontSize="small" />
                                </Tooltip>
                            ),
                        },
                    ]}
                    sx={{ mx: 1, "& .MuiToggleButtonGroup-grouped": { px: 1.25, py: 0.5 } }}
                />
            ) : null}
            <Tooltip title={hasError ? t("accountSettingsError") : t("accountSettings")}>
                <IconButton size="small" onClick={onOpenSettings} aria-label={t("accountSettingsShort")}>
                    <Badge color="error" variant="dot" invisible={!hasError}>
                        <SettingsOutlinedIcon />
                    </Badge>
                </IconButton>
            </Tooltip>
        </Stack>
    );
}
