/**
 * 사용자 메일함 관리(mfd) — 목록(이름 인라인 수정·삭제) + [메일함 추가]. 삭제하면 그 메일함의 메일은 받은편지함으로 돌아간다.
 */

import { useCallback, useState } from "react";
import { Box, Button, FormControlLabel, IconButton, Stack, Switch, TextField, Typography } from "@mui/material";
import { formatBytes } from "../../utils/format";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import { ConfirmDialog, ErrorAlert, SuccessAlert } from "@ehfuse/alerts";
import { mailApi, unwrap } from "../../apis/mailApi";
import { TrashIcon } from "../../internal/icons";
import { Tooltip } from "../../internal/Tooltip";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaFormDialog } from "../../MuaProvider";
import type { MailUserFolder } from "../../models/types";

interface MailFoldersManageDialogProps {
    open: boolean; // 열림
    folders: MailUserFolder[]; // 메일함 목록
    onClose: () => void; // 닫기
    onChanged: () => void; // 추가/수정/삭제 후(목록 재조회)
}

/** 메일함 한 줄 — 이름 인라인 수정 */
function FolderRow({ folder, onChanged }: { folder: MailUserFolder; onChanged: () => void }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(folder.name);
    const canManage = folder.can_manage !== false;
    const [busy, setBusy] = useState(false);
    const save = useCallback(async () => {
        const next = name.trim();
        if (!next || next === folder.name) {
            setEditing(false);
            setName(folder.name);
            return;
        }
        setBusy(true);
        try {
            unwrap(await mailApi.updateFolder(folder.seq, { name: next }), "메일함을 저장하지 못했습니다.");
            setEditing(false);
            onChanged();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "메일함을 저장하지 못했습니다." });
        } finally {
            setBusy(false);
        }
    }, [name, folder, onChanged]);
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
                gridTemplateColumns: "28px minmax(0, 1fr) auto",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.25,
                border: "1px solid #e2e8f0",
                borderRadius: 1.5,
                bgcolor: "#fff",
            }}
        >
            <FolderOutlinedIcon sx={{ color: "#475569" }} />
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
                <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: "15px", fontWeight: 600, color: "#111" }}>
                            {folder.name}
                        </Typography>
                        <Box
                            component="span"
                            sx={{
                                px: 0.75,
                                py: 0.2,
                                borderRadius: "4px",
                                fontSize: "12.5px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                color: folder.scope === "shared" ? "#1d4ed8" : "#334155",
                                bgcolor: folder.scope === "shared" ? "#eff6ff" : "#f1f5f9",
                            }}
                        >
                            {folder.scope === "shared" ? "공용" : "개인"}
                        </Box>
                    </Stack>
                    {/* 메일 수 · 스토리지 사용량 */}
                    <Typography noWrap sx={{ fontSize: "13.5px", color: "#475569", mt: 0.25 }}>
                        메일 {folder.message_count ?? 0}통 · {formatBytes(folder.total_size ?? 0)}
                    </Typography>
                </Box>
            )}
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
                            <IconButton
                                size="small"
                                onClick={() => setEditing(true)}
                                aria-label="이름 변경"
                                disabled={!canManage}
                            >
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip
                            title={canManage ? "삭제" : "공용 메일함은 관리자 또는 만든 사람만 삭제할 수 있습니다"}
                        >
                            <IconButton size="small" onClick={remove} aria-label="삭제" disabled={!canManage}>
                                <TrashIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </Stack>
        </Box>
    );
}

/** 메일함 관리 다이얼로그 */
export function MailFoldersManageDialog({ open, folders, onClose, onChanged }: MailFoldersManageDialogProps) {
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const [newName, setNewName] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [newShared, setNewShared] = useState(false);
    const [busy, setBusy] = useState(false);
    const add = useCallback(async () => {
        const name = newName.trim();
        if (!name) return;
        setBusy(true);
        try {
            unwrap(
                await mailApi.createFolder({ name, scope: newShared ? "shared" : "personal" }),
                "메일함을 추가하지 못했습니다."
            );
            SuccessAlert("메일함을 추가했습니다.");
            setNewName("");
            setNewShared(false);
            setAddOpen(false);
            onChanged();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "메일함을 추가하지 못했습니다." });
        } finally {
            setBusy(false);
        }
    }, [newName, onChanged]);
    return (
        <>
            <FormDialog
                fontScaleKey="MailFoldersManageDialog"
                fullScreen={isMobile}
                mobilePresentation={isMobile ? "slide" : "dialog"}
                open={open}
                onClose={onClose}
                title={{ text: "메일함 관리" }}
                titleIcons={{ delete: { visible: false } }}
                tabs={{ visible: false }}
                locale="ko"
                maxWidth="sm"
                scrollPastLastSection={false}
                contentBottomPadding={24}
                sections={[
                    {
                        id: "mail-folders-list",
                        showTitle: false,
                        children: (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
                                {folders.length === 0 ? (
                                    <Typography sx={{ fontSize: "15px", color: "#111", py: 2, textAlign: "center" }}>
                                        만든 메일함이 없습니다.
                                    </Typography>
                                ) : null}
                                {folders.map((folder) => (
                                    <FolderRow key={folder.seq} folder={folder} onChanged={onChanged} />
                                ))}
                            </Box>
                        ),
                    },
                ]}
                actions={{
                    visible: true,
                    showCancelButton: false,
                    left: (
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setAddOpen(true)}
                            sx={{ color: "#111", borderColor: "#cbd5e1" }}
                        >
                            만들기
                        </Button>
                    ),
                    right: (
                        <Button variant="contained" onClick={onClose} sx={{ minWidth: 80 }}>
                            닫기
                        </Button>
                    ),
                }}
            />
            {/* 메일함 추가 — 이름 입력 mfd(관리 다이얼로그 위에 겹친다) */}
            <FormDialog
                fontScaleKey="MailFolderAddDialog"
                fullScreen={isMobile}
                mobilePresentation={isMobile ? "slide" : "dialog"}
                open={addOpen}
                onClose={() => setAddOpen(false)}
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
                                    공용 메일함은 같은 회사 전원이 보고 메일을 넣을 수 있습니다. 수정·삭제는 관리자 또는
                                    만든 사람만 할 수 있습니다.
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
                            <Button variant="outlined" onClick={() => setAddOpen(false)} disabled={busy}>
                                취소
                            </Button>
                            <Button variant="contained" onClick={() => void add()} disabled={busy || !newName.trim()}>
                                저장
                            </Button>
                        </Stack>
                    ),
                }}
            />
        </>
    );
}
