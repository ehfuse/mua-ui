/**
 * 사용자 메일함 관리(mfd) — 목록(이름 인라인 수정·삭제) + [메일함 추가]. 삭제하면 그 메일함의 메일은 받은편지함으로 돌아간다.
 */

import { useCallback, useState } from "react";
import { Box, Button, IconButton, Stack, TextField, Typography } from "@mui/material";
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
                <Typography noWrap sx={{ fontSize: "15px", fontWeight: 600, color: "#111" }}>
                    {folder.name}
                </Typography>
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
                        <Tooltip title="이름 변경">
                            <IconButton size="small" onClick={() => setEditing(true)} aria-label="이름 변경">
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                            <IconButton size="small" onClick={remove} aria-label="삭제">
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
    const [busy, setBusy] = useState(false);
    const add = useCallback(async () => {
        const name = newName.trim();
        if (!name) return;
        setBusy(true);
        try {
            unwrap(await mailApi.createFolder({ name }), "메일함을 추가하지 못했습니다.");
            SuccessAlert("메일함을 추가했습니다.");
            setNewName("");
            onChanged();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "메일함을 추가하지 못했습니다." });
        } finally {
            setBusy(false);
        }
    }, [newName, onChanged]);
    return (
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
                            {/* 메일함 추가 — 항상 상단에 */}
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="새 메일함 이름"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") void add();
                                    }}
                                    slotProps={{ htmlInput: { maxLength: 100, style: { fontSize: 15 } } }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => void add()}
                                    disabled={busy || !newName.trim()}
                                    sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
                                >
                                    추가
                                </Button>
                            </Box>
                            {folders.length === 0 ? (
                                <Typography sx={{ fontSize: "15px", color: "#111", py: 2, textAlign: "center" }}>
                                    만든 메일함이 없습니다. 위에서 이름을 입력해 추가하세요.
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
                right: (
                    <Button variant="outlined" onClick={onClose} sx={{ minWidth: 80 }}>
                        닫기
                    </Button>
                ),
            }}
        />
    );
}
