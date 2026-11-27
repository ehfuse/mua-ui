import { formDialogLocale, t } from "../../i18n";
/**
 * 규칙 등록/수정(mfd) — 이름 · 조건(대상/비교/값, 여러 개 + 모두/하나라도) · 동작(이동/읽음/중요) · 사용 · 뒤 규칙 중단.
 * 폼은 로컬 상태로 다룬다(조건 배열 편집이 잦아 forma 바인딩보다 단순하다).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";
import { ConfirmDialog, ErrorAlert, SuccessAlert, WarningAlert } from "@ehfuse/alerts";
import { mailApi, unwrap } from "../../apis/mailApi";
import { OptionToggleGroup } from "../../internal/OptionToggleGroup";
import { useIsMobile } from "../../internal/useIsMobile";
import { useDialogBackClose } from "../../internal/useDialogBackClose";
import { MOBILE_FULL_WIDTH_ACTIONS_SX } from "../../internal/mobileActionsSx";
import { MailFolderFormDialog } from "./MailFoldersList";
import { MailLabelFormDialog } from "./MailLabelsList";
import { LabelCheckIcon, MailLabelChip, MailLabelDot, labelColor } from "../components/MailLabels";
import { useMuaFormDialog } from "../../MuaProvider";
import { defaultMailRuleForm } from "../../models/defaults";
import type {
    MailRule,
    MailRuleCondition,
    MailRuleForm,
    MailRuleFormPrefill,
    MailLabel,
    MailRuleRequest,
    MailUserFolder,
} from "../../models/types";

interface MailRuleFormDialogProps {
    open: boolean; // 열림
    rule: MailRule | null; // 수정 대상(null = 신규)
    prefill?: MailRuleFormPrefill | null; // 신규 미리 채움(우클릭 "규칙 만들기", hints=보낸 사람 후보)
    folders: MailUserFolder[]; // 사용자 메일함(이동 대상)
    labels?: MailLabel[]; // 붙일 수 있는 라벨(조직 · 개인) — 주지 않으면 라벨 칸을 두지 않는다(라벨을 끈 앱). 빈 목록이면 칸은 두고 [라벨 만들기]만
    onFoldersChanged?: () => void; // 이동 고르기에서 새 메일함을 만든 뒤(앱의 메일함 목록 다시 읽기)
    onLabelsChanged?: () => void; // 라벨 고르기에서 새 라벨을 만든 뒤(앱의 라벨 목록 다시 읽기)
    onClose: () => void; // 닫기
    onSaved: () => void; // 저장/삭제 후(목록 재조회)
}

const FIELD_OPTIONS: { value: MailRuleCondition["field"]; label: string }[] = [
    { value: "from", get label() { return t("from"); } },
    { value: "to", get label() { return t("to"); } },
    { value: "subject", get label() { return t("subject"); } },
    { value: "body", get label() { return t("body"); } },
];
const OP_OPTIONS: { value: MailRuleCondition["op"]; label: string }[] = [
    { value: "contains", get label() { return t("contains"); } },
    { value: "not_contains", get label() { return t("notContains"); } },
    { value: "equals", get label() { return t("equals"); } },
    { value: "starts", get label() { return t("startsWith"); } },
    { value: "ends", get label() { return t("endsWith"); } },
];

/** 규칙 → 폼 */
function toForm(rule: MailRule): MailRuleForm {
    return {
        seq: rule.seq,
        name: rule.name ?? "",
        enabled: rule.enabled !== false,
        match: rule.match === "any" ? "any" : "all",
        stop_processing: Boolean(rule.stop_processing),
        conditions:
            rule.conditions.length > 0
                ? rule.conditions.map((c) => ({ ...c }))
                : [{ field: "from", op: "contains", value: "" }],
        move_to: rule.actions.move_to ?? "",
        mail_folder_seq: rule.actions.mail_folder_seq ?? 0,
        mark_read: Boolean(rule.actions.mark_read),
        star: Boolean(rule.actions.star),
        label_seqs: Array.isArray(rule.actions.label_seqs) ? rule.actions.label_seqs.filter((seq) => seq > 0) : [],
    };
}

