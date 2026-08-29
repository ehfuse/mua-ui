/**
 * 규칙 등록/수정(mfd) — 이름 · 조건(대상/비교/값, 여러 개 + 모두/하나라도) · 동작(이동/읽음/중요) · 사용 · 뒤 규칙 중단.
 * 폼은 로컬 상태로 다룬다(조건 배열 편집이 잦아 forma 바인딩보다 단순하다).
 */

import { useCallback, useEffect, useState } from "react";
import {
    Autocomplete,
    Box,
    Button,
    FormControlLabel,
    IconButton,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { ConfirmDialog, ErrorAlert, SuccessAlert, WarningAlert } from "@ehfuse/alerts";
import { mailApi, unwrap } from "../../apis/mailApi";
import { OptionToggleGroup } from "../../internal/OptionToggleGroup";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaFormDialog } from "../../MuaProvider";
import { defaultMailRuleForm } from "../../models/defaults";
import type {
    MailRule,
    MailRuleCondition,
    MailRuleForm,
    MailRuleFormPrefill,
    MailRuleRequest,
    MailUserFolder,
} from "../../models/types";

interface MailRuleFormDialogProps {
    open: boolean; // 열림
    rule: MailRule | null; // 수정 대상(null = 신규)
    prefill?: MailRuleFormPrefill | null; // 신규 미리 채움(우클릭 "규칙 만들기", hints=보낸 사람 후보)
    folders: MailUserFolder[]; // 사용자 메일함(이동 대상)
    onClose: () => void; // 닫기
    onSaved: () => void; // 저장/삭제 후(목록 재조회)
}

const FIELD_OPTIONS: { value: MailRuleCondition["field"]; label: string }[] = [
    { value: "from", label: "보낸 사람" },
    { value: "to", label: "받는 사람" },
    { value: "subject", label: "제목" },
    { value: "body", label: "본문" },
];
const OP_OPTIONS: { value: MailRuleCondition["op"]; label: string }[] = [
    { value: "contains", label: "포함" },
    { value: "not_contains", label: "미포함" },
    { value: "equals", label: "일치" },
    { value: "starts", label: "시작" },
    { value: "ends", label: "끝" },
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
        },
    };
}

const INPUT_SX = { "& .MuiInputBase-input": { fontSize: 15 } };

