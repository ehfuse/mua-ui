/**
 * 색상 라벨 관리(0.3.158) — 관리 창의 "라벨" 목록(이름 · 색 · 순서 · 지우기)과 라벨 만들기/고치기 창.
 * 라벨은 사람마다라 공용/개인 구분이 없다. 지우면 그 라벨을 단 메일에서도 떨어진다(메일은 그대로).
 */

import { useCallback, useEffect, useState } from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckIcon from "@mui/icons-material/Check";
import { ConfirmDialog, ErrorAlert, SuccessAlert } from "@ehfuse/alerts";
import { ClearTextField } from "@ehfuse/mui-form-controls";
import { mailApi, unwrap } from "../../apis/mailApi";
import { TrashIcon } from "../../internal/icons";
import { Tooltip } from "../../internal/Tooltip";
import { useIsMobile } from "../../internal/useIsMobile";
import { useDialogBackClose } from "../../internal/useDialogBackClose";
import { MOBILE_FULL_WIDTH_ACTIONS_SX } from "../../internal/mobileActionsSx";
import { useMuaFormDialog } from "../../MuaProvider";
import type { MailLabel } from "../../models/types";
import { LABEL_COLORS, MailLabelChip, labelColor, labelTextColor } from "../components/MailLabels";

/** 오류 문구 */
const messageOf = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

/** 라벨 한 줄 — [칩][↑↓][✎][🗑] */
function LabelRow({
    label,
    first,
    last,
    onEdit,
    onMove,
    onDelete,
}: {
    label: MailLabel;
    first: boolean;
    last: boolean;
    onEdit: () => void;
    onMove: (dir: -1 | 1) => void;
    onDelete: () => void;
}) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1.25,
                border: "1px solid #e2e8f0",
                borderRadius: 1.5,
                bgcolor: "#fff",
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
                <MailLabelChip label={label} maxWidth={360} />
            </Box>
            <Stack direction="row" spacing={0.25} alignItems="center">
                <Tooltip title="위로">
                    <span>
                        <IconButton size="small" aria-label="위로" disabled={first} onClick={() => onMove(-1)}>
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="아래로">
                    <span>
                        <IconButton size="small" aria-label="아래로" disabled={last} onClick={() => onMove(1)}>
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="수정">
                    <IconButton size="small" aria-label="수정" onClick={onEdit}>
                        <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="삭제">
                    <IconButton size="small" aria-label="삭제" onClick={onDelete}>
                        <TrashIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Box>
    );
}

/** 라벨 목록(관리 창 본문) — 바뀌면 onChanged(items) 로 새 목록을 알린다. */
export function MailLabelsList({ labels, onChanged }: { labels: MailLabel[]; onChanged: (items?: MailLabel[]) => void }) {
    const [editing, setEditing] = useState<MailLabel | null>(null);
    const move = useCallback(
        async (index: number, dir: -1 | 1) => {
            const next = [...labels];
            const [item] = next.splice(index, 1);
            next.splice(index + dir, 0, item);
            try {
                const res = unwrap(await mailApi.reorderLabels(next.map((l) => l.seq)), "순서를 저장하지 못했습니다.");
                onChanged(res.items);
            } catch (error) {
                ErrorAlert({ message: messageOf(error, "순서를 저장하지 못했습니다.") });
            }
        },
        [labels, onChanged]
    );
    const remove = useCallback(
        (label: MailLabel) =>
            ConfirmDialog({
                title: "라벨 삭제",
                message: `"${label.name}" 라벨을 삭제합니다. 이 라벨을 단 메일에서도 떨어집니다(메일은 지워지지 않습니다).`,
                onConfirm: () =>
                    void (async () => {
                        try {
                            unwrap(await mailApi.deleteLabel(label.seq), "라벨을 삭제하지 못했습니다.");
                            SuccessAlert("라벨을 삭제했습니다.");
                            onChanged();
                        } catch (error) {
                            ErrorAlert({ message: messageOf(error, "라벨을 삭제하지 못했습니다.") });
                        }
                    })(),
            }),
        [onChanged]
    );
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            {labels.length === 0 ? (
                <Typography sx={{ fontSize: "15px", color: "#111", py: 2, textAlign: "center" }}>
                    만든 라벨이 없습니다. 아래 [라벨 만들기]로 만드세요.
                </Typography>
            ) : null}
            {labels.map((label, index) => (
                <LabelRow
                    key={label.seq}
                    label={label}
                    first={index === 0}
                    last={index === labels.length - 1}
                    onEdit={() => setEditing(label)}
                    onMove={(dir) => void move(index, dir)}
                    onDelete={() => remove(label)}
                />
            ))}
            <MailLabelFormDialog open={Boolean(editing)} label={editing} onClose={() => setEditing(null)} onSaved={() => onChanged()} />
        </Box>
    );
}

