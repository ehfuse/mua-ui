/**
 * 기업메일 사서함 프로필 다이얼로그 — 보내는 사람 이름 · 기본 발신 · 서명.
 *
 * 사서함 자체(주소·수신/발신 서버·담당자)는 팀 관리 › 기업메일 소관이라 여기서 못 고친다.
 * 하지만 **보내는 사람 이름과 서명은 사서함 설정이 아니라 쓰는 사람의 것**이라(같은 주소라도 담당이 바뀌면
 * 이름·서명이 따라 바뀐다) 계정 목록의 연필에서 바로 고칠 수 있어야 한다(2026-09-07).
 * 외부 계정 폼(MailAccountFormDialog)을 재사용하지 않는 이유는 그쪽이 호스트·포트·비밀번호를 필수로 검증하고
 * 저장 시 행 전체를 다시 쓰기 때문이다 — 여기서 열면 Postfix 가 읽는 값까지 덮어쓴다.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { EhfuseEditor } from "@ehfuse/editor";
import type { EditorConfig, EhfuseEditorRef } from "@ehfuse/editor";
import type { ToolbarConfig } from "@ehfuse/editor/dist/toolbar/Preset";
import { Box, Button, CircularProgress, FormControlLabel, Switch, TextField, Typography } from "@mui/material";
import { ErrorAlert, SuccessAlert } from "@ehfuse/alerts";
import type { FormDialogSection } from "@ehfuse/mui-form-dialog";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaFormDialog } from "../../MuaProvider";
import { mailApi, unwrap } from "../../apis/mailApi";
import type { MailAccount } from "../../models/types";

interface MailHostedProfileDialogProps {
    open: boolean;
    account: MailAccount | null; // 고칠 사서함(닫힌 동안 null)
    onClose: () => void;
    onSaved: () => void; // 저장 후 목록 재조회
}

/** 서명 툴바 — 외부 계정 폼과 같은 구성(굵게/기울임/밑줄 · 글자색 · 링크/이미지 · 서식 지우기). */
const SIGNATURE_TOOLBAR: ToolbarConfig = {
    left: [["bold", "italic", "underline"], ["color"], ["link", "image"], ["clear"]],
    right: [],
};

const NOTE_SX = { fontSize: "15px", color: "#111" } as const;

export function MailHostedProfileDialog({ open, account, onClose, onSaved }: MailHostedProfileDialogProps) {
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const [name, setName] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [signature, setSignature] = useState("");
    const [saving, setSaving] = useState(false);
    const signatureEditorRef = useRef<EhfuseEditorRef>(null);

    const seq = account?.seq ?? 0;
    // 열 때 한 번만 값을 넣는다 — 목록이 새로 그려질 때마다 되돌리면 입력 중인 글자가 사라진다.
    useEffect(() => {
        if (!open || !account) return;
        setName(account.name ?? "");
        setIsDefault(Boolean(account.is_default));
        setSignature(account.signature ?? "");
        // 에디터는 defaultValue 로 초기화되지 않는 경우가 있어(재사용 마운트) 직접 밀어 넣는다.
        signatureEditorRef.current?.setHtml(account.signature ?? "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, seq]);

    const editorConfig = useMemo<EditorConfig>(
        () => ({
            placeholder: "서명을 입력하세요 (메일 본문 끝에 붙습니다)",
            minHeight: isMobile ? 140 : 180,
            showToolbar: !isMobile,
            autoHeight: isMobile,
            locale: "ko",
            onChange: (html: string) => setSignature(html),
            styles: { borderWidth: 0 },
        }),
        [isMobile]
    );

    const handleSave = async () => {
        if (!account) return;
        setSaving(true);
        try {
            unwrap(
                await mailApi.updateHostedProfile(account.seq, {
                    name: name.trim(),
                    signature,
                    is_default: isDefault,
                }),
                "저장하지 못했습니다."
            );
            SuccessAlert("저장했습니다.");
            onClose();
            onSaved();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "저장하지 못했습니다." });
        } finally {
            setSaving(false);
        }
    };

    const sections = useMemo<FormDialogSection[]>(
        () => [
            {
                id: "hosted-profile",
                showTitle: false,
                children: (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%" }}>
                        {/* 주소는 고칠 수 없다 — 여기서 바꾸면 Postfix 가 받는 주소와 어긋난다. 값은 보여야 어느 사서함인지 안다.
                            disabled 가 아니라 readOnly 다 — 지금 못 쓰는 칸이 아니라 못 **고치는** 값이라,
                            글자는 다른 칸과 같은 검정으로 읽혀야 한다(회색이면 값이 비활성처럼 보인다). */}
                        <TextField
                            label="메일 주소"
                            value={account?.email ?? ""}
                            fullWidth
                            slotProps={{ input: { readOnly: true } }}
                        />
                        <TextField
                            label="보내는 사람 이름"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            autoComplete="off"
                        />
                        <Box sx={{ display: "flex", alignItems: "center", minHeight: 40 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isDefault}
                                        onChange={(e) => setIsDefault(e.target.checked)}
                                    />
                                }
                                label="기본 발신 계정"
                            />
                        </Box>
                        <Box
                            sx={{
                                border: "1px solid",
                                borderColor: "rgba(0,0,0,0.23)",
                                borderRadius: 1,
                                overflow: "hidden",
                                // 높이는 이 상자가 정한다(에디터는 부모에서 높이를 받는다 — 외부 계정 폼과 같은 이유).
                                height: { xs: 180, sm: 220 },
                                display: "flex",
                                flexDirection: "column",
                                "& > div": { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" },
                                "& .ehfuse-editor-container": { flex: 1, minHeight: 0 },
                            }}
                        >
                            <EhfuseEditor
                                ref={signatureEditorRef}
                                defaultValue={signature}
                                toolbarOptions={SIGNATURE_TOOLBAR}
                                {...editorConfig}
                            />
                        </Box>
                        <Typography sx={NOTE_SX}>
                            서명은 새 메일·답장 본문 끝에 자동으로 붙습니다. 주소와 수신 설정은 팀 관리 › 기업메일에서
                            바꿉니다.
                        </Typography>
                    </Box>
                ),
            },
        ],
        [account?.email, name, isDefault, signature, editorConfig]
    );

    return (
        <FormDialog
            fontScaleKey="MailHostedProfileDialog"
            backdropClick={false}
            open={open}
            onClose={onClose}
            title={{ text: "기업메일 사서함 설정" }}
            titleIcons={{ delete: { visible: false } }}
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="sm"
            scrollPastLastSection={false}
            sections={sections}
            actions={{
                visible: true,
                showCancelButton: true,
                right: (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => void handleSave()}
                        disabled={saving}
                        sx={{ minWidth: 80 }}
                    >
                        {saving ? <CircularProgress size={20} color="inherit" /> : "저장"}
                    </Button>
                ),
            }}
        />
    );
}