/** 폼 → 요청 */
function toRequest(values: MailRuleForm): MailRuleRequest {
    return {
        name: values.name.trim(),
        enabled: values.enabled,
        match: values.match,
        stop_processing: values.stop_processing,
        conditions: values.conditions.map((c) => ({ ...c, value: c.value.trim() })).filter((c) => c.value),
        actions: {
            ...(values.move_to ? { move_to: values.move_to } : {}),
            ...(values.move_to === "custom" ? { mail_folder_seq: values.mail_folder_seq } : {}),
            ...(values.mark_read ? { mark_read: true } : {}),
            ...(values.star ? { star: true } : {}),
            ...(values.label_seqs.length > 0 ? { label_seqs: values.label_seqs } : {}),
        },
    };
}

const INPUT_SX = { "& .MuiInputBase-input": { fontSize: 15 } };
/** 이동 고르기의 [새 메일함 만들기] 항목 값 — 고르면 값은 그대로 두고 메일함 추가 창을 연다. */
const NEW_FOLDER_VALUE = "__new_folder__";
/** 라벨 고르기의 [라벨 만들기] 항목 값 — 고르면 값은 그대로 두고 라벨 만들기 창을 연다. */
const NEW_LABEL_VALUE = "__new_label__";

/** 규칙 폼 다이얼로그 */
export function MailRuleFormDialog({ open, rule, prefill, folders: folderProp, labels: labelProp, onFoldersChanged, onLabelsChanged, onClose, onSaved }: MailRuleFormDialogProps) {
    const isMobile = useIsMobile();
    // 기기 뒤로가기로 닫힌다 — 취소/← 도 같은 경로로 닫아 히스토리 칸을 소비한다.
    const { requestClose } = useDialogBackClose({ open, onClose, modalId: "mail-rule-form-dialog" });
    const FormDialog = useMuaFormDialog();
    const [values, setValues] = useState<MailRuleForm>(defaultMailRuleForm);
    // 이동 고르기의 [새 메일함 만들기](2026-11-26 사용자 지시) — 만든 메일함은 앱 목록이 다시 읽혀 올 때까지 여기서 붙여 보인다.
    const [folderFormOpen, setFolderFormOpen] = useState(false);
    const [createdFolders, setCreatedFolders] = useState<MailUserFolder[]>([]);
    const folders = [...folderProp, ...createdFolders.filter((c) => !folderProp.some((f) => f.seq === c.seq))];
    // 라벨 고르기의 [라벨 만들기](0.4.110 — 2026-11-27 사용자 지시 "여기서 라벨 만들 수도 있게") — 메일함 만들기와 같은 방식.
    // 만든 라벨은 앱 목록이 다시 읽혀 올 때까지 여기서 붙여 보이고, 바로 고른 상태로 둔다.
    const [labelFormOpen, setLabelFormOpen] = useState(false);
    const [createdLabels, setCreatedLabels] = useState<MailLabel[]>([]);
    const labels = useMemo(() => {
        const base = labelProp ?? [];
        return [...base, ...createdLabels.filter((c) => !base.some((l) => l.seq === c.seq))];
    }, [labelProp, createdLabels]);
    const [busy, setBusy] = useState(false);
    const [applyNow, setApplyNow] = useState(false); // 저장 후 받은편지함의 기존 메일에도 바로 적용
    const [fromMenu, setFromMenu] = useState<{ index: number; anchor: HTMLElement } | null>(null); // 보낸 사람 후보 메뉴
    // hints(보낸 사람 후보)는 폼 값이 아니므로 분리
    const { hints, ...prefillValues } = prefill ?? {};
    const fromOptions = [hints?.from_address, hints?.from_name]
        .map((v) => (v ?? "").trim())
        .filter((v, i, arr) => v && arr.indexOf(v) === i);
    /** 대상별 미리 채울 값(우클릭으로 만들 때) — 보낸 사람=이름(없으면 주소), 제목=제목, 받는 사람=첫 수신자 주소 */
    const hintValue = useCallback(
        (field: MailRuleCondition["field"]): string => {
            if (field === "from") return (hints?.from_name || hints?.from_address || "").trim();
            if (field === "subject") return (hints?.subject ?? "").trim();
            if (field === "to") return (hints?.to ?? "").trim();
            return "";
        },
        [hints?.from_name, hints?.from_address, hints?.subject, hints?.to]
    );
    /** [조건 추가] — 보낸 사람 → 제목 → 받는 사람 순으로 아직 없는 대상을 고르고 값을 미리 채운다 */
    const addCondition = useCallback(() => {
        setValues((prev) => {
            const has = (f: MailRuleCondition["field"]) => prev.conditions.some((c) => c.field === f);
            // 보낸 사람 → 제목 → 받는 사람 순
            const field: MailRuleCondition["field"] = !has("from") ? "from" : !has("subject") ? "subject" : "to";
            return { ...prev, conditions: [...prev.conditions, { field, op: "contains", value: hintValue(field) }] };
        });
    }, [hintValue]);
    useEffect(() => {
        if (!open) return;
        setApplyNow(false);
        setValues(
            rule
                ? toForm(rule)
                : {
                      ...defaultMailRuleForm,
                      // 기본 조건 없음 — [조건 추가]로 넣는다
                      conditions: [],
                      ...(prefillValues ?? {}),
                  }
        );
    }, [open, rule, prefill]); // eslint-disable-line react-hooks/exhaustive-deps
    const patch = useCallback((next: Partial<MailRuleForm>) => setValues((prev) => ({ ...prev, ...next })), []);
    /**
     * 라벨 고르기는 이름별로 하나(2026-11-27 사용자 지적 "KCP 라벨이 왜 3개야?") — 라벨은 개인 한 벌 + 공용 메일함마다 한 벌이라 같은 이름이 여럿이다.
     * 메일 화면의 라벨 탭과 같이 이름(대소문자 · 앞뒤 공백 무시)으로 묶고, 앞의 것(개인 먼저)의 색으로 그린다.
     */
    const labelGroups = useMemo(() => {
        const groups: { key: string; label: MailLabel; seqs: number[] }[] = [];
        for (const label of labels) {
            const key = label.name.trim().toLowerCase();
            const group = groups.find((g) => g.key === key);
            if (group) group.seqs.push(label.seq);
            else groups.push({ key, label, seqs: [label.seq] });
        }
        return groups;
    }, [labels]);
    const pickedLabelNames = labelGroups.filter((g) => g.seqs.some((seq) => values.label_seqs.includes(seq))).map((g) => g.key);
    const patchCondition = useCallback(
        (index: number, next: Partial<MailRuleCondition>) =>
            setValues((prev) => ({
                ...prev,
                conditions: prev.conditions.map((c, i) => (i === index ? { ...c, ...next } : c)),
            })),
        []
    );

    const save = useCallback(async () => {
        const body = toRequest(values);
        if (!body.conditions || body.conditions.length === 0) {
            WarningAlert({ message: t("enterConditionValue") });
            return;
        }
        if (!values.move_to && !values.mark_read && !values.star && values.label_seqs.length === 0) {
            WarningAlert({ message: t("pickAction") });
            return;
        }
        if (values.move_to === "custom" && !(values.mail_folder_seq > 0)) {
            WarningAlert({ message: t("pickMoveFolder") });
            return;
        }
        setBusy(true);
        try {
            let seq = values.seq;
            if (values.seq > 0) unwrap(await mailApi.updateRule(values.seq, body), t("ruleSaveFailed"));
            else seq = unwrap(await mailApi.createRule(body), t("ruleSaveFailed")).seq;
            if (applyNow && seq > 0 && values.enabled) {
                // 저장 직후 받은편지함의 기존 메일에 이 규칙을 적용
                const res = unwrap(await mailApi.applyRules(seq), t("ruleApplyFailed"));
                SuccessAlert(t("ruleSavedApplied", { scanned: res.scanned, affected: res.affected }));
            } else SuccessAlert(t("ruleSaved"));
            onSaved();
            onClose();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : t("ruleSaveFailed") });
        } finally {
            setBusy(false);
        }
    }, [values, applyNow, onSaved, onClose]);

    const remove = useCallback(() => {
        if (!(values.seq > 0)) return;
        ConfirmDialog({
            title: t("deleteRule"),
            message: t("deleteRuleConfirm"),
            onConfirm: () =>
                void (async () => {
                    try {
                        unwrap(await mailApi.deleteRule(values.seq), t("ruleDeleteFailed"));
                        SuccessAlert(t("ruleDeleted"));
                        onSaved();
                        onClose();
                    } catch (error) {
                        ErrorAlert({ message: error instanceof Error ? error.message : t("ruleDeleteFailed") });
                    }
                })(),
        });
    }, [values.seq, onSaved, onClose]);

    return (
        <>
            <FormDialog
                fontScaleKey="MailRuleFormDialog"
                draggable
                fullScreen={isMobile}
                mobilePresentation={isMobile ? "slide" : "dialog"}
                sx={isMobile ? MOBILE_FULL_WIDTH_ACTIONS_SX : undefined}
                open={open}
                onClose={requestClose}
                title={{ text: values.seq > 0 ? t("editRule") : t("createRule") }}
                titleIcons={{ delete: { visible: values.seq > 0 } }}
                onDelete={values.seq > 0 ? remove : undefined}
                tabs={{ visible: false }}
                locale={formDialogLocale()}
                maxWidth="sm"
                scrollPastLastSection={false}
                contentBottomPadding={24}
                sections={[
                    {
                        id: "mail-rule-basic",
                        title: t("basic"),
                        showTitle: true,
                        children: (
                            <Box sx={{ display: "grid", gap: 2, width: "100%" }}>
                                <TextField
                                    label={t("ruleName")}
                                    fullWidth
                                    value={values.name}
                                    onChange={(e) => patch({ name: e.target.value })}
                                    placeholder={t("ruleNamePlaceholder")}
                                    sx={INPUT_SX}
                                />
                                <Stack
                                    direction={isMobile ? "column" : "row"}
                                    spacing={isMobile ? 0.5 : 3}
                                    sx={{ flexWrap: "wrap", alignItems: isMobile ? "flex-start" : "center" }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={values.enabled}
                                                onChange={(_, v) => patch({ enabled: v })}
                                            />
                                        }
                                        label={t("ruleEnabled")}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={values.stop_processing}
                                                onChange={(_, v) => patch({ stop_processing: v })}
                                            />
                                        }
                                        label={t("stopProcessing")}
                                    />
                                </Stack>
                            </Box>
                        ),
                    },
                    {
                        id: "mail-rule-conditions",
                        title: t("conditions"),
                        showTitle: true,
                        children: (
                            <Box sx={{ display: "grid", gap: 1.5, width: "100%" }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <OptionToggleGroup
                                        value={values.match}
                                        onChange={(v) => patch({ match: (v ?? "all") as "all" | "any" })}
                                        options={[
                                            { value: "all", label: t("matchAll") },
                                            { value: "any", label: t("matchAny") },
                                        ]}
                                    />
                                </Stack>
                                {values.conditions.length === 0 ? (
                                    <Typography sx={{ fontSize: "15px", color: "#475569" }}>
                                        {t("noConditions")}
                                    </Typography>
                                ) : null}
                                {values.conditions.map((c, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "1fr 1fr",
                                                sm: "130px 120px minmax(0,1fr) 36px",
                                            },
                                            gap: 1.5,
                                            alignItems: "center",
                                        }}
                                    >
                                        <TextField
                                            select
                                            value={c.field}
                                            onChange={(e) => {
                                                const field = e.target.value as MailRuleCondition["field"];
                                                // 값이 비었거나 이전 대상의 미리 채운 값 그대로면 새 대상의 값으로 바꾼다
                                                const untouched = !c.value.trim() || c.value === hintValue(c.field);
                                                patchCondition(index, {
                                                    field,
                                                    ...(untouched ? { value: hintValue(field) } : {}),
                                                });
                                            }}
                                            sx={INPUT_SX}
                                        >
                                            {FIELD_OPTIONS.map((o) => (
                                                <MenuItem key={o.value} value={o.value} sx={{ fontSize: 15 }}>
                                                    {o.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            select
                                            value={c.op}
                                            onChange={(e) =>
                                                patchCondition(index, { op: e.target.value as MailRuleCondition["op"] })
                                            }
                                            sx={INPUT_SX}
                                        >
                                            {OP_OPTIONS.map((o) => (
                                                <MenuItem key={o.value} value={o.value} sx={{ fontSize: 15 }}>
                                                    {o.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            fullWidth
                                            value={c.value}
                                            placeholder={c.field === "from" ? t("nameOrEmail") : t("word")}
                                            onChange={(e) => patchCondition(index, { value: e.target.value })}
                                            sx={{ ...INPUT_SX, gridColumn: { xs: "1 / span 2", sm: "auto" } }}
                                            slotProps={{
                                                input:
                                                    c.field === "from" && fromOptions.length > 0
                                                        ? {
                                                              // 우클릭으로 만들 때 — ▾ 메뉴에서 주소/이름을 골라 넣는다
                                                              endAdornment: (
                                                                  <InputAdornment position="end">
                                                                      <IconButton
                                                                          size="small"
                                                                          aria-label={t("senderSuggestions")}
                                                                          onClick={(e) =>
                                                                              setFromMenu({
                                                                                  index,
                                                                                  anchor: e.currentTarget,
                                                                              })
                                                                          }
                                                                          edge="end"
                                                                      >
                                                                          <ArrowDropDownIcon />
                                                                      </IconButton>
                                                                  </InputAdornment>
                                                              ),
                                                          }
                                                        : undefined,
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            aria-label={t("removeCondition")}
                                            onClick={() =>
                                                patch({ conditions: values.conditions.filter((_, i) => i !== index) })
                                            }
                                            sx={{ justifySelf: "end" }}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Box>
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={addCondition}
                                        disabled={values.conditions.length >= 20}
                                    >
                                        {t("addCondition")}
                                    </Button>
                                </Box>
                            </Box>
                        ),
                    },
                    {
                        id: "mail-rule-actions",
                        title: t("actions"),
                        showTitle: true,
                        children: (
                            <Box sx={{ display: "grid", gap: 1.5, width: "100%" }}>
                                {/* 1행 [이동 select][라벨 붙이기 select] / 2행 [읽음 스위치][중요 스위치] */}
                                {/* 이동 · 라벨 두 칸은 좌우 끝까지 5:5(2026-11-27 사용자 지시 "select 간격 더 주고 좌우 끝까지 5:5") — 간격은 기본 절과 같은 2. 폰은 한 줄씩. */}
                                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                                <TextField
                                    select
                                    label={t("move")}
                                    value={
                                        values.move_to === "custom"
                                            ? `custom:${values.mail_folder_seq || 0}`
                                            : values.move_to
                                    }
                                    onChange={(e) => {
                                        const v = String(e.target.value);
                                        if (v === NEW_FOLDER_VALUE) {
                                            setFolderFormOpen(true);
                                            return;
                                        }
                                        if (v.startsWith("custom:"))
                                            patch({ move_to: "custom", mail_folder_seq: Number(v.slice(7)) || 0 });
                                        else patch({ move_to: v as MailRuleForm["move_to"], mail_folder_seq: 0 });
                                    }}
                                    sx={{ ...INPUT_SX, minWidth: 0 }}
                                >
                                    <MenuItem value="" sx={{ fontSize: 15 }}>
                                        {t("dontMove")}
                                    </MenuItem>
                                    {/* 사용자 메일함은 각각 항목으로(별도 메일함 선택 없이) */}
                                    {folders.map((f) => (
                                        <MenuItem key={f.seq} value={`custom:${f.seq}`} sx={{ fontSize: 15 }}>
                                            {t("moveToFolderNamed", { name: f.name })}
                                        </MenuItem>
                                    ))}
                                    {values.move_to === "custom" &&
                                    values.mail_folder_seq > 0 &&
                                    !folders.some((f) => f.seq === values.mail_folder_seq) ? (
                                        <MenuItem
                                            value={`custom:${values.mail_folder_seq}`}
                                            sx={{ fontSize: 15 }}
                                            disabled
                                        >
                                            {t("moveToDeletedFolder")}
                                        </MenuItem>
                                    ) : null}
                                    <MenuItem value={NEW_FOLDER_VALUE} sx={{ fontSize: 15, color: "primary.main", gap: 1 }}>
                                        <AddIcon sx={{ fontSize: 20 }} />
                                        {t("createFolderButton")}
                                    </MenuItem>
                                    <MenuItem value="spam" sx={{ fontSize: 15 }}>
                                        {t("moveToSpam")}
                                    </MenuItem>
                                    <MenuItem value="trash" sx={{ fontSize: 15 }}>
                                        {t("moveToTrash")}
                                    </MenuItem>
                                </TextField>
                                {/* 라벨 붙이기(0.4.105 — 2026-11-27 사용자 지적 "라벨붙이기 동작이 안 되네") — 이동 칸과 같은 크기, 여러 개를 고른다. */}
                                {labelProp !== undefined ? (
                                    <TextField
                                        select
                                        label={t("ruleAddLabels")}
                                        value={pickedLabelNames}
                                        onChange={(e) => {
                                            const raw = e.target.value as unknown;
                                            const names = new Set((Array.isArray(raw) ? raw : [raw]).map(String));
                                            if (names.has(NEW_LABEL_VALUE)) {
                                                setLabelFormOpen(true);
                                                return;
                                            }
                                            // 이름 하나를 고르면 그 이름의 라벨(개인 · 공용 메일함마다)을 모두 담는다 — 서버가 메일이 든 메일함에 맞는 것 하나만 단다.
                                            patch({ label_seqs: labelGroups.filter((g) => names.has(g.key)).flatMap((g) => g.seqs) });
                                        }}
                                        slotProps={{
                                            select: {
                                                multiple: true,
                                                displayEmpty: true,
                                                renderValue: (selected) => {
                                                    const keys = selected as string[];
                                                    if (keys.length === 0) return <Box component="span" sx={{ color: "text.secondary" }}>{t("ruleNoLabels")}</Box>;
                                                    return (
                                                        <Box sx={{ display: "flex", gap: 0.5, overflow: "hidden" }}>
                                                            {keys.map((key) => {
                                                                const group = labelGroups.find((g) => g.key === key);
                                                                return group ? <MailLabelChip key={key} label={group.label} maxWidth={100} /> : null;
                                                            })}
                                                        </Box>
                                                    );
                                                },
                                            },
                                            inputLabel: { shrink: true },
                                        }}
                                        sx={{ ...INPUT_SX, minWidth: 0 }}
                                    >
                                        {labelGroups.map(({ key, label }) => (
                                            // 메일 행의 라벨 메뉴(MailLabelMenu)와 같은 꼴 — 라벨 색 체크 · 이름 · 꼬리표.
                                            <MenuItem key={key} value={key} sx={{ fontSize: 15, gap: 1 }}>
                                                <LabelCheckIcon state={pickedLabelNames.includes(key) ? "all" : "none"} color={labelColor(label)} />
                                                <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {label.name}
                                                </Box>
                                                <MailLabelDot color={labelColor(label)} />
                                            </MenuItem>
                                        ))}
                                        <MenuItem value={NEW_LABEL_VALUE} sx={{ fontSize: 15, color: "primary.main", gap: 1 }}>
                                            <AddIcon sx={{ fontSize: 20 }} />
                                            {t("createLabelButton")}
                                        </MenuItem>
                                    </TextField>
                                ) : null}
                                </Box>
                                <Stack
                                    direction={isMobile ? "column" : "row"}
                                    spacing={isMobile ? 0.5 : 3}
                                    sx={{ flexWrap: "wrap", alignItems: isMobile ? "flex-start" : "center" }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={values.mark_read}
                                                onChange={(_, v) => patch({ mark_read: v })}
                                            />
                                        }
                                        label={t("markRead")}
                                        sx={{ ml: 0 }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch checked={values.star} onChange={(_, v) => patch({ star: v })} />
                                        }
                                        label={t("star")}
                                        sx={{ ml: 0 }}
                                    />
                                    {/* 모바일은 액션바가 좁아 "기존 메일에도 적용" 스위치를 본문(동작 섹션 끝)에 둔다 */}
                                    {isMobile ? (
                                        <FormControlLabel
                                            control={<Switch checked={applyNow} onChange={(_, v) => setApplyNow(v)} />}
                                            label={t("applyToExisting")}
                                            sx={{ ml: 0 }}
                                        />
                                    ) : null}
                                </Stack>
                            </Box>
                        ),
                    },
                ]}
                actions={{
                    visible: true,
                    showCancelButton: false,
                    // 모바일은 [취소][저장] 50/50 전폭(스위치는 본문으로), 데스크톱은 스위치 왼쪽 + 버튼 오른쪽
                    ...(isMobile
                        ? {
                              left: (
                                  <Stack direction="row" sx={{ width: "100%", gap: 1.5 }}>
                                      <Button
                                          variant="outlined"
                                          onClick={requestClose}
                                          disabled={busy}
                                          sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                      >
                                          {t("cancel")}
                                      </Button>
                                      <Button
                                          variant="contained"
                                          onClick={() => void save()}
                                          disabled={busy}
                                          sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                      >
                                          {t("save")}
                                      </Button>
                                  </Stack>
                              ),
                          }
                        : {
                              left: (
                                  <FormControlLabel
                                      control={<Switch checked={applyNow} onChange={(_, v) => setApplyNow(v)} />}
                                      label={t("applyToExisting")}
                                      sx={{ ml: 0 }}
                                  />
                              ),
                              right: (
                                  // 단추 간격은 같은 창 폰 액션바와 같은 1.5(2026-11-27 사용자 지시 "액션바 버튼 간격 더 줘").
                                  <Stack direction="row" spacing={1.5}>
                                      <Button variant="outlined" onClick={requestClose} disabled={busy}>
                                          {t("cancel")}
                                      </Button>
                                      <Button variant="contained" onClick={() => void save()} disabled={busy}>
                                          {t("save")}
                                      </Button>
                                  </Stack>
                              ),
                          }),
                }}
            />
            {/* 보낸 사람 후보 메뉴 — 주소/이름 중 하나를 골라 조건 값에 넣는다 */}
            <Menu
                open={Boolean(fromMenu)}
                anchorEl={fromMenu?.anchor ?? null}
                onClose={() => setFromMenu(null)}
                transitionDuration={0}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                {fromOptions.map((option) => (
                    <MenuItem
                        key={option}
                        sx={{ fontSize: 15, gap: 1 }}
                        onClick={() => {
                            if (fromMenu) patchCondition(fromMenu.index, { value: option });
                            setFromMenu(null);
                        }}
                    >
                        <span style={{ color: "#64748b", fontSize: 13, width: 30, flexShrink: 0 }}>
                            {option === (hints?.from_address ?? "").trim() ? t("address") : t("name")}
                        </span>
                        {option}
                    </MenuItem>
                ))}
            </Menu>
            <MailFolderFormDialog
                open={folderFormOpen}
                onClose={() => setFolderFormOpen(false)}
                onChanged={(created) => {
                    if (created && created.seq > 0) {
                        setCreatedFolders((prev) => [...prev, created]);
                        patch({ move_to: "custom", mail_folder_seq: created.seq });
                    }
                    onFoldersChanged?.();
                }}
            />
            <MailLabelFormDialog
                open={labelFormOpen}
                onClose={() => setLabelFormOpen(false)}
                onSaved={(created) => {
                    if (created && created.seq > 0) {
                        setCreatedLabels((prev) => [...prev, created]);
                        setValues((prev) => ({ ...prev, label_seqs: [...prev.label_seqs.filter((seq) => seq !== created.seq), created.seq] }));
                    }
                    onLabelsChanged?.();
                }}
            />
        </>
    );
}
