/**
 * 메일 작성 다이얼로그(mfd) — 보내는 계정 · 받는 사람/참조/숨은참조 · 제목 · 에디터 본문 · 첨부 · [임시저장] [보내기].
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, CircularProgress, Stack } from "@mui/material";
import { FileTypeIcon } from "../../internal/FileTypeIcon";
import { EhfuseEditor, minimalToolbarOptions } from "@ehfuse/editor";
import type { EditorConfig, EhfuseEditorRef } from "@ehfuse/editor";
import { ErrorAlert, SuccessAlert, WarningAlert } from "@ehfuse/alerts";
import { ClearTextField, DateTimeTextField, PasswordTextField, Select, Switch } from "@ehfuse/mui-form-controls";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaComposeEditor, useMuaConfig, useMuaFileUploadBox, useMuaFormDialog, useMuaMobileEditorToolbar } from "../../MuaProvider";
import { extractSignature } from "../../controllers/composeController";
import type { ComposeController } from "../../controllers/composeController";
import type { ComposeAttachment, MailAccount } from "../../models/types";
import { MAX_ATTACHMENT_MB, readFileAsAttachment } from "../../utils/attachments";
import { mailApi, unwrap } from "../../apis/mailApi";
import { useMailController } from "../../controllers/mailController";
import { formatBytes } from "../../utils/format";
import { RecipientField } from "../components/RecipientField";

interface ComposeDialogProps {
    controller: ComposeController; // 컨트롤러
    accounts: MailAccount[]; // 발신 계정 후보
}

/** 작성 다이얼로그 컴포넌트 */
export function ComposeDialog({ controller, accounts }: ComposeDialogProps) {
    const { form, modal, sending, savingDraft, saveDraft, sentRef } = controller;
    // 고른 보내는 계정을 기억해 두는 자리(전역 메일 상태) — 다음 창의 기본값이 된다.
    const { state } = useMailController();
    // 모바일은 풀스크린 우→좌 슬라이드(다른 모바일 상세/등록 다이얼로그와 동일).
    const isMobile = useIsMobile();
    // 좁은 화면이어도 서식 툴바를 보이는 환경(설치한 웹앱 등 — config.mobileEditorToolbar).
    const mobileToolbar = useMuaMobileEditorToolbar();
    const FormDialog = useMuaFormDialog();
    // 에디터 바꿔 끼우기(config.ComposeEditorComponent — 표가 되는 editor-pro 등)와 본문 아래 서명 칸(config.signatureBelowEditor).
    const injected = useMuaComposeEditor();
    const Editor = (injected.Editor ?? EhfuseEditor) as typeof EhfuseEditor;
    const toolbarOptions = (injected.toolbarOptions ?? minimalToolbarOptions) as typeof minimalToolbarOptions;
    const signatureBelow = Boolean(useMuaConfig().signatureBelowEditor);
    const autoSave = Boolean(useMuaConfig().autoSaveDraft);
    const signatureHtml = String(form.useFormValue("signature_html") ?? "");
    const FileUploadBox = useMuaFileUploadBox();
    const bodyHtml = String(form.useFormValue("body_html") ?? "");
    const showCcBcc = Boolean(form.useFormValue("showCcBcc"));
    const attachments = (form.useFormValue("attachments") as ComposeAttachment[] | undefined) ?? [];
    const mode = String(form.useFormValue("mode") ?? "new");
    const secure = Boolean(form.useFormValue("secure"));
    const scheduled = Boolean(form.useFormValue("scheduled"));

    // 보안메일은 열어 본 사람이 늘 기록된다 — 수신확인을 켠 채로 잠가 그 사실이 보이게 한다.
    useEffect(() => {
        if (secure) form.setFormValue("read_receipt", true);
    }, [secure, form]);

    const editorRef = useRef<EhfuseEditorRef>(null);
    const toInputRef = useRef<HTMLInputElement | null>(null);
    const subjectInputRef = useRef<HTMLInputElement | null>(null);
    const lastSyncedHtmlRef = useRef<string | null>(null);

    // 열릴 때 커서 자리 — 받는 사람이 채워져 열리면(앱 본문의 이메일 주소를 눌러 연 새 메일) 제목부터 친다.
    // 받는 사람이 비었으면(새 메일·전달) 받는 사람부터. 둘 다 차 있으면(답장) 건드리지 않는다.
    // 창이 열리는 동안 다이얼로그가 포커스를 자기 쪽으로 가져가므로 열림 전환이 끝난 뒤에 준다.
    useEffect(() => {
        if (!modal.isOpen) return;
        const timer = setTimeout(() => {
            const to = String(form.getFormValue("to") ?? "").trim();
            const subject = String(form.getFormValue("subject") ?? "").trim();
            if (!to) toInputRef.current?.focus();
            else if (!subject) subjectInputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, [modal.isOpen, form]);
    const stagingTokenRef = useRef(0);

    const accountOptions = useMemo(
        () =>
            accounts.map((a) => ({
                value: String(a.seq),
                label: `${a.name ? `${a.name} <${a.email}>` : a.email}${a.scope === "shared" ? " (공용)" : ""}`,
            })),
        [accounts]
    );

    // 에디터 → 폼 동기화
    const editorConfig = useMemo<EditorConfig>(
        () => ({
            placeholder: "내용을 입력하세요",
            // 모바일은 서식 편집이 사실상 어려워 툴바를 감추고 내용 높이에 맞춰 늘린다(업무함 내용 편집기와 같은 규칙).
            minHeight: isMobile ? 240 : 320,
            showToolbar: !isMobile || mobileToolbar,
            autoHeight: isMobile,
            locale: "ko",
            onChange: (html: string) => {
                lastSyncedHtmlRef.current = html;
                form.setFormValue("body_html", html);
            },
            styles: { borderWidth: 0 },
        }),
        // isMobile 이 바뀌면(회전 등) 에디터 설정도 다시 만든다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [form, isMobile, mobileToolbar]
    );

    // 폼 → 에디터 동기화(열기/모드 전환 시)
    useEffect(() => {
        if (!modal.isOpen) return;
        const next = bodyHtml || "";
        if (lastSyncedHtmlRef.current === next) return;
        lastSyncedHtmlRef.current = next;
        editorRef.current?.setHtml(next);
    }, [bodyHtml, modal.isOpen]);

    useEffect(() => {
        if (!modal.isOpen) lastSyncedHtmlRef.current = null;
    }, [modal.isOpen]);

    // 본문 아래 서명 칸 — 창이 열릴 때 한 번 본문의 서명을 꺼내 서명 칸으로 옮긴다(새 메일 · 답장 · 임시보관 모두 같은 길).
    // 보낼 때 컨트롤러가 다시 넣는다(toComposeRequest → mergeSignature). 열린 동안 다시 꺼내지 않는다(본문에 서명을 손으로 붙여도 그대로).
    const signatureEditorRef = useRef<EhfuseEditorRef>(null);
    const lastSyncedSignatureRef = useRef<string | null>(null);
    const extractedRef = useRef(false);
    useEffect(() => {
        if (!modal.isOpen) {
            extractedRef.current = false;
            lastSyncedSignatureRef.current = null;
            return;
        }
        if (!signatureBelow || extractedRef.current) return;
        extractedRef.current = true;
        const values = form.getFormValues();
        const { body, signature, place } = extractSignature(String(values.body_html ?? ""));
        form.setFormValue("signature_place", place);
        form.setFormValue("signature_html", signature);
        if (body !== values.body_html) form.setFormValue("body_html", body);
    }, [modal.isOpen, signatureBelow, form]);
    useEffect(() => {
        if (!modal.isOpen || !signatureBelow) return;
        if (lastSyncedSignatureRef.current === signatureHtml) return;
        lastSyncedSignatureRef.current = signatureHtml;
        signatureEditorRef.current?.setHtml(signatureHtml);
    }, [signatureHtml, modal.isOpen, signatureBelow]);
    // ── 자동 임시저장(config.autoSaveDraft, 0.3.155) ──
    // 저장할 내용의 지문 — 이게 마지막 저장 때와 다르면 저장할 것이 있다. 첨부는 이름 · 크기로만 본다(base64 를 비교하지 않게).
    const watched = {
        a: form.useFormValue("mail_account_seq"),
        t: form.useFormValue("to"),
        c: form.useFormValue("cc"),
        b: form.useFormValue("bcc"),
        s: form.useFormValue("subject"),
        h: bodyHtml,
        g: signatureHtml,
        f: attachments.map((x) => `${x.name}:${x.size ?? 0}`).join("|"),
    };
    const fingerprint = JSON.stringify(watched);
    const savedPrintRef = useRef<string | null>(null);
    const [autoSavedAt, setAutoSavedAt] = useState("");
    const [autoSaveFailed, setAutoSaveFailed] = useState(false);
    /** 받는 사람 · 제목 · 본문 글자 · 첨부가 모두 비었으면 저장하지 않는다(창만 열었다 닫은 것). */
    const hasContent = () => {
        const v = form.getFormValues();
        const text = String(v.body_html ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
        return Boolean(String(v.to ?? "").trim() || String(v.subject ?? "").trim() || text || (v.attachments ?? []).length > 0);
    };
    /** 예약해 둔 메일은 자동 저장하지 않는다 — 서버의 임시저장이 예약을 풀어 버린다(사람이 [예약] 으로 다시 걸어야 한다). */
    const autoSaveBlocked = () => {
        const v = form.getFormValues();
        return v.mode === "draft" && Boolean(v.scheduled);
    };
    const runAutoSave = useCallback(async () => {
        if (sending || savingDraft || sentRef.current || autoSaveBlocked() || !hasContent()) return;
        const print = fingerprint;
        const okSaved = await saveDraft({ silent: true });
        if (okSaved) {
            savedPrintRef.current = print;
            const now = new Date();
            setAutoSavedAt(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
            setAutoSaveFailed(false);
        } else setAutoSaveFailed(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fingerprint, sending, savingDraft, saveDraft]);
    // 창이 열리면 그때의 내용을 "저장된 것" 으로 친다(열자마자 저장하지 않게) — 서명 꺼내기 · 에디터 정리가 끝난 뒤(0.8초)의 값으로.
    useEffect(() => {
        if (!autoSave) return;
        if (!modal.isOpen) {
            savedPrintRef.current = null;
            setAutoSavedAt("");
            setAutoSaveFailed(false);
            return;
        }
        sentRef.current = false;
        const timer = setTimeout(() => {
            if (savedPrintRef.current === null) savedPrintRef.current = fingerprintRef.current;
        }, 800);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modal.isOpen, autoSave]);
    const fingerprintRef = useRef(fingerprint);
    fingerprintRef.current = fingerprint;
    // 바뀌고 3초 동안 손을 멈추면 저장한다.
    useEffect(() => {
        if (!autoSave || !modal.isOpen || savedPrintRef.current === null || savedPrintRef.current === fingerprint) return;
        const timer = setTimeout(() => void runAutoSave(), 3000);
        return () => clearTimeout(timer);
    }, [autoSave, modal.isOpen, fingerprint, runAutoSave]);
    /** 닫기 — 저장 안 된 바뀜이 있으면 한 번 저장하고 닫는다(보내지 않고 나가도 쓴 것이 남게). */
    const closeWithSave = useCallback(() => {
        if (autoSave && savedPrintRef.current !== null && savedPrintRef.current !== fingerprintRef.current) void runAutoSave();
        modal.close();
    }, [autoSave, modal, runAutoSave]);
    const autoSaveStatus = savingDraft ? "저장 중…" : autoSaveFailed ? "자동 저장 실패" : autoSavedAt ? `자동 저장됨 ${autoSavedAt}` : "";

    // [기본 서명으로 저장] — 지금 서명 칸을 보내는 계정의 서명으로 저장하고 계정 목록을 다시 읽는다(다음 창이 새 서명으로 열리게).
    const [savingSignature, setSavingSignature] = useState(false);
    const saveDefaultSignature = useCallback(async () => {
        const seq = Number(form.getFormValue("mail_account_seq") ?? 0);
        if (!(seq > 0)) {
            WarningAlert({ message: "보내는 계정을 선택하세요." });
            return;
        }
        const raw = String(form.getFormValue("signature_html") ?? "").trim();
        setSavingSignature(true);
        try {
            unwrap(await mailApi.updateSignature(seq, raw === "<p><br></p>" ? "" : raw), "서명을 저장하지 못했습니다.");
            void state.actions.loadAccounts();
            SuccessAlert({ message: "보내는 계정의 서명으로 저장했습니다.", delay: 800 });
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "서명을 저장하지 못했습니다." });
        } finally {
            setSavingSignature(false);
        }
    }, [form, state]);
    const signatureEditorConfig = useMemo<EditorConfig>(
        () => ({
            placeholder: "서명 없음",
            minHeight: 80,
            showToolbar: false,
            autoHeight: true,
            locale: "ko",
            onChange: (html: string) => {
                lastSyncedSignatureRef.current = html;
                form.setFormValue("signature_html", html);
            },
            styles: { borderWidth: 0 },
        }),
        [form]
    );

    /** 드롭존 스테이징 파일을 base64 첨부로 읽어 폼에 추가한다(기존 uuid 첨부는 유지). */
    const handleAttachedFilesChange = useCallback(
        (files: File[]) => {
            const token = ++stagingTokenRef.current;
            void (async () => {
                const loaded: ComposeAttachment[] = [];
                for (const file of files) {
                    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
                        WarningAlert({ message: `${file.name}: 첨부는 ${MAX_ATTACHMENT_MB}MB 까지 가능합니다.` });
                        continue;
                    }
                    try {
                        loaded.push(await readFileAsAttachment(file));
                    } catch (error) {
                        ErrorAlert({
                            message: error instanceof Error ? error.message : `${file.name} 을(를) 읽지 못했습니다.`,
                        });
                    }
                }
                if (stagingTokenRef.current !== token) return;
                const current = (form.getFormValue("attachments") as ComposeAttachment[] | undefined) ?? [];
                form.setFormValue("attachments", [...current.filter((a) => a.uuid), ...loaded]);
            })();
        },
        [form]
    );

    /** 참조 첨부(서버 파일 uuid 또는 eml 원문)의 식별키 */
    const refKey = (a: ComposeAttachment) =>
        a.eml_message_seq ? `eml:${a.eml_message_seq}` : a.uuid ? `uuid:${a.uuid}` : "";
    /** 기존(서버) 첨부·eml 원문 첨부를 뺀다. */
    const handleRemoveExisting = useCallback(
        (key: string) => {
            const current = (form.getFormValue("attachments") as ComposeAttachment[] | undefined) ?? [];
            form.setFormValue(
                "attachments",
                current.filter((a) => refKey(a) !== key)
            );
        },
        [form]
    );

    const existingAttachments = attachments.filter((a) => refKey(a));
    const titleText =
        mode === "reply" || mode === "replyAll"
            ? "답장"
            : mode === "forward"
              ? "전달"
              : mode === "draft"
                ? "임시보관 메일"
                : "새 메일";

    return (
        <FormDialog
            fontScaleKey="MailComposeDialog"
            backdropClick={false}
            open={modal.isOpen}
            onClose={closeWithSave}
            title={{ text: titleText }}
            titleIcons={{ delete: { visible: false } }}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="md"
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            // 모바일 액션바 — 왼쪽 슬롯(.left-actions)이 기본으로는 내용 폭만 차지해 3열 버튼이 좁게 뭉친다.
            // 슬롯을 전폭으로 늘려 [임시저장][취소][보내기] 가 화면 폭을 균등하게 나눠 갖게 한다.
            sx={
                isMobile
                    ? {
                          DialogActions: {
                              // 슬롯(.left-actions)과 mfd 가 left 를 감싸는 래퍼(> *)까지 모두 늘려야 Stack 이 전폭을 받는다.
                              "& .left-actions": { flex: 1, minWidth: 0, width: "100%" },
                              "& .left-actions > *": { flex: 1, minWidth: 0, width: "100%" },
                              // 취소 버튼을 끄면 오른쪽 슬롯은 빈 flex 박스만 남는다 — 폭을 먹지 않게 숨긴다.
                              "& .right-actions": { display: "none" },
                          },
                      }
                    : undefined
            }
            sections={[
                {
                    id: "mail-compose-main",
                    showTitle: false,
                    children: (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%" }}>
                            {/* 보내는 계정과 받는 사람을 한 줄에 — 둘 다 한 줄짜리 값이라 각각 한 줄을 쓰면
                                정작 본문이 밀린다. 참조/숨은참조 토글은 그 값들이 놓이는 아래 줄에 둔다(2026-09-07). */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    gap: 2.5,
                                    alignItems: "center",
                                }}
                            >
                                <Select
                                    label="보내는 계정"
                                    name="mail_account_seq"
                                    form={form}
                                    options={accountOptions}
                                    // 고른 계정을 기억한다 — 다음 새 메일 창이 이 계정으로 열린다(2026-09-06).
                                    // 설정의 "기본 발신 계정"(is_default)은 건드리지 않는다: 그건 사람이 정하는 값이고,
                                    // 이건 "마지막에 쓴 것" 이라는 별개의 기억이다. 실패해도 작성은 계속돼야 해 조용히 넘긴다.
                                    onChange={(event) => {
                                        const seq = Number((event.target as { value?: unknown })?.value ?? 0);
                                        if (!(seq > 0)) return;
                                        // 전역 상태에도 넣는다 — 다음 새 메일 창은 서버에 다시 묻지 않고 이 값으로 연다.
                                        state.setValue("lastAccountSeq", seq);
                                        // 서명 칸을 쓰면 계정을 바꿀 때 그 계정의 서명으로 바꾼다 — 고치지 않은(앞 계정 그대로인) 서명만.
                                        if (signatureBelow) {
                                            const before = accounts.find((a) => a.seq === Number(form.getFormValue("mail_account_seq") ?? 0));
                                            const next = accounts.find((a) => a.seq === seq);
                                            const current = String(form.getFormValue("signature_html") ?? "").trim();
                                            if (!current || current === String(before?.signature ?? "").trim()) {
                                                form.setFormValue("signature_html", String(next?.signature ?? ""));
                                            }
                                        }
                                        void mailApi.updatePreferences({ last_account_seq: seq }).catch(() => undefined);
                                    }}
                                />
                                {/* 치면 주소록에서 이름 · 주소 · 소속이 맞는 사람이 뜬다(2026-10-16). */}
                                <RecipientField name="to" label="받는 사람" form={form} inputRef={toInputRef} placeholder="이름이나 주소 — 여럿은 쉼표로" />
                            </Box>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    gap: 2.5,
                                    alignItems: "center",
                                }}
                            >
                                {showCcBcc ? (
                                    <>
                                        <RecipientField name="cc" label="참조" form={form} />
                                        <RecipientField name="bcc" label="숨은참조" form={form} />
                                    </>
                                ) : null}
                                {/* 참조 토글 줄 — 왼쪽이 비어 있던 자리에 보내기 옵션 스위치를 둔다(2026-10-11): 예약 발송 · 수신확인 · 보안메일.
                                    순서는 자주 쓰는 순이다(사용자 지시) — 아래 옵션 칸도 같은 순서로 선다(보낼 시각 → 비밀번호 · 힌트).
                                    토글은 늘 오른쪽 끝. 펼친 상태에서는 참조 두 칸 아래 줄에 놓이므로 폭을 다 차지시킨다. */}
                                <Box
                                    sx={{
                                        gridColumn: { sm: "1 / -1" },
                                        display: "flex",
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        columnGap: 3,
                                        rowGap: 0.5,
                                    }}
                                >
                                    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 3, rowGap: 0.5 }}>
                                        <Switch form={form} name="scheduled" label="예약 발송" />
                                        <Switch form={form} name="read_receipt" label="수신확인" disabled={secure} />
                                        <Switch form={form} name="secure" label="보안메일" />
                                    </Box>
                                    <Button
                                        size="small"
                                        onClick={() => form.setFormValue("showCcBcc", !showCcBcc)}
                                        sx={{ fontSize: "13.5px", ml: "auto" }}
                                    >
                                        {showCcBcc ? "참조 숨기기" : "참조/숨은참조"}
                                    </Button>
                                </Box>
                            </Box>
                            {/* 옵션 칸은 한 줄에 놓는다(2026-10-11) — 스위치를 모두 켜면 보낼 시각·비밀번호·힌트가 3열로 서고,
                                하나만 켜면 예전처럼 2열 폭을 쓴다. 따로 줄을 주면 본문이 그만큼 밀린다. 모바일은 1열. */}
                            {secure || scheduled ? (
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: secure && scheduled ? "repeat(3, 1fr)" : "1fr 1fr",
                                        },
                                        gap: 2.5,
                                        alignItems: "center",
                                    }}
                                >
                                    {scheduled ? (
                                        <DateTimeTextField name="send_at" label="보낼 시각 *" form={form} fullWidth />
                                    ) : null}
                                    {secure ? (
                                        <>
                                            <PasswordTextField
                                                name="secure_password"
                                                label="열람 비밀번호 *"
                                                form={form}
                                                fullWidth
                                                autoComplete="new-password"
                                            />
                                            <ClearTextField
                                                name="secure_hint"
                                                label="비밀번호 힌트"
                                                form={form}
                                                fullWidth
                                                autoComplete="off"
                                            />
                                        </>
                                    ) : null}
                                </Box>
                            ) : null}
                            <ClearTextField
                                name="subject"
                                label="제목"
                                form={form}
                                inputRef={subjectInputRef}
                                fullWidth
                                autoComplete="off"
                            />
                            {/* 첨부는 본문 **위**에 둔다(2026-09-07) — 아래에 있으면 본문이 길어질수록 밀려나
                                첨부하려고 매번 끝까지 내려야 하고, 붙였는지도 눈에 들어오지 않는다. */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {existingAttachments.length > 0 ? (
                                    <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
                                        {existingAttachments.map((item) => (
                                            <Chip
                                                key={refKey(item)}
                                                icon={<FileTypeIcon name={item.name} mime={item.mime} size={20} />}
                                                label={`${item.name} (${formatBytes(item.size)})`}
                                                variant="outlined"
                                                sx={{
                                                    fontSize: "13.5px",
                                                    color: "#111",
                                                    pl: 0.75,
                                                    "& .MuiChip-icon": { ml: 0.5 },
                                                }}
                                                onDelete={() => handleRemoveExisting(refKey(item))}
                                            />
                                        ))}
                                    </Stack>
                                ) : null}
                                <FileUploadBox
                                    multiple
                                    height={64}
                                    variant="box"
                                    acceptedFileTypes={[]}
                                    maxFileSize={MAX_ATTACHMENT_MB}
                                    // 모바일은 끌어놓기가 없으니 탭 안내만(데스크톱은 드래그·클릭 둘 다).
                                    // 용량 제한도 여기 적는다 — 따로 한 줄을 두면 정작 파일을 고르는 순간에는 눈이 가지 않는다.
                                    dropzoneText={
                                        isMobile
                                            ? `탭하여 파일을 첨부하세요 (파일당 최대 ${MAX_ATTACHMENT_MB}MB)`
                                            : `파일을 끌어놓거나 클릭하여 첨부하세요 (파일당 최대 ${MAX_ATTACHMENT_MB}MB)`
                                    }
                                    onAttachedFilesChange={handleAttachedFilesChange}
                                />
                            </Box>
                            <Box
                                sx={{
                                    border: "1px solid",
                                    borderColor: "rgba(0,0,0,0.23)",
                                    borderRadius: 1,
                                    overflow: "hidden",
                                    // 본문 높이는 **이 상자**가 정한다(2026-09-06).
                                    // 에디터는 autoHeight 가 아니면 내용 영역에 `.fixed-height { flex:1; height:0; min-height:0 }`
                                    // 를 걸고 높이를 부모에서 받는다 — 부모(여기)에 높이가 없으면 한 줄 높이로 눌린다.
                                    // 그래서 config.minHeight 를 아무리 키워도 소용이 없었다. 상자에 높이를 주고 안쪽을 채우게 한다.
                                    // 폰은 에디터가 autoHeight 라 내용만큼 늘어나야 한다 — 상자 높이를 260 으로 묶으면 늘어난 만큼
                                    // 툴바가 위로 밀려 잘렸다(0.3.152, 설치한 웹앱에서 툴바를 켜며 드러남). 폰은 최소 높이만 준다.
                                    ...(isMobile ? { minHeight: 260 } : { height: { xs: 260, sm: 380 } }),
                                    display: "flex",
                                    flexDirection: "column",
                                    "& > div": { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" },
                                    "& .ehfuse-editor-container": { flex: 1, minHeight: 0 },
                                }}
                            >
                                <Editor
                                    ref={editorRef}
                                    defaultValue={bodyHtml || ""}
                                    toolbarOptions={toolbarOptions}
                                    {...editorConfig}
                                />
                            </Box>
                            {/* 서명 — 본문 아래 따로(config.signatureBelowEditor). 이 메일에만 쓰는 서명이라 고쳐도 계정 서명은 그대로다. */}
                            {signatureBelow ? (
                                <Box>
                                    {/* 머리 줄 — "서명" 과 [기본 서명으로 저장](0.3.154). 쓰기 창에서 고친 서명은 이 메일에만 쓰이는데,
                                        계정 설정까지 가지 않고 그대로 보내는 계정의 서명으로 굳힐 수 있게 한다(다음 메일부터 채워진다). */}
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.25 }}>
                                        <Box component="div" sx={{ fontSize: 14, color: "text.secondary" }}>
                                            서명
                                        </Box>
                                        <Button size="small" disabled={savingSignature} onClick={() => void saveDefaultSignature()} sx={{ fontSize: 14 }}>
                                            {savingSignature ? <CircularProgress size={14} color="inherit" /> : "기본 서명으로 저장"}
                                        </Button>
                                    </Box>
                                    <Box sx={{ border: "1px solid", borderColor: "rgba(0,0,0,0.23)", borderRadius: 1, overflow: "hidden" }}>
                                        <Editor ref={signatureEditorRef} defaultValue={signatureHtml} toolbarOptions={toolbarOptions} {...signatureEditorConfig} />
                                    </Box>
                                </Box>
                            ) : null}
                        </Box>
                    ),
                },
            ]}
            actions={{
                visible: true,
                // 모바일은 mfd 기본 취소 대신 [임시저장][취소][보내기] 를 균등 3열로 직접 그린다.
                showCancelButton: !isMobile,
                ...(isMobile
                    ? {
                          left: (
                              // 간격은 mfd 액션바 슬롯과 같은 gap 1rem — Stack spacing(margin)은 액션바가 버튼 margin 을 지워 버튼이 붙었다.
                              <Box sx={{ display: "flex", gap: "1rem", width: "100%" }}>
                                  {autoSave ? (
                                      // 자동 저장이면 [임시저장] 자리에 저장 상태를 보인다(단추와 같은 칸 폭).
                                      <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: autoSaveFailed ? "error.main" : "text.secondary", whiteSpace: "nowrap" }}>
                                          {autoSaveStatus}
                                      </Box>
                                  ) : (
                                      <Button
                                          variant="outlined"
                                          onClick={() => void saveDraft()}
                                          disabled={sending || savingDraft}
                                          sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                      >
                                          {savingDraft ? <CircularProgress size={20} color="inherit" /> : "임시저장"}
                                      </Button>
                                  )}
                                  <Button
                                      variant="outlined"
                                      color="inherit"
                                      onClick={closeWithSave}
                                      disabled={sending || savingDraft}
                                      sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                  >
                                      취소
                                  </Button>
                                  <Button
                                      variant="contained"
                                      color="primary"
                                      onClick={() => void form.submit()}
                                      disabled={sending || savingDraft}
                                      sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                  >
                                      {sending ? <CircularProgress size={20} color="inherit" /> : scheduled ? "예약" : "보내기"}
                                  </Button>
                              </Box>
                          ),
                      }
                    : {
                          left: autoSave ? (
                              <Box sx={{ fontSize: 14, color: autoSaveFailed ? "error.main" : "text.secondary", whiteSpace: "nowrap" }}>{autoSaveStatus}</Box>
                          ) : (
                              <Button
                                  variant="outlined"
                                  onClick={() => void saveDraft()}
                                  disabled={sending || savingDraft}
                                  sx={{ minWidth: 96 }}
                              >
                                  {savingDraft ? <CircularProgress size={20} color="inherit" /> : "임시저장"}
                              </Button>
                          ),
                          right: (
                              <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() => void form.submit()}
                                  disabled={sending || savingDraft}
                                  sx={{ minWidth: 88 }}
                              >
                                  {sending ? <CircularProgress size={20} color="inherit" /> : scheduled ? "예약" : "보내기"}
                              </Button>
                          ),
                      }),
            }}
        />
    );
}
