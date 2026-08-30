/**
 * 메일 계정 등록/수정 다이얼로그(mfd) — 기본 · 수신 서버 · 발신 서버 · 서명 + 접속 테스트.
 *
 * 메일 주소를 입력하면 도메인 프리셋(gmail/naver/daum…)으로 호스트/포트를 자동 채운다(이미 입력돼 있으면 건드리지 않는다).
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { EhfuseEditor } from "@ehfuse/editor";
import type { EditorConfig, EhfuseEditorRef } from "@ehfuse/editor";
import type { ToolbarConfig } from "@ehfuse/editor/dist/toolbar/Preset";
import { Alert, Box, Button, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { ConfirmDialog } from "@ehfuse/alerts";
import type { FormDialogSection } from "@ehfuse/mui-form-dialog";
import { ClearTextField, NumberTextField, PasswordTextField, Select, Switch } from "@ehfuse/mui-form-controls";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaFormDialog, useMuaIsAdmin } from "../../MuaProvider";
import type { MailAccountFormController } from "../../controllers/mailAccountFormController";
import type { ConnectionSecurity, IncomingProtocol } from "../../models/types";
import { defaultIncomingPort, defaultSmtpPort, findMailPreset } from "../../utils/presets";

interface MailAccountFormDialogProps {
    controller: MailAccountFormController; // 컨트롤러
}

/** 콘텐츠 상·하 패딩(px) — mfd FormDialog 의 contentTopPadding 기본값과 같은 값으로 아래도 맞춘다. */
const MAIL_ACCOUNT_DIALOG_CONTENT_PADDING = 24;

/** 섹션 본문 — 줄 간격을 통일한다. */
const SECTION_SX = { display: "flex", flexDirection: "column", gap: 2.5, width: "100%" } as const;
/** 2열(아이디/비밀번호, 폴더/간격 등). */
const ROW_2_SX = {
    display: "grid",
    gap: 2.5,
    alignItems: "start",
    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
} as const;
/** 수신 서버 첫 줄 [프로토콜][호스트] — 균등 2열. */
const ROW_INCOMING_SX = {
    display: "grid",
    gap: 2.5,
    alignItems: "start",
    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
} as const;
/** 발신 서버 첫 줄 [호스트][보안 130px][포트 90px]. */
const ROW_SMTP_SX = {
    display: "grid",
    gap: 2.5,
    alignItems: "start",
    gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 130px 90px" },
} as const;
/** 서명 에디터 툴바 — sm 폭에 맞춰 서명에 필요한 것만(굵게/기울임/밑줄 · 글자색 · 링크/이미지 · 서식 지우기). */
const SIGNATURE_TOOLBAR: ToolbarConfig = {
    left: [["bold", "italic", "underline"], ["color"], ["link", "image"], ["clear"]],
    right: [],
};

/** 섹션 하단 안내 문구. */
const NOTE_SX = { fontSize: "15px", color: "#111" } as const;

const PROTOCOL_OPTIONS = [
    { value: "imap", label: "IMAP (권장 — 서버와 동기화)" },
    { value: "pop3", label: "POP3 (내려받기)" },
];
const SECURITY_OPTIONS = [
    { value: "ssl", label: "SSL/TLS" },
    { value: "starttls", label: "STARTTLS" },
    { value: "none", label: "없음(평문)" },
];