/** 색 견본 9칸 — 고른 칸은 체크 표시. */
function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
    return (
        <Box role="radiogroup" aria-label="라벨 색" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {LABEL_COLORS.map((c) => {
                const selected = value.toLowerCase() === c.color;
                return (
                    <Tooltip key={c.color} title={c.name}>
                        <Box
                            component="button"
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={c.name}
                            onClick={() => onChange(c.color)}
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                border: 0,
                                p: 0,
                                cursor: "pointer",
                                bgcolor: c.color,
                                color: labelTextColor(c.color),
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                outline: selected ? `2px solid ${c.color}` : "none",
                                outlineOffset: 2,
                            }}
                        >
                            {selected ? <CheckIcon sx={{ fontSize: 20 }} /> : null}
                        </Box>
                    </Tooltip>
                );
            })}
        </Box>
    );
}

/** 라벨 만들기/고치기 창 — label 이 있으면 고치기. 저장하면 onSaved(저장한 라벨). */
export function MailLabelFormDialog({
    open,
    label,
    onClose,
    onSaved,
}: {
    open: boolean;
    label?: MailLabel | null;
    onClose: () => void;
    onSaved: (label: MailLabel) => void;
}) {
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const { requestClose } = useDialogBackClose({ open, onClose, modalId: label ? "mail-label-edit-dialog" : "mail-label-form-dialog" });
    const isEdit = Boolean(label && label.seq > 0);
    const [name, setName] = useState("");
    const [color, setColor] = useState(LABEL_COLORS[5].color);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (!open) return;
        setName(label?.name ?? "");
        setColor(label ? labelColor(label) : LABEL_COLORS[5].color);
    }, [open, label]);

    const save = useCallback(async () => {
        const next = name.trim();
        if (!next || busy) return;
        setBusy(true);
        try {
            const saved =
                isEdit && label
                    ? unwrap(await mailApi.updateLabel(label.seq, { name: next, color }), "라벨을 저장하지 못했습니다.")
                    : unwrap(await mailApi.createLabel({ name: next, color }), "라벨을 만들지 못했습니다.");
            onClose();
            onSaved(saved);
        } catch (error) {
            ErrorAlert({ message: messageOf(error, "라벨을 저장하지 못했습니다.") });
        } finally {
            setBusy(false);
        }
    }, [name, color, busy, isEdit, label, onClose, onSaved]);

    const preview: MailLabel = { seq: 0, name: name.trim() || "라벨", color, sort_no: 0 };
    const cancelButton = (
        <Button variant="outlined" onClick={requestClose} disabled={busy} sx={isMobile ? { flex: 1, minWidth: 0 } : undefined}>
            취소
        </Button>
    );
    const saveButton = (
        <Button variant="contained" onClick={() => void save()} disabled={busy || !name.trim()} sx={isMobile ? { flex: 1, minWidth: 0 } : undefined}>
            저장
        </Button>
    );
    return (
        <FormDialog
            fontScaleKey="MailLabelFormDialog"
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            sx={isMobile ? MOBILE_FULL_WIDTH_ACTIONS_SX : undefined}
            open={open}
            onClose={requestClose}
            title={{ text: isEdit ? "라벨 수정" : "새 라벨" }}
            titleIcons={{ delete: { visible: false } }}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="xs"
            scrollPastLastSection={false}
            contentBottomPadding={24}
            sections={[
                {
                    id: "mail-label-form",
                    showTitle: false,
                    children: (
                        <Box sx={{ display: "grid", gap: 2, width: "100%" }}>
                            <ClearTextField
                                label="라벨 이름"
                                size="medium"
                                fullWidth
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") void save();
                                }}
                                slotProps={{ htmlInput: { maxLength: 50, style: { fontSize: 15 } } }}
                            />
                            <ColorSwatches value={color} onChange={setColor} />
                            {/* 고른 색 · 이름이 목록 칩으로 어떻게 보이는지 */}
                            <Box sx={{ display: "flex" }}>
                                <MailLabelChip label={preview} maxWidth={300} />
                            </Box>
                        </Box>
                    ),
                },
            ]}
            actions={{
                visible: true,
                showCancelButton: false,
                ...(isMobile
                    ? {
                          left: (
                              <Stack direction="row" sx={{ width: "100%", gap: 1.5 }}>
                                  {cancelButton}
                                  {saveButton}
                              </Stack>
                          ),
                      }
                    : {
                          right: (
                              <Stack direction="row" spacing={1}>
                                  {cancelButton}
                                  {saveButton}
                              </Stack>
                          ),
                      }),
            }}
        />
    );
}
