/**
 * 메일 작성 다이얼로그(mfd) — 보내는 계정 · 받는 사람/참조/숨은참조 · 제목 · 에디터 본문 · 첨부 · [임시저장] [보내기].
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { EhfuseEditor, minimalToolbarOptions } from "@ehfuse/editor";
import type { EditorConfig, EhfuseEditorRef } from "@ehfuse/editor";
import { ErrorAlert, WarningAlert } from "@ehfuse/alerts";
import { ClearTextField, Select } from "@ehfuse/mui-form-controls";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaFileUploadBox, useMuaFormDialog } from "../../MuaProvider";
import type { ComposeController } from "../../controllers/composeController";
import type { ComposeAttachment, MailAccount } from "../../models/types";
import { MAX_ATTACHMENT_MB, readFileAsAttachment } from "../../utils/attachments";
import { formatBytes } from "../../utils/format";

interface ComposeDialogProps {
    controller: ComposeController; // 컨트롤러
    accounts: MailAccount[]; // 발신 계정 후보
}

/** 작성 다이얼로그 컴포넌트 */
export function ComposeDialog({ controller, accounts }: ComposeDialogProps) {
    const { form, modal, sending, savingDraft, saveDraft } = controller;
    // 모바일은 풀스크린 우→좌 슬라이드(다른 모바일 상세/등록 다이얼로그와 동일).
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const FileUploadBox = useMuaFileUploadBox();
    const bodyHtml = String(form.useFormValue("body_html") ?? "");
    const showCcBcc = Boolean(form.useFormValue("showCcBcc"));
    const attachments = (form.useFormValue("attachments") as ComposeAttachment[] | undefined) ?? [];
    const mode = String(form.useFormValue("mode") ?? "new");

    const editorRef = useRef<EhfuseEditorRef>(null);
    const lastSyncedHtmlRef = useRef<string | null>(null);
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
            minHeight: 320,
            locale: "ko",
            onChange: (html: string) => {
                lastSyncedHtmlRef.current = html;
                form.setFormValue("body_html", html);
            },
            styles: { borderWidth: 0 },
        }),
        [form]
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

    /** 기존(서버) 첨부를 뺀다. */
    const handleRemoveExisting = useCallback(
        (uuid: string) => {
            const current = (form.getFormValue("attachments") as ComposeAttachment[] | undefined) ?? [];
            form.setFormValue(
                "attachments",
                current.filter((a) => a.uuid !== uuid)
            );
        },
        [form]
    );

    const existingAttachments = attachments.filter((a) => a.uuid);
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
            onClose={modal.close}
            title={{ text: titleText }}
            titleIcons={{ delete: { visible: false } }}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="md"
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            sections={[
                {
                    id: "mail-compose-main",
                    showTitle: false,
                    children: (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                                    gap: 1.5,
                                    alignItems: "center",
                                }}
                            >
                                <Select
                                    label="보내는 계정"
                                    name="mail_account_seq"
                                    form={form}
                                    options={accountOptions}
                                />
                                <Button
                                    size="small"
                                    onClick={() => form.setFormValue("showCcBcc", !showCcBcc)}
                                    sx={{ fontSize: "13.5px", justifySelf: "end" }}
                                >
                                    {showCcBcc ? "참조 숨기기" : "참조/숨은참조"}
                                </Button>
                            </Box>
                            <ClearTextField
                                name="to"
                                label="받는 사람"
                                form={form}
                                fullWidth
                                placeholder="주소를 쉼표로 구분해 입력"
                                autoComplete="off"
                            />
                            {showCcBcc ? (
                                <>
                                    <ClearTextField name="cc" label="참조" form={form} fullWidth autoComplete="off" />
                                    <ClearTextField
                                        name="bcc"
                                        label="숨은참조"
                                        form={form}
                                        fullWidth
                                        autoComplete="off"
                                    />
                                </>
                            ) : null}
                            <ClearTextField name="subject" label="제목" form={form} fullWidth autoComplete="off" />
                            <Box
                                sx={{
                                    border: "1px solid",
                                    borderColor: "rgba(0,0,0,0.23)",
                                    borderRadius: 1,
                                    overflow: "hidden",
                                }}
                            >
                                <EhfuseEditor
                                    ref={editorRef}
                                    defaultValue={bodyHtml || ""}
                                    toolbarOptions={minimalToolbarOptions}
                                    {...editorConfig}
                                />
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {existingAttachments.length > 0 ? (
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                                        {existingAttachments.map((item) => (
                                            <Chip
                                                key={item.uuid}
                                                icon={<AttachFileIcon />}
                                                label={`${item.name} (${formatBytes(item.size)})`}
                                                variant="outlined"
                                                sx={{ fontSize: "13.5px", color: "#111" }}
                                                onDelete={() => handleRemoveExisting(String(item.uuid))}
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
                                    dropzoneText="파일을 끌어놓거나 클릭하여 첨부하세요"
                                    onAttachedFilesChange={handleAttachedFilesChange}
                                />
                                <Typography sx={{ fontSize: "13.5px", color: "#111" }}>
                                    첨부는 파일당 최대 {MAX_ATTACHMENT_MB}MB 입니다.
                                </Typography>
                            </Box>
                        </Box>
                    ),
                },
            ]}
            actions={{
                visible: true,
                left: (
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
                        {sending ? <CircularProgress size={20} color="inherit" /> : "보내기"}
                    </Button>
                ),
            }}
        />
    );
}
