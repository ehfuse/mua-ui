/**
 * 사용자 메일함 목록(메일 관리 다이얼로그의 "메일함" 탭) — 행: [아이콘(클릭=아이콘/색 선택)][이름·개인/공용 칩][메일 수 · 사용량][수정·삭제].
 * MailFolderFormDialog 는 이름/아이콘/공용 여부를 받는 mfd — 관리 다이얼로그의 [+ 만들기](신규)와 행의 ✎(수정)이 같은 창을 쓴다.
 * 삭제하면 그 메일함의 메일은 받은편지함으로 돌아간다.
 */

import { useCallback, useEffect, useState } from "react";
import { Box, Button, FormControlLabel, IconButton, Stack, Switch, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { ConfirmDialog, ErrorAlert, SuccessAlert } from "@ehfuse/alerts";
import { ClearTextField } from "@ehfuse/mui-form-controls";
import { TaskIconPickerPopover } from "@ehfuse/taskbox";
import { mailApi, unwrap } from "../../apis/mailApi";
import { FolderIcon } from "../../internal/FolderIcon";
import { TrashIcon } from "../../internal/icons";
import { Tooltip } from "../../internal/Tooltip";
import { useIsMobile } from "../../internal/useIsMobile";
import { useDialogBackClose } from "../../internal/useDialogBackClose";
import { useMuaFormDialog } from "../../MuaProvider";
import type { MailUserFolder } from "../../models/types";
import { formatBytes } from "../../utils/format";

/** 개인/공용 사각 칩 */
function ScopeChip({ shared }: { shared: boolean }) {
    return (
        <Box
            component="span"
            sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: "4px",
                fontSize: "12.5px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                color: shared ? "#1d4ed8" : "#334155",
                bgcolor: shared ? "#eff6ff" : "#f1f5f9",
            }}
        >
            {shared ? "공용" : "개인"}
        </Box>
    );
}

/** 아이콘 선택 버튼(클릭 → taskbox 아이콘/색 팝오버) */
function FolderIconButton({
    icon,
    color,
    shared,
    disabled,
    onChange,
}: {
    icon: string;
    color: string;
    shared: boolean;
    disabled?: boolean;
    onChange: (next: { icon?: string; color?: string }) => void;
}) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    return (
        <>
            <Tooltip title={disabled ? "" : "아이콘/색 선택"}>
                <span>
                    <IconButton
                        disabled={disabled}
                        onClick={(e) => setAnchor(e.currentTarget)}
                        aria-label="아이콘 선택"
                        sx={{ width: 40, height: 40 }}
                    >
                        <FolderIcon icon={icon} color={color || "#475569"} shared={shared} fontSize={24} />
                    </IconButton>
                </span>
            </Tooltip>
            <TaskIconPickerPopover
                anchorEl={anchor}
                value={icon}
                color={color}
                onSelect={(key) => onChange({ icon: key })}
                onSelectColor={(hex) => onChange({ color: hex })}
                onClose={() => setAnchor(null)}
            />
        </>
    );
}

