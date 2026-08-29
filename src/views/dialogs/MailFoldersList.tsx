/**
 * 사용자 메일함 목록(메일 관리 다이얼로그의 "메일함" 탭) — 행: [아이콘(클릭=아이콘/색 선택)][이름·개인/공용 칩][메일 수 · 사용량][이름 변경·삭제].
 * MailFolderAddDialog 는 이름/아이콘/공용 여부를 받는 mfd(관리 다이얼로그의 [+ 만들기]가 띄운다).
 * 삭제하면 그 메일함의 메일은 받은편지함으로 돌아간다.
 */

import { useCallback, useState } from "react";
import { Box, Button, FormControlLabel, IconButton, Stack, Switch, TextField, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { ConfirmDialog, ErrorAlert, SuccessAlert } from "@ehfuse/alerts";
import { TaskIconPickerPopover } from "@ehfuse/taskbox";
import { mailApi, unwrap } from "../../apis/mailApi";
import { FolderIcon } from "../../internal/FolderIcon";
import { TrashIcon } from "../../internal/icons";
import { Tooltip } from "../../internal/Tooltip";
import { useIsMobile } from "../../internal/useIsMobile";
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
function FolderRow({ folder, onChanged }: { folder: MailUserFolder; onChanged: () => void }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(folder.name);
    const [busy, setBusy] = useState(false);
    const canManage = folder.can_manage !== false;
    const shared = folder.scope === "shared";

    const patch = useCallback(
        async (body: { name?: string; icon?: string; color?: string }) => {
            setBusy(true);
            try {
                unwrap(await mailApi.updateFolder(folder.seq, body), "메일함을 저장하지 못했습니다.");
                onChanged();
                return true;
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "메일함을 저장하지 못했습니다." });
                return false;
            } finally {
                setBusy(false);
            }
        },
        [folder.seq, onChanged]
    );
    const save = useCallback(async () => {
        const next = name.trim();
        if (!next || next === folder.name) {
            setEditing(false);
            setName(folder.name);
            return;
        }
        if (await patch({ name: next })) setEditing(false);
    }, [name, folder.name, patch]);
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

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "40px minmax(0, 1fr) auto auto",
                alignItems: "center",
                gap: 1.5,
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
                onChange={(next) => void patch(next)}
            />
            {editing ? (
                <TextField
                    size="small"
                    value={name}
                    autoFocus
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") void save();
                        if (e.key === "Escape") {
                            setEditing(false);
                            setName(folder.name);
                        }
                    }}
                    slotProps={{ htmlInput: { maxLength: 100, style: { fontSize: 15 } } }}
                />
            ) : (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: "15px", fontWeight: 600, color: "#111" }}>
                        {folder.name}
                    </Typography>
                    <ScopeChip shared={shared} />
                </Stack>
            )}
            {/* 메일 수 · 스토리지 사용량 — 오른쪽 컬럼 */}
            <Typography noWrap sx={{ fontSize: "13.5px", color: "#475569", textAlign: "right" }}>
                {folder.message_count ?? 0}통 · {formatBytes(folder.total_size ?? 0)}
            </Typography>
            <Stack direction="row" spacing={0.25} alignItems="center">
                {editing ? (
                    <>
                        <Tooltip title="저장">
                            <span>
                                <IconButton size="small" onClick={() => void save()} disabled={busy} aria-label="저장">
                                    <CheckIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="취소">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setEditing(false);
                                    setName(folder.name);
                                }}
                                aria-label="취소"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <>
                        <Tooltip
                            title={canManage ? "이름 변경" : "공용 메일함은 관리자 또는 만든 사람만 수정할 수 있습니다"}
                        >
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={() => setEditing(true)}
                                    aria-label="이름 변경"
                                    disabled={!canManage}
                                >
                                    <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip
                            title={canManage ? "삭제" : "공용 메일함은 관리자 또는 만든 사람만 삭제할 수 있습니다"}
                        >
                            <span>
                                <IconButton size="small" onClick={remove} aria-label="삭제" disabled={!canManage}>
                                    <TrashIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </>
                )}
            </Stack>
        </Box>
    );
}

/** 메일함 목록 */
export function MailFoldersList({ folders, onChanged }: { folders: MailUserFolder[]; onChanged: () => void }) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            {folders.length === 0 ? (
                <Typography sx={{ fontSize: "15px", color: "#111", py: 2, textAlign: "center" }}>
                    만든 메일함이 없습니다. 아래 [만들기]로 만드세요.
                </Typography>
            ) : null}
            {folders.map((folder) => (
                <FolderRow key={folder.seq} folder={folder} onChanged={onChanged} />
            ))}
        </Box>
    );
}

/** 메일함 추가 다이얼로그 — [아이콘][이름] + 공용 스위치(액션바) */
export function MailFolderAddDialog({
    open,
    onClose,
    onChanged,
}: {
    open: boolean; // 열림
    onClose: () => void; // 닫기
    onChanged: () => void; // 추가 후(목록 재조회)
}) {
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const [newName, setNewName] = useState("");
    const [newShared, setNewShared] = useState(false);
    const [newIcon, setNewIcon] = useState("");
    const [newColor, setNewColor] = useState("");
    const [busy, setBusy] = useState(false);
    const add = useCallback(async () => {
        const name = newName.trim();
        if (!name) return;
        setBusy(true);
        try {
            unwrap(
                await mailApi.createFolder({
                    name,
                    scope: newShared ? "shared" : "personal",
                    icon: newIcon,
                    color: newColor,
                }),
                "메일함을 추가하지 못했습니다."
            );
            SuccessAlert("메일함을 추가했습니다.");
            setNewName("");
            setNewShared(false);
            setNewIcon("");
            setNewColor("");
            onClose();
            onChanged();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "메일함을 추가하지 못했습니다." });
        } finally {
            setBusy(false);
        }
    }, [newName, newShared, newIcon, newColor, onChanged]);

    return (
        <FormDialog
            fontScaleKey="MailFolderAddDialog"
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            open={open}
            onClose={onClose}
            title={{ text: "메일함 추가" }}
            titleIcons={{ delete: { visible: false } }}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="xs"
            scrollPastLastSection={false}
            contentBottomPadding={24}
            sections={[
                {
                    id: "mail-folder-add",
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
                                        icon={newIcon}
                                        color={newColor}
                                        shared={newShared}
                                        onChange={(next) => {
                                            if (next.icon !== undefined) setNewIcon(next.icon);
                                            if (next.color !== undefined) setNewColor(next.color);
                                        }}
                                    />
                                </Box>
                                <TextField
                                    label="메일함 이름"
                                    size="medium"
                                    fullWidth
                                    autoFocus
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") void add();
                                    }}
                                    slotProps={{ htmlInput: { maxLength: 100, style: { fontSize: 15 } } }}
                                />
                            </Box>
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
                left: (
                    <FormControlLabel
                        control={<Switch checked={newShared} onChange={(_, v) => setNewShared(v)} />}
                        label="공용 메일함"
                        sx={{ ml: 0 }}
                    />
                ),
                right: (
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={onClose} disabled={busy}>
                            취소
                        </Button>
                        <Button variant="contained" onClick={() => void add()} disabled={busy || !newName.trim()}>
                            저장
                        </Button>
                    </Stack>
                ),
            }}
        />
    );
}
