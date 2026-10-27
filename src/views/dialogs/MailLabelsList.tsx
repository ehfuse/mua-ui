import { formDialogLocale, t } from "../../i18n";
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
import { useMuaFormDialog } from "../../MuaProvider";
import type { MailLabel } from "../../models/types";
import { LABEL_COLORS, MailLabelChip, labelColor, labelTextColor } from "../components/MailLabels";

/**
 * 라벨 저장 API — 메일 라벨(기본)과 주소록 라벨(2026-10-27, 따로 둔다)이 같은 관리 · 만들기 창을 쓴다.
 * modalKey 는 기기 뒤로가기 칸 이름 — 두 화면이 함께 떠 있어도 겹치지 않게 다르게 준다.
 */
export interface LabelApi {
    create: typeof mailApi.createLabel;
    update: typeof mailApi.updateLabel;
    reorder: typeof mailApi.reorderLabels;
    remove: typeof mailApi.deleteLabel;
    modalKey: string;
}
export const mailLabelApi: LabelApi = {
    create: mailApi.createLabel,
    update: mailApi.updateLabel,
    reorder: mailApi.reorderLabels,
    remove: mailApi.deleteLabel,
    modalKey: "mail-label",
};
export const contactLabelApi: LabelApi = {
    create: mailApi.createContactLabel,
    update: mailApi.updateContactLabel,
    reorder: mailApi.reorderContactLabels,
    remove: mailApi.deleteContactLabel,
    modalKey: "contact-label",
};

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
                <Tooltip title={t("moveUp")}>
                    <span>
                        <IconButton size="small" aria-label={t("moveUp")} disabled={first} onClick={() => onMove(-1)}>
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={t("moveDown")}>
                    <span>
                        <IconButton size="small" aria-label={t("moveDown")} disabled={last} onClick={() => onMove(1)}>
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={t("edit")}>
                    <IconButton size="small" aria-label={t("edit")} onClick={onEdit}>
                        <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t("delete")}>
                    <IconButton size="small" aria-label={t("delete")} onClick={onDelete}>
                        <TrashIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Box>
    );
}

/** 라벨 목록(관리 창 본문) — 바뀌면 onChanged(items) 로 새 목록을 알린다. */
export function MailLabelsList({
    labels,
    onChanged,
    api = mailLabelApi,
}: {
    labels: MailLabel[];
    onChanged: (items?: MailLabel[]) => void;
    api?: LabelApi;
}) {
    const [editing, setEditing] = useState<MailLabel | null>(null);
    const move = useCallback(
        async (index: number, dir: -1 | 1) => {
            const next = [...labels];
            const [item] = next.splice(index, 1);
            next.splice(index + dir, 0, item);
            try {
                const res = unwrap(await api.reorder(next.map((l) => l.seq)), t("reorderFailed"));
                onChanged(res.items);
            } catch (error) {
                ErrorAlert({ message: messageOf(error, t("reorderFailed")) });
            }
        },
        [labels, onChanged, api]
    );
    const remove = useCallback(
        (label: MailLabel) =>
            ConfirmDialog({
                title: t("deleteLabel"),
                message: t("deleteLabelConfirm", { name: label.name }),
                onConfirm: () =>
                    void (async () => {
                        try {
                            unwrap(await api.remove(label.seq), t("labelDeleteFailed"));
                            SuccessAlert(t("labelDeleted"));
                            onChanged();
                        } catch (error) {
                            ErrorAlert({ message: messageOf(error, t("labelDeleteFailed")) });
                        }
                    })(),
            }),
        [onChanged, api]
    );
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            {labels.length === 0 ? (
                <Typography sx={{ fontSize: "15px", color: "#111", py: 2, textAlign: "center" }}>
                    {t("noLabels")}
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
            <MailLabelFormDialog open={Boolean(editing)} label={editing} api={api} onClose={() => setEditing(null)} onSaved={() => onChanged()} />
        </Box>
    );
}

/** 색 견본 9칸 — 고른 칸은 체크 표시. */
function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
    return (
        <Box role="radiogroup" aria-label={t("labelColor")} sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
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
    api = mailLabelApi,
}: {
    open: boolean;
    label?: MailLabel | null;
    onClose: () => void;
    onSaved: (label: MailLabel) => void;
    api?: LabelApi;
}) {
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const { requestClose } = useDialogBackClose({ open, onClose, modalId: `${api.modalKey}-${label ? "edit" : "form"}-dialog` });
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
                    ? unwrap(await api.update(label.seq, { name: next, color }), t("labelSaveFailed"))
                    : unwrap(await api.create({ name: next, color }), t("labelCreateFailed"));
            onClose();
            onSaved(saved);
        } catch (error) {
            ErrorAlert({ message: messageOf(error, t("labelSaveFailed")) });
        } finally {
            setBusy(false);
        }
    }, [name, color, busy, isEdit, label, onClose, onSaved, api]);

    const preview: MailLabel = { seq: 0, name: name.trim() || t("label"), color, sort_no: 0 };
    const saveButton = (
        <Button variant="contained" onClick={() => void save()} disabled={busy || !name.trim()}>
            {t("save")}
        </Button>
    );
    return (
        <FormDialog
            fontScaleKey="MailLabelFormDialog"
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            open={open}
            onClose={requestClose}
            title={{ text: isEdit ? t("editLabel") : t("newLabel") }}
            titleIcons={{ delete: { visible: false } }}
            tabs={{ visible: false }}
            locale={formDialogLocale()}
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
                                label={t("labelName")}
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
                        </Box>
                    ),
                },
            ]}
            actions={{
                visible: true,
                // 취소는 mfd 기본 단추를 쓴다(2026-10-16). 고른 색 · 이름이 목록 칩으로 어떻게 보이는지는 액션바 왼쪽에 —
                // 본문에 따로 줄을 두면 창이 그만큼 길어진다.
                showCancelButton: true,
                left: <MailLabelChip label={preview} maxWidth={isMobile ? 140 : 220} />,
                right: saveButton,
            }}
        />
    );
}
