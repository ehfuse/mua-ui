import { t } from "../../i18n";
/**
 * 색상 라벨 화면 조각(0.3.158) — 칩 · 색 점 · 고정 색 견본 · 라벨 고르기 메뉴.
 * config.labels 를 켠 앱에서만 그려진다(서버에 라벨 API 가 있어야 한다).
 */

import { Box, Divider, ListItemIcon, Menu, MenuItem, Typography } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import AddIcon from "@mui/icons-material/Add";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LabelIcon from "@mui/icons-material/Label";
import type { MailLabel } from "../../models/types";

/**
 * 고르는 색 9가지 — 사람마다 아무 색이나 고르게 두면 칩 글자가 안 읽히는 색(연노랑 바탕에 흰 글자 등)이 생긴다.
 * 칩은 색 바탕 + 흰 글자라 흰 글자가 읽히는 진한 쪽만 둔다(노랑도 갈색에 가까운 진한 노랑).
 */
export const LABEL_COLORS: { color: string; name: string }[] = [
    { color: "#dc2626", get name() { return t("colorRed"); } },
    { color: "#ea580c", get name() { return t("colorOrange"); } },
    { color: "#b45309", get name() { return t("colorYellow"); } },
    { color: "#16a34a", get name() { return t("colorGreen"); } },
    { color: "#0d9488", get name() { return t("colorTeal"); } },
    { color: "#2563eb", get name() { return t("colorBlue"); } },
    { color: "#7c3aed", get name() { return t("colorPurple"); } },
    { color: "#db2777", get name() { return t("colorPink"); } },
    { color: "#64748b", get name() { return t("colorGray"); } },
];

/** 바탕색에 올릴 글자색 — 밝은 바탕(서버에 견본 밖 색이 들어온 경우)이면 진한 글자. */
export function labelTextColor(hex: string): string {
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
    if (!m) return "#fff";
    const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16) / 255);
    return 0.299 * r + 0.587 * g + 0.114 * b > 0.62 ? "#0f172a" : "#fff";
}

/** 라벨 색(빈 값이면 회색) */
export const labelColor = (label: Pick<MailLabel, "color">) => label.color || "#64748b";

/** 라벨 칩 — 목록 행의 제목 앞(지메일처럼 색 바탕 · 이름). 글자는 앱 규칙(14px 이상)에 맞춰 14px. */
export function MailLabelChip({ label, maxWidth = 120 }: { label: MailLabel; maxWidth?: number }) {
    const bg = labelColor(label);
    return (
        <Box
            component="span"
            title={label.name}
            sx={{
                display: "inline-block",
                verticalAlign: "middle",
                maxWidth,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                px: 0.75,
                borderRadius: "4px",
                fontSize: "14px",
                lineHeight: "20px",
                fontWeight: 500,
                bgcolor: bg,
                color: labelTextColor(bg),
                flexShrink: 0,
            }}
        >
            {label.name}
        </Box>
    );
}

/** 메일 한 통의 라벨 칩들 — label_seqs 가운데 지금 있는 라벨만, 라벨 순서대로. */
export function MailLabelChips({
    seqs,
    labels,
    maxWidth,
}: {
    seqs: number[] | undefined;
    labels: MailLabel[];
    maxWidth?: number;
}) {
    if (!seqs || seqs.length === 0 || labels.length === 0) return null;
    const shown = labels.filter((l) => seqs.includes(l.seq));
    if (shown.length === 0) return null;
    return (
        <>
            {shown.map((label) => (
                <MailLabelChip key={label.seq} label={label} maxWidth={maxWidth} />
            ))}
        </>
    );
}

/** 라벨 색 점(탭 · 메뉴 · 관리 목록) */
export function MailLabelDot({ color, size = 20 }: { color: string; size?: number }) {
    // 원이 아니라 목록 행의 라벨 단추와 같은 꼬리표 모양으로 그린다(2026-10-16) — 탭·메뉴의 원은 "안 읽음 점" 처럼 읽혀 라벨인 줄 몰랐다.
    return <LabelIcon sx={{ fontSize: size, color: color || "#64748b", flexShrink: 0 }} />;
}

/** 고른 메일들이 그 라벨을 달고 있는 정도 — 모두 · 일부 · 없음 */
export type LabelCheckState = "all" | "some" | "none";