/** 메일 계정 다이얼로그 컴포넌트 */
export function MailAccountFormDialog({ controller }: MailAccountFormDialogProps) {
    // 모바일은 풀스크린 우→좌 슬라이드(고정 높이 없음).
    const isMobile = useIsMobile();
    const { form, modal, testing, testResult, testConnection, removeAccount, clearTestResult } = controller;
    const seq = Number(form.useFormValue("seq") ?? 0);
    const email = String(form.useFormValue("email") ?? "");
    const isShared = Boolean(form.useFormValue("is_shared"));
    // 서명 에디터 — 작성 창(ComposeDialog)과 같은 동기화 패턴(입력→폼 / 폼→에디터, 에코 방지 ref).
    const signature = String(form.useFormValue("signature") ?? "");
    const signatureEditorRef = useRef<EhfuseEditorRef>(null);
    const lastSyncedSignatureRef = useRef<string | null>(null);
    const signatureEditorConfig = useMemo<EditorConfig>(
        () => ({
            placeholder: "서명을 입력하세요 (메일 본문 끝에 붙습니다)",
            // 모바일은 서식 편집이 어려워 툴바를 감추고 내용 높이에 맞춘다(새 메일·업무함과 같은 규칙).
            minHeight: isMobile ? 140 : 180,
            showToolbar: !isMobile,
            autoHeight: isMobile,
            locale: "ko",
            onChange: (html: string) => {
                lastSyncedSignatureRef.current = html;
                form.setFormValue("signature", html);
            },
            styles: { borderWidth: 0 },
        }),
        [form, isMobile]
    );
    useEffect(() => {
        if (!modal.isOpen) {
            lastSyncedSignatureRef.current = null;
            return;
        }
        if (lastSyncedSignatureRef.current === signature) return;
        lastSyncedSignatureRef.current = signature;
        signatureEditorRef.current?.setHtml(signature);
    }, [signature, modal.isOpen]);
    // 공용 계정 등록/전환은 라이선스 관리자만(AS 도 같은 규칙으로 403).
    const isAdmin = useMuaIsAdmin();
    const FormDialog = useMuaFormDialog();
    const protocol = String(form.useFormValue("incoming_protocol") ?? "imap") as IncomingProtocol;
    const incomingSecurity = String(form.useFormValue("incoming_security") ?? "ssl") as ConnectionSecurity;
    const smtpSecurity = String(form.useFormValue("smtp_security") ?? "ssl") as ConnectionSecurity;
    const useIncomingAuth = form.useFormValue("smtp_use_incoming_auth") !== false;
    const isSubmitting = Boolean(form.isSubmitting);

    useEffect(() => {
        if (!modal.isOpen) clearTestResult();
    }, [modal.isOpen, clearTestResult]);

    // 공용 계정은 기본 발신 대상이 아니다 — 켜면 기본 발신을 내린다.
    useEffect(() => {
        if (isShared && form.getFormValue("is_default")) form.setFormValue("is_default", false);
    }, [isShared, form]);

    const preset = useMemo(() => findMailPreset(email), [email]);

    /** 메일 주소 입력을 마치면 프리셋으로 빈 서버 필드를 채운다. */
    const applyPreset = useCallback(() => {
        const values = form.getFormValues();
        const found = findMailPreset(values.email);
        if (!values.incoming_username) form.setFormValue("incoming_username", values.email.trim());
        if (!found) return;
        if (!values.incoming_host) {
            form.setFormValue("incoming_host", values.incoming_protocol === "pop3" ? found.pop3_host : found.imap_host);
            form.setFormValue("incoming_security", "ssl");
            form.setFormValue("incoming_port", defaultIncomingPort(values.incoming_protocol, "ssl"));
        }
        if (!values.smtp_host) {
            form.setFormValue("smtp_host", found.smtp_host);
            form.setFormValue("smtp_security", found.smtp_security);
            form.setFormValue("smtp_port", found.smtp_port);
        }
    }, [form]);

    /** 프로토콜/보안이 바뀌면 포트를 기본값으로 맞춘다(프리셋 호스트도 프로토콜에 맞춰 교체). */
    const handleProtocolChange = useCallback(
        (next: IncomingProtocol) => {
            const values = form.getFormValues();
            form.setFormValue("incoming_port", defaultIncomingPort(next, values.incoming_security));
            const found = findMailPreset(values.email);
            if (found && (values.incoming_host === found.imap_host || values.incoming_host === found.pop3_host)) {
                form.setFormValue("incoming_host", next === "pop3" ? found.pop3_host : found.imap_host);
            }
        },
        [form]
    );

    const handleDelete = useCallback(() => {
        if (!(seq > 0)) return;
        ConfirmDialog({
            title: "메일 계정 삭제",
            message: "이 계정과 받은/보낸 메일이 모두 삭제됩니다. 삭제하시겠습니까?",
            onConfirm: () => void removeAccount(seq),
        });
    }, [seq, removeAccount]);

    const sections = useMemo<FormDialogSection[]>(
        () => [
            {
                id: "mail-account-basic",
                title: "기본 정보",
                showTitle: true,
                children: (
                    <Box sx={SECTION_SX}>
                        <Box sx={ROW_2_SX}>
                            <ClearTextField
                                name="email"
                                label="메일 주소 *"
                                form={form}
                                fullWidth
                                autoComplete="off"
                                onBlur={applyPreset}
                            />
                            <ClearTextField name="name" label="보내는 사람 이름" form={form} fullWidth />
                        </Box>
                        {/* 스위치 — 모바일은 한 줄에 하나씩(세로), 데스크톱은 가로 나열 */}
                        <Stack
                            direction={isMobile ? "column" : "row"}
                            spacing={isMobile ? 0.5 : 3}
                            sx={{ flexWrap: "wrap", alignItems: isMobile ? "flex-start" : "center", minHeight: 40 }}
                        >
                            {isAdmin || isShared ? (
                                <Switch form={form} name="is_shared" label="공용 계정" disabled={!isAdmin} />
                            ) : null}
                            {!isShared ? <Switch form={form} name="is_default" label="기본 발신 계정" /> : null}
                        </Stack>
                        {isShared ? (
                            <Typography sx={NOTE_SX}>
                                공용 계정의 받은편지함·보낸편지함은 같은 회사 전원이 보고 보낼 수 있습니다. 읽음/중요
                                표시는 함께 공유되고, 임시보관은 작성자 본인만 봅니다. 수정·삭제는 관리자 또는 등록자만
                                할 수 있습니다.
                            </Typography>
                        ) : null}
                        {preset?.note ? (
                            <Alert severity="info" sx={{ fontSize: "15px", color: "#111" }}>
                                {preset.note}
                                {preset.note_url ? (
                                    <>
                                        {" "}
                                        <Link
                                            href={preset.note_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ fontSize: "15px", fontWeight: 600 }}
                                        >
                                            {preset.note_link_label ?? "설정 방법 보기"} ↗
                                        </Link>
                                    </>
                                ) : null}
                            </Alert>
                        ) : null}
                    </Box>
                ),
            },
            {
                id: "mail-account-incoming",
                title: "수신 서버",
                showTitle: true,
                children: (
                    <Box sx={SECTION_SX}>
                        {/* [프로토콜][호스트] */}
                        <Box sx={ROW_INCOMING_SX}>
                            <Select
                                label="프로토콜"
                                showEmptyOption={false}
                                name="incoming_protocol"
                                form={form}
                                options={PROTOCOL_OPTIONS}
                                onChange={(event: { target: { value: unknown } }) =>
                                    handleProtocolChange(String(event.target.value) as IncomingProtocol)
                                }
                            />
                            <ClearTextField
                                name="incoming_host"
                                label="호스트 *"
                                form={form}
                                fullWidth
                                placeholder="imap.example.com"
                            />
                        </Box>
                        {/* [보안][포트] */}
                        <Box sx={ROW_2_SX}>
                            <Select
                                label="보안"
                                showEmptyOption={false}
                                name="incoming_security"
                                form={form}
                                options={SECURITY_OPTIONS}
                                onChange={(event: { target: { value: unknown } }) =>
                                    form.setFormValue(
                                        "incoming_port",
                                        defaultIncomingPort(protocol, String(event.target.value) as ConnectionSecurity)
                                    )
                                }
                            />
                            <NumberTextField name="incoming_port" label="포트" form={form} fullWidth />
                        </Box>
                        {/* [아이디][비밀번호] */}
                        <Box sx={ROW_2_SX}>
                            <ClearTextField
                                name="incoming_username"
                                label="아이디"
                                form={form}
                                fullWidth
                                autoComplete="off"
                                placeholder="비우면 메일 주소를 사용"
                            />
                            <PasswordTextField
                                name="incoming_password"
                                label="비밀번호 *"
                                form={form}
                                fullWidth
                                autoComplete="new-password"
                            />
                        </Box>
                        <Box sx={ROW_2_SX}>
                            <NumberTextField
                                name="sync_interval_min"
                                label="자동 수신 간격(분)"
                                form={form}
                                fullWidth
                            />
                            {protocol === "imap" ? (
                                <ClearTextField
                                    name="imap_mailbox"
                                    label="수신 폴더 (IMAP)"
                                    form={form}
                                    fullWidth
                                    placeholder="INBOX"
                                />
                            ) : (
                                <Box sx={{ display: "flex", alignItems: "center", minHeight: 56 }}>
                                    <Switch form={form} name="pop3_delete_after_fetch" label="받은 뒤 서버에서 삭제" />
                                </Box>
                            )}
                        </Box>
                        <Typography sx={NOTE_SX}>
                            {incomingSecurity === "none"
                                ? "⚠ 평문 접속은 비밀번호가 노출될 수 있습니다."
                                : protocol === "imap"
                                  ? "IMAP · " +
                                    incomingSecurity.toUpperCase() +
                                    " — 수신 폴더는 서버에서 받은편지함으로 가져올 폴더이며 보통 INBOX 그대로 둡니다."
                                  : "POP3 · " +
                                    incomingSecurity.toUpperCase() +
                                    " — 여러 기기에서 함께 쓰려면 IMAP 을 권장합니다."}
                        </Typography>
                    </Box>
                ),
            },
            {
                id: "mail-account-smtp",
                title: "발신 서버",
                showTitle: true,
                children: (
                    <Box sx={SECTION_SX}>
                        {/* [호스트][보안][포트] */}
                        <Box sx={ROW_SMTP_SX}>
                            <ClearTextField
                                name="smtp_host"
                                label="호스트 *"
                                form={form}
                                fullWidth
                                placeholder="smtp.example.com"
                            />
                            <Select
                                label="보안"
                                showEmptyOption={false}
                                name="smtp_security"
                                form={form}
                                options={SECURITY_OPTIONS}
                                onChange={(event: { target: { value: unknown } }) =>
                                    form.setFormValue(
                                        "smtp_port",
                                        defaultSmtpPort(String(event.target.value) as ConnectionSecurity)
                                    )
                                }
                            />
                            <NumberTextField name="smtp_port" label="포트" form={form} fullWidth />
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", minHeight: 40 }}>
                            <Switch
                                form={form}
                                name="smtp_use_incoming_auth"
                                label="수신 서버와 같은 아이디/비밀번호 사용"
                            />
                        </Box>
                        {!useIncomingAuth ? (
                            <Box sx={ROW_2_SX}>
                                <ClearTextField
                                    name="smtp_username"
                                    label="SMTP 아이디"
                                    form={form}
                                    fullWidth
                                    autoComplete="off"
                                />
                                <PasswordTextField
                                    name="smtp_password"
                                    label="SMTP 비밀번호 *"
                                    form={form}
                                    fullWidth
                                    autoComplete="new-password"
                                />
                            </Box>
                        ) : null}
                        <Typography sx={NOTE_SX}>SMTP · {smtpSecurity.toUpperCase()}</Typography>
                    </Box>
                ),
            },
            {
                id: "mail-account-signature",
                title: "서명",
                showTitle: true,
                children: (
                    <Box sx={SECTION_SX}>
                        <Box
                            sx={{
                                border: "1px solid",
                                borderColor: "rgba(0,0,0,0.23)",
                                borderRadius: 1,
                                overflow: "hidden",
                            }}
                        >
                            <EhfuseEditor
                                ref={signatureEditorRef}
                                defaultValue={signature}
                                toolbarOptions={SIGNATURE_TOOLBAR}
                                {...signatureEditorConfig}
                            />
                        </Box>
                        <Typography sx={NOTE_SX}>새 메일·답장 본문 끝에 자동으로 붙습니다.</Typography>
                    </Box>
                ),
            },
        ],
        [
            form,
            applyPreset,
            handleProtocolChange,
            preset,
            protocol,
            incomingSecurity,
            smtpSecurity,
            useIncomingAuth,
            isShared,
            isAdmin,
            signature,
            signatureEditorConfig,
        ]
    );

    return (
        <FormDialog
            fontScaleKey="MailAccountFormDialog"
            backdropClick={false}
            open={modal.isOpen}
            onClose={modal.close}
            title={{ text: `${isShared ? "공용 " : ""}메일 계정 ${seq > 0 ? "수정" : "등록"}` }}
            titleIcons={{ delete: { visible: false } }}
            // 섹션 탭(기본 정보/수신/발신/서명)을 보여 주고, 콘텐츠 높이는 800px 로 고정한다(탭 전환 시 크기 점프 방지).
            // 모바일은 풀스크린 슬라이드라 고정 높이를 두지 않는다(화면 높이를 그대로 쓴다).
            fixedHeight={isMobile ? undefined : 800}
            maxContentHeight={isMobile ? undefined : 800}
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            // 모바일은 섹션 탭(기본/수신/발신/서명)을 숨긴다 — 좁아서 잘리고, 어차피 한 화면을 스크롤한다.
            tabs={{ visible: !isMobile }}
            // 모바일 액션바 — 왼쪽 슬롯·래퍼를 전폭으로 늘려 3열 버튼이 화면 폭을 균등하게 나눠 갖게 한다.
            sx={
                isMobile
                    ? {
                          DialogActions: {
                              "& .left-actions": { flex: 1, minWidth: 0, width: "100%" },
                              "& .left-actions > *": { flex: 1, minWidth: 0, width: "100%" },
                              "& .right-actions": { display: "none" },
                          },
                      }
                    : undefined
            }
            locale="ko"
            maxWidth="sm"
            // 마지막 섹션 아래 자동 스크롤 여백은 끄고, 하단 패딩은 상단 패딩(mfd contentTopPadding 기본값)과 같게 둔다.
            scrollPastLastSection={false}
            contentBottomPadding={MAIL_ACCOUNT_DIALOG_CONTENT_PADDING}
            sections={sections}
            onDelete={seq > 0 ? handleDelete : undefined}
            actions={{
                visible: true,
                // 모바일은 mfd 기본 취소 대신 [접속 테스트][취소][저장] 을 균등 3열로 직접 그린다(테스트 결과는 그 위 한 줄).
                showCancelButton: !isMobile,
                ...(isMobile
                    ? {
                          left: (
                              <Stack spacing={1} sx={{ width: "100%" }}>
                                  {testResult ? (
                                      <Typography sx={{ fontSize: "14px", color: "#111", wordBreak: "break-word" }}>
                                          수신 {testResult.incoming.ok ? "✅" : `❌ ${testResult.incoming.error ?? ""}`}{" "}
                                          · 발신 {testResult.smtp.ok ? "✅" : `❌ ${testResult.smtp.error ?? ""}`}
                                      </Typography>
                                  ) : null}
                                  <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                                      <Button
                                          variant="outlined"
                                          onClick={() => void testConnection()}
                                          disabled={testing || isSubmitting}
                                          sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                      >
                                          {testing ? <CircularProgress size={20} color="inherit" /> : "접속 테스트"}
                                      </Button>
                                      <Button
                                          variant="outlined"
                                          color="inherit"
                                          onClick={modal.close}
                                          disabled={isSubmitting || testing}
                                          sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                      >
                                          취소
                                      </Button>
                                      <Button
                                          variant="contained"
                                          color="primary"
                                          onClick={() => void form.submit()}
                                          disabled={isSubmitting || testing}
                                          sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                      >
                                          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "저장"}
                                      </Button>
                                  </Stack>
                              </Stack>
                          ),
                      }
                    : {
                          left: (
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Button
                                      variant="outlined"
                                      onClick={() => void testConnection()}
                                      disabled={testing || isSubmitting}
                                      sx={{ minWidth: 110 }}
                                  >
                                      {testing ? <CircularProgress size={20} color="inherit" /> : "접속 테스트"}
                                  </Button>
                                  {testResult ? (
                                      <Typography sx={{ fontSize: "15px", color: "#111" }}>
                                          수신 {testResult.incoming.ok ? "✅" : `❌ ${testResult.incoming.error ?? ""}`}{" "}
                                          · 발신 {testResult.smtp.ok ? "✅" : `❌ ${testResult.smtp.error ?? ""}`}
                                      </Typography>
                                  ) : null}
                              </Stack>
                          ),
                          right: (
                              <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() => void form.submit()}
                                  disabled={isSubmitting || testing}
                                  sx={{ minWidth: 80 }}
                              >
                                  {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "저장"}
                              </Button>
                          ),
                      }),
            }}
        />
    );
}