/** 메일함 한 줄 */
function FolderRow({
    folder,
    onEdit,
    onChanged,
}: {
    folder: MailUserFolder;
    onEdit: () => void;
    onChanged: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const canManage = folder.can_manage !== false;
    const shared = folder.scope === "shared";

    // 행에서 바로 바꾸는 건 아이콘/색뿐 — 이름·공용 여부는 ✎(수정) 창에서
    const patchIcon = useCallback(
        async (body: { icon?: string; color?: string }) => {
            setBusy(true);
            try {
                unwrap(await mailApi.updateFolder(folder.seq, body), "메일함을 저장하지 못했습니다.");
                onChanged();
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "메일함을 저장하지 못했습니다." });
            } finally {
                setBusy(false);
            }
        },
        [folder.seq, onChanged]
    );
    const remove = useCallback(() => {
        ConfirmDialog({
            title: "메일함 삭제",
            message: `"${folder.name}" 메일함을 삭제합니다. 안에 있던 메일은 받은편지함으로 돌아갑니다.`,
            onConfirm: () =>
                void (async () => {
                    try {
                        const res = unwrap(await mailApi.deleteFolder(folder.seq), "메일함을 삭제하지 못했습니다.");
                        SuccessAlert(
                            res.moved > 0
                                ? `메일함을 삭제하고 ${res.moved}건을 받은편지함으로 옮겼습니다.`
                                : "메일함을 삭제했습니다."
                        );
                        onChanged();
                    } catch (error) {
                        ErrorAlert({
                            message: error instanceof Error ? error.message : "메일함을 삭제하지 못했습니다.",
                        });
                    }
                })(),
        });
    }, [folder, onChanged]);

    // 모바일은 폭이 좁아 [아이콘][이름·칩][✎🗑] 1줄 + [건수 · 크기] 2줄로 나눈다(데스크톱은 한 줄 4열).
    const isMobile = useIsMobile();
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: isMobile ? "40px minmax(0, 1fr) auto" : "40px minmax(0, 1fr) auto auto",
                alignItems: "center",
                columnGap: 1.5,
                rowGap: isMobile ? 0.25 : 1.5,
                px: 2,
                py: 1.25,
                border: "1px solid #e2e8f0",
                borderRadius: 1.5,
                bgcolor: "#fff",
            }}
        >
            <FolderIconButton
                icon={folder.icon}
                color={folder.color}
                shared={shared}
                disabled={!canManage || busy}
                onChange={(next) => void patchIcon(next)}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: "15px", fontWeight: 600, color: "#111" }}>
                    {folder.name}
                </Typography>
                <ScopeChip shared={shared} />
            </Stack>
            {/* 메일 수 · 스토리지 사용량 — 데스크톱은 오른쪽 컬럼, 모바일은 2줄째(이름 아래) */}
            <Typography
                noWrap
                sx={{
                    fontSize: "13.5px",
                    color: "#475569",
                    textAlign: isMobile ? "left" : "right",
                    ...(isMobile ? { gridColumn: "2 / -1", gridRow: 2 } : {}),
                }}
            >
                {folder.message_count ?? 0}통 · {formatBytes(folder.total_size ?? 0)}
            </Typography>
            <Stack
                direction="row"
                spacing={0.25}
                alignItems="center"
                sx={isMobile ? { gridColumn: 3, gridRow: 1 } : undefined}
            >
                <Tooltip title={canManage ? "수정" : "공용 메일함은 관리자 또는 만든 사람만 수정할 수 있습니다"}>
                    <span>
                        <IconButton size="small" onClick={onEdit} aria-label="수정" disabled={!canManage}>
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={canManage ? "삭제" : "공용 메일함은 관리자 또는 만든 사람만 삭제할 수 있습니다"}>
                    <span>
                        <IconButton size="small" onClick={remove} aria-label="삭제" disabled={!canManage}>
                            <TrashIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Stack>
        </Box>
    );
}

/** 메일함 목록(+ 행의 ✎ 로 여는 수정 창) */
export function MailFoldersList({ folders, onChanged }: { folders: MailUserFolder[]; onChanged: () => void }) {
    const [editing, setEditing] = useState<MailUserFolder | null>(null);
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            {folders.length === 0 ? (
                <Typography sx={{ fontSize: "15px", color: "#111", py: 2, textAlign: "center" }}>
                    만든 메일함이 없습니다. 아래 [만들기]로 만드세요.
                </Typography>
            ) : null}
            {folders.map((folder) => (
                <FolderRow key={folder.seq} folder={folder} onEdit={() => setEditing(folder)} onChanged={onChanged} />
            ))}
            <MailFolderFormDialog
                open={Boolean(editing)}
                folder={editing}
                onClose={() => setEditing(null)}
                onChanged={onChanged}
            />
        </Box>
    );
}