/** 고른 메일들(label_seqs)에서 라벨마다 체크 상태를 낸다. */
export function labelCheckStates(rows: { label_seqs?: number[] }[], labels: MailLabel[]): Map<number, LabelCheckState> {
    const map = new Map<number, LabelCheckState>();
    for (const label of labels) {
        const n = rows.filter((row) => row.label_seqs?.includes(label.seq)).length;
        map.set(label.seq, n === 0 ? "none" : n === rows.length ? "all" : "some");
    }
    return map;
}

/** 체크 상태 아이콘(라벨 색으로 칠한다) */
export function LabelCheckIcon({ state, color }: { state: LabelCheckState; color: string }) {
    const sx = { fontSize: 20, color: state === "none" ? "#94a3b8" : color };
    if (state === "all") return <CheckBoxIcon sx={sx} />;
    if (state === "some") return <IndeterminateCheckBoxIcon sx={sx} />;
    return <CheckBoxOutlineBlankIcon sx={sx} />;
}

/**
 * 라벨 고르기 메뉴(머리 툴바 [라벨]) — 내 라벨마다 체크(고른 메일이 모두 달았으면 체크, 일부면 반쯤).
 * 누르면 바로 달거나 뗀다(모두 달린 것 = 떼기, 그 밖 = 모두에게 달기). 메뉴는 열어 둔 채라 여러 개를 이어 고른다.
 * 맨 아래 "새 라벨 만들기"(만들면 고른 메일에 바로 단다) · "라벨 관리".
 * 애니메이션은 없다(transitionDuration 0) — 누른 자리에서 메뉴가 늦게 따라오는 것처럼 보인다(앱 공통 규칙).
 * anchorPosition 을 주면 그 좌표에 띄운다 — 목록 행의 단추처럼 메뉴를 여는 순간 다시 그려져 사라지는 단추에 붙이면
 * MUI 가 기준점을 잃고 화면 왼쪽 위에 띄운다(2026-10-16).
 */
export function MailLabelMenu({
    anchorEl,
    anchorPosition,
    onClose,
    labels,
    states,
    onToggle,
    onCreate,
    onManage,
}: {
    anchorEl?: HTMLElement | null;
    anchorPosition?: { top: number; left: number } | null;
    onClose: () => void;
    labels: MailLabel[];
    states: Map<number, LabelCheckState>;
    onToggle: (label: MailLabel, add: boolean) => void;
    onCreate: () => void;
    onManage?: () => void;
}) {
    return (
        <Menu
            {...(anchorPosition
                ? { anchorReference: "anchorPosition" as const, anchorPosition }
                : { anchorEl: anchorEl ?? null })}
            open={Boolean(anchorPosition || anchorEl)}
            onClose={onClose}
            transitionDuration={0}
            slotProps={{ paper: { sx: { minWidth: 220, maxHeight: 420 } } }}
        >
            {labels.length === 0 ? (
                <Typography sx={{ px: 2, py: 1, fontSize: 15, color: "text.secondary" }}>{t("noLabelsShort")}</Typography>
            ) : null}
            {labels.map((label) => {
                const state = states.get(label.seq) ?? "none";
                return (
                    <MenuItem key={label.seq} onClick={() => onToggle(label, state !== "all")} sx={{ fontSize: 15, gap: 1 }}>
                        <ListItemIcon sx={{ minWidth: "0 !important" }}>
                            <LabelCheckIcon state={state} color={labelColor(label)} />
                        </ListItemIcon>
                        <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {label.name}
                        </Box>
                        <MailLabelDot color={labelColor(label)} />
                    </MenuItem>
                );
            })}
            <Divider />
            <MenuItem
                onClick={() => {
                    onClose();
                    onCreate();
                }}
                sx={{ fontSize: 15, gap: 1 }}
            >
                <AddIcon sx={{ fontSize: 20, color: "#475569" }} />
                {t("createLabel")}
            </MenuItem>
            {onManage ? (
                <MenuItem
                    onClick={() => {
                        onClose();
                        onManage();
                    }}
                    sx={{ fontSize: 15, gap: 1 }}
                >
                    <SettingsOutlinedIcon sx={{ fontSize: 20, color: "#475569" }} />
                    {t("manageLabels")}
                </MenuItem>
            ) : null}
        </Menu>
    );
}