/** 규칙 폼 다이얼로그 */
export function MailRuleFormDialog({ open, rule, prefill, folders, onClose, onSaved }: MailRuleFormDialogProps) {
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const [values, setValues] = useState<MailRuleForm>(defaultMailRuleForm);
    const [busy, setBusy] = useState(false);
    const [applyNow, setApplyNow] = useState(false); // 저장 후 받은편지함의 기존 메일에도 바로 적용
    // hints(보낸 사람 후보)는 폼 값이 아니므로 분리
    const { hints, ...prefillValues } = prefill ?? {};
    const fromOptions = [hints?.from_address, hints?.from_name]
        .map((v) => (v ?? "").trim())
        .filter((v, i, arr) => v && arr.indexOf(v) === i);
    useEffect(() => {
        if (!open) return;
        setApplyNow(false);
        setValues(
            rule
                ? toForm(rule)
                : {
                      ...defaultMailRuleForm,
                      conditions: [{ field: "from", op: "contains", value: "" }],
                      ...(prefillValues ?? {}),
                  }
        );
    }, [open, rule, prefill]); // eslint-disable-line react-hooks/exhaustive-deps
    const patch = useCallback((next: Partial<MailRuleForm>) => setValues((prev) => ({ ...prev, ...next })), []);
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
            WarningAlert({ message: "조건 값을 하나 이상 입력하세요." });
            return;
        }
        if (!values.move_to && !values.mark_read && !values.star) {
            WarningAlert({ message: "동작을 하나 이상 고르세요." });
            return;
        }
        if (values.move_to === "custom" && !(values.mail_folder_seq > 0)) {
            WarningAlert({ message: "이동할 메일함을 고르세요." });
            return;
        }
        setBusy(true);
        try {
            let seq = values.seq;
            if (values.seq > 0) unwrap(await mailApi.updateRule(values.seq, body), "규칙을 저장하지 못했습니다.");
            else seq = unwrap(await mailApi.createRule(body), "규칙을 저장하지 못했습니다.").seq;
            if (applyNow && seq > 0 && values.enabled) {
                // 저장 직후 받은편지함의 기존 메일에 이 규칙을 적용
                const res = unwrap(await mailApi.applyRules(seq), "규칙을 적용하지 못했습니다.");
                SuccessAlert(`규칙을 저장하고 받은편지함 ${res.scanned}건 중 ${res.affected}건에 적용했습니다.`);
            } else SuccessAlert("규칙을 저장했습니다.");
            onSaved();
            onClose();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "규칙을 저장하지 못했습니다." });
        } finally {
            setBusy(false);
        }
    }, [values, applyNow, onSaved, onClose]);

    const remove = useCallback(() => {
        if (!(values.seq > 0)) return;
        ConfirmDialog({
            title: "규칙 삭제",
            message: "이 규칙을 삭제하시겠습니까?",
            onConfirm: () =>
                void (async () => {
                    try {
                        unwrap(await mailApi.deleteRule(values.seq), "규칙을 삭제하지 못했습니다.");
                        SuccessAlert("규칙을 삭제했습니다.");
                        onSaved();
                        onClose();
                    } catch (error) {
                        ErrorAlert({ message: error instanceof Error ? error.message : "규칙을 삭제하지 못했습니다." });
                    }
                })(),
        });
    }, [values.seq, onSaved, onClose]);

    return (
        <FormDialog
            fontScaleKey="MailRuleFormDialog"
            draggable
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            open={open}
            onClose={onClose}
            title={{ text: values.seq > 0 ? "규칙 수정" : "규칙 만들기" }}
            titleIcons={{ delete: { visible: values.seq > 0 } }}
            onDelete={values.seq > 0 ? remove : undefined}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="sm"
            scrollPastLastSection={false}
            contentBottomPadding={24}
            sections={[
                {
                    id: "mail-rule-basic",
                    title: "기본",
                    showTitle: true,
                    children: (
                        <Box sx={{ display: "grid", gap: 2, width: "100%" }}>
                            <TextField
                                label="규칙 이름"
                                fullWidth
                                value={values.name}
                                onChange={(e) => patch({ name: e.target.value })}
                                placeholder="예) 공고 메일은 공고함으로"
                                sx={INPUT_SX}
                            />
                            <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
                                <FormControlLabel
                                    control={
                                        <Switch checked={values.enabled} onChange={(_, v) => patch({ enabled: v })} />
                                    }
                                    label="규칙 사용"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={values.stop_processing}
                                            onChange={(_, v) => patch({ stop_processing: v })}
                                        />
                                    }
                                    label="이 규칙이 적용되면 다음 규칙은 적용하지 않음"
                                />
                            </Stack>
                        </Box>
                    ),
                },
                {
                    id: "mail-rule-conditions",
                    title: "조건",
                    showTitle: true,
                    children: (
                        <Box sx={{ display: "grid", gap: 1.5, width: "100%" }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <OptionToggleGroup
                                    value={values.match}
                                    onChange={(v) => patch({ match: (v ?? "all") as "all" | "any" })}
                                    options={[
                                        { value: "all", label: "모두 만족" },
                                        { value: "any", label: "하나라도 만족" },
                                    ]}
                                />
                            </Stack>
                            {values.conditions.map((c, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr 1fr", sm: "130px 120px minmax(0,1fr) 36px" },
                                        gap: 1.5,
                                        alignItems: "center",
                                    }}
                                >
                                    <TextField
                                        select
                                        value={c.field}
                                        onChange={(e) =>
                                            patchCondition(index, {
                                                field: e.target.value as MailRuleCondition["field"],
                                            })
                                        }
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
                                    {c.field === "from" && fromOptions.length > 0 ? (
                                        // 우클릭으로 만들 때 — 드롭다운에서 주소/이름 중 골라 넣을 수 있다(직접 입력도 가능)
                                        <Autocomplete
                                            freeSolo
                                            disableClearable
                                            options={fromOptions}
                                            inputValue={c.value}
                                            onInputChange={(_, v) => patchCondition(index, { value: v })}
                                            renderOption={(props, option) => (
                                                // [주소|이름] 라벨은 줄바꿈 없이, 긴 값은 말줄임
                                                <li
                                                    {...props}
                                                    key={option}
                                                    style={{
                                                        fontSize: 15,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color: "#64748b",
                                                            fontSize: 13,
                                                            whiteSpace: "nowrap",
                                                            flexShrink: 0,
                                                            width: 30,
                                                        }}
                                                    >
                                                        {option === (hints?.from_address ?? "").trim()
                                                            ? "주소"
                                                            : "이름"}
                                                    </span>
                                                    <span
                                                        style={{
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        {option}
                                                    </span>
                                                </li>
                                            )}
                                            // 드롭다운은 입력칸보다 넓게(주소가 길다)
                                            slotProps={{ popper: { sx: { minWidth: 380 } } }}
                                            sx={{ gridColumn: { xs: "1 / span 2", sm: "auto" } }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="이름 또는 메일 주소"
                                                    sx={INPUT_SX}
                                                />
                                            )}
                                        />
                                    ) : (
                                        <TextField
                                            fullWidth
                                            value={c.value}
                                            placeholder={c.field === "from" ? "이름 또는 메일 주소" : "단어"}
                                            onChange={(e) => patchCondition(index, { value: e.target.value })}
                                            sx={{ ...INPUT_SX, gridColumn: { xs: "1 / span 2", sm: "auto" } }}
                                        />
                                    )}
                                    <IconButton
                                        size="small"
                                        aria-label="조건 삭제"
                                        disabled={values.conditions.length <= 1}
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
                                    onClick={() =>
                                        patch({
                                            conditions: [
                                                ...values.conditions,
                                                { field: "subject", op: "contains", value: "" },
                                            ],
                                        })
                                    }
                                    disabled={values.conditions.length >= 20}
                                >
                                    조건 추가
                                </Button>
                            </Box>
                        </Box>
                    ),
                },
                {
                    id: "mail-rule-actions",
                    title: "동작",
                    showTitle: true,
                    children: (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", width: "100%" }}>
                            {/* [이동][메일함(이동=메일함일 때)][읽음 스위치][중요 스위치] — 한 줄, 좁으면 줄바꿈 */}
                            <TextField
                                select
                                label="이동"
                                value={
                                    values.move_to === "custom"
                                        ? `custom:${values.mail_folder_seq || 0}`
                                        : values.move_to
                                }
                                onChange={(e) => {
                                    const v = String(e.target.value);
                                    if (v.startsWith("custom:"))
                                        patch({ move_to: "custom", mail_folder_seq: Number(v.slice(7)) || 0 });
                                    else patch({ move_to: v as MailRuleForm["move_to"], mail_folder_seq: 0 });
                                }}
                                sx={{ ...INPUT_SX, width: { xs: "100%", sm: 260 } }}
                            >
                                <MenuItem value="" sx={{ fontSize: 15 }}>
                                    이동하지 않음
                                </MenuItem>
                                {/* 사용자 메일함은 각각 항목으로(별도 메일함 선택 없이) */}
                                {folders.map((f) => (
                                    <MenuItem key={f.seq} value={`custom:${f.seq}`} sx={{ fontSize: 15 }}>
                                        "{f.name}" 메일함으로 이동
                                    </MenuItem>
                                ))}
                                {values.move_to === "custom" &&
                                values.mail_folder_seq > 0 &&
                                !folders.some((f) => f.seq === values.mail_folder_seq) ? (
                                    <MenuItem value={`custom:${values.mail_folder_seq}`} sx={{ fontSize: 15 }} disabled>
                                        (삭제된 메일함)으로 이동
                                    </MenuItem>
                                ) : null}
                                <MenuItem value="spam" sx={{ fontSize: 15 }}>
                                    스팸함으로 이동
                                </MenuItem>
                                <MenuItem value="trash" sx={{ fontSize: 15 }}>
                                    휴지통으로 이동
                                </MenuItem>
                            </TextField>
                            <FormControlLabel
                                control={
                                    <Switch checked={values.mark_read} onChange={(_, v) => patch({ mark_read: v })} />
                                }
                                label="읽음으로 표시"
                                sx={{ ml: 0 }}
                            />
                            <FormControlLabel
                                control={<Switch checked={values.star} onChange={(_, v) => patch({ star: v })} />}
                                label="중요 표시"
                                sx={{ ml: 0 }}
                            />
                        </Box>
                    ),
                },
            ]}
            actions={{
                visible: true,
                showCancelButton: false,
                left: (
                    <FormControlLabel
                        control={<Switch checked={applyNow} onChange={(_, v) => setApplyNow(v)} />}
                        label="받은편지함 기존 메일에도 적용"
                        sx={{ ml: 0 }}
                    />
                ),
                right: (
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={onClose} disabled={busy}>
                            취소
                        </Button>
                        <Button variant="contained" onClick={() => void save()} disabled={busy}>
                            저장
                        </Button>
                    </Stack>
                ),
            }}
        />
    );
}