/** 메일함 추가/수정 다이얼로그 — [아이콘][이름] + 공용 스위치(액션바). folder 가 있으면 수정 */
export function MailFolderFormDialog({
    open,
    folder,
    onClose,
    onChanged,
}: {
    open: boolean; // 열림
    folder?: MailUserFolder | null; // 수정 대상(없으면 신규)
    onClose: () => void; // 닫기
    onChanged: () => void; // 저장 후(목록 재조회)
}) {
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    // 기기 뒤로가기로 닫힌다(mfd 는 히스토리를 안 건드린다). 취소/← 도 같은 경로로 닫아 히스토리 칸을 소비한다.
    const { requestClose } = useDialogBackClose({ open, onClose, modalId: "mail-folder-form-dialog" });
    const isEdit = Boolean(folder && folder.seq > 0);
    const [name, setName] = useState("");
    const [shared, setShared] = useState(false);
    const [icon, setIcon] = useState("");
    const [color, setColor] = useState("");
    const [busy, setBusy] = useState(false);
    // 열릴 때 대상 값으로 초기화(신규는 비움)
    useEffect(() => {
        if (!open) return;
        setName(folder?.name ?? "");
        setShared(folder?.scope === "shared");
        setIcon(folder?.icon ?? "");
        setColor(folder?.color ?? "");
    }, [open, folder]);

    const save = useCallback(async () => {
        const next = name.trim();
        if (!next) return;
        setBusy(true);
        try {
            const body = { name: next, scope: shared ? ("shared" as const) : ("personal" as const), icon, color };
            if (isEdit && folder) {
                unwrap(await mailApi.updateFolder(folder.seq, body), "메일함을 저장하지 못했습니다.");
                SuccessAlert("메일함을 저장했습니다.");
            } else {
                unwrap(await mailApi.createFolder(body), "메일함을 추가하지 못했습니다.");
                SuccessAlert("메일함을 추가했습니다.");
            }
            onClose();
            onChanged();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "메일함을 저장하지 못했습니다." });
        } finally {
            setBusy(false);
        }
    }, [name, shared, icon, color, isEdit, folder, onClose, onChanged]);

    return (
        <FormDialog
            fontScaleKey="MailFolderFormDialog"
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            open={open}
            onClose={requestClose}
            title={{ text: isEdit ? "메일함 수정" : "메일함 추가" }}
            titleIcons={{ delete: { visible: false } }}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="xs"
            scrollPastLastSection={false}
            contentBottomPadding={24}
            sections={[
                {
                    id: "mail-folder-form",
                    showTitle: false,
                    children: (
                        <Box sx={{ display: "grid", gap: 2, width: "100%" }}>
                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                                <Box
                                    sx={{
                                        "& .MuiIconButton-root": { width: 56, height: 56 },
                                        "& .MuiSvgIcon-root": { fontSize: 30 },
                                    }}
                                >
                                    <FolderIconButton
                                        icon={icon}
                                        color={color}
                                        shared={shared}
                                        onChange={(next) => {
                                            if (next.icon !== undefined) setIcon(next.icon);
                                            if (next.color !== undefined) setColor(next.color);
                                        }}
                                    />
                                </Box>
                                <ClearTextField
                                    label="메일함 이름"
                                    size="medium"
                                    fullWidth
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") void save();
                                    }}
                                    slotProps={{ htmlInput: { maxLength: 100, style: { fontSize: 15 } } }}
                                />
                            </Box>
                            {/* 모바일은 액션바가 좁아 공용 스위치를 본문(안내 위)에 둔다 — 액션바에는 버튼만 오른쪽으로. */}
                            {isMobile ? (
                                <FormControlLabel
                                    control={<Switch checked={shared} onChange={(_, v) => setShared(v)} />}
                                    label="공용 메일함"
                                    sx={{ ml: 0 }}
                                />
                            ) : null}
                            <Typography
                                sx={{
                                    fontSize: "15px",
                                    color: "#111",
                                    bgcolor: "#f1f5f9",
                                    borderRadius: 1,
                                    px: 2,
                                    py: 1.5,
                                    lineHeight: 1.6,
                                }}
                            >
                                아이콘을 눌러 모양과 색을 고를 수 있습니다. 공용 메일함은 같은 회사 전원이 보고 메일을
                                넣을 수 있으며, 수정·삭제는 관리자 또는 만든 사람만 할 수 있습니다.
                            </Typography>
                        </Box>
                    ),
                },
            ]}
            actions={{
                visible: true,
                showCancelButton: false,
                left: isMobile ? undefined : (
                    <FormControlLabel
                        control={<Switch checked={shared} onChange={(_, v) => setShared(v)} />}
                        label="공용 메일함"
                        sx={{ ml: 0 }}
                    />
                ),
                right: (
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={requestClose} disabled={busy}>
                            취소
                        </Button>
                        <Button variant="contained" onClick={() => void save()} disabled={busy || !name.trim()}>
                            저장
                        </Button>
                    </Stack>
                ),
            }}
        />
    );
}
