import { formDialogLocale, t } from "../../i18n";
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
import { useMuaConfig, useMuaCurrentTeamSeq, useMuaFormDialog, useMuaIsAdmin, useMuaTeams } from "../../MuaProvider";
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
    { value: "imap", get label() { return t("protocolImap"); } },
    { value: "pop3", get label() { return t("protocolPop3"); } },
];
const SECURITY_OPTIONS = [
    { value: "ssl", label: "SSL/TLS" },
    { value: "starttls", label: "STARTTLS" },
    { value: "none", get label() { return t("securityNone"); } },
];

/** 메일 계정 다이얼로그 컴포넌트 */
export function MailAccountFormDialog({ controller }: MailAccountFormDialogProps) {
    // 모바일은 풀스크린 우→좌 슬라이드(고정 높이 없음).
    const isMobile = useIsMobile();
    // 안내 링크(앱 비밀번호 만드는 방법 등) — 앱 웹뷰는 새 탭이 없어 소비처 주입(외부 브라우저)으로 연다.
    const { openExternalUrl } = useMuaConfig();
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
            placeholder: t("signaturePlaceholder"),
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
    // 공용 계정 등록/전환 — 팀 주입 앱은 팀 owner/manager, 그 외(단일 조직)는 라이선스 관리자만(AS 도 같은 규칙으로 403).
    const isAdmin = useMuaIsAdmin();
    const teams = useMuaTeams();
    const currentTeamSeq = useMuaCurrentTeamSeq();
    // 공용으로 만들 수 있는 팀 — owner/manager 인 팀(운영사 admin 은 전 팀).
    const shareableTeams = useMemo(
        () => (isAdmin ? teams : teams.filter((t) => t.role === "owner" || t.role === "manager")),
        [teams, isAdmin]
    );
    const canShare = teams.length > 0 ? shareableTeams.length > 0 : isAdmin;
    const FormDialog = useMuaFormDialog();
    const protocol = String(form.useFormValue("incoming_protocol") ?? "imap") as IncomingProtocol;
    const incomingSecurity = String(form.useFormValue("incoming_security") ?? "ssl") as ConnectionSecurity;
    const useIncomingAuth = form.useFormValue("smtp_use_incoming_auth") !== false;
    const isSubmitting = Boolean(form.isSubmitting);

    useEffect(() => {
        if (!modal.isOpen) clearTestResult();
    }, [modal.isOpen, clearTestResult]);

    // 공용 계정은 기본 발신 대상이 아니다 — 켜면 기본 발신을 내린다.
    useEffect(() => {
        if (isShared && form.getFormValue("is_default")) form.setFormValue("is_default", false);
    }, [isShared, form]);

    // 공용을 켰는데 팀이 비어 있으면 기본 팀(현재 팀, 없으면 첫 후보)을 채운다 — 신규 등록에서만.
    useEffect(() => {
        if (!isShared || seq > 0 || shareableTeams.length === 0) return;
        if (Number(form.getFormValue("team_seq") ?? 0) > 0) return;
        const fallback = shareableTeams.some((t) => t.seq === currentTeamSeq) ? currentTeamSeq : shareableTeams[0].seq;
        form.setFormValue("team_seq", fallback);
    }, [isShared, seq, shareableTeams, currentTeamSeq, form]);

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
            title: t("deleteAccount"),
            message: t("deleteAccountConfirm"),
            onConfirm: () => void removeAccount(seq),
        });
    }, [seq, removeAccount]);

    const sections = useMemo<FormDialogSection[]>(
        () => [
            {
                id: "mail-account-basic",
                title: t("basicInfo"),
                showTitle: true,
                children: (
                    <Box sx={SECTION_SX}>
                        <Box sx={ROW_2_SX}>
                            <ClearTextField
                                name="email"
                                label={t("emailRequired")}
                                form={form}
                                fullWidth
                                autoComplete="off"
                                onBlur={applyPreset}
                            />
                            <ClearTextField name="name" label={t("senderName")} form={form} fullWidth />
                        </Box>
                        {/* 스위치 — 모바일은 한 줄에 하나씩(세로), 데스크톱은 가로 나열 */}
                        <Stack
                            direction={isMobile ? "column" : "row"}
                            spacing={isMobile ? 0.5 : 3}
                            sx={{ flexWrap: "wrap", alignItems: isMobile ? "flex-start" : "center", minHeight: 40 }}
                        >
                            {canShare || isShared ? (
                                <Switch form={form} name="is_shared" label={t("sharedAccount")} disabled={!canShare} />
                            ) : null}
                            {!isShared ? <Switch form={form} name="is_default" label={t("defaultSendAccount")} /> : null}
                        </Stack>
                        {/* 어느 팀의 공용인지 — 팀 주입 앱에서 신규 등록일 때만 고른다(팀은 등록 후 바꾸지 않는다). */}
                        {isShared && seq === 0 && shareableTeams.length > 0 ? (
                            <Select
                                form={form}
                                name="team_seq"
                                label={t("sharedTeam")}
                                options={shareableTeams.map((t) => ({ value: t.seq, label: t.name }))}
                                showEmptyOption={false}
                                fullWidth={false}
                                formControlProps={{ sx: { width: 240 } }}
                            />
                        ) : null}
                        {isShared ? (
                            <Typography sx={NOTE_SX}>
                                {teams.length > 0 ? t("sharedAccountNoteTeam") : t("sharedAccountNoteCompany")}
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
                                            onClick={(event) => {
                                                if (!openExternalUrl || !preset.note_url) return;
                                                event.preventDefault();
                                                openExternalUrl(preset.note_url);
                                            }}
                                            sx={{ fontSize: "15px", fontWeight: 600 }}
                                        >
                                            {preset.note_link_label ?? t("howToSetUp")} ↗
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
                title: t("incomingServer"),
                showTitle: true,
                children: (
                    <Box sx={SECTION_SX}>
                        {/* [프로토콜][호스트] */}
                        <Box sx={ROW_INCOMING_SX}>
                            <Select
                                label={t("protocol")}
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
                                label={t("hostRequired")}
                                form={form}
                                fullWidth
                                placeholder="imap.example.com"
                            />
                        </Box>
                        {/* [보안][포트] */}
                        <Box sx={ROW_2_SX}>
                            <Select
                                label={t("security")}
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
                            <NumberTextField name="incoming_port" label={t("port")} form={form} fullWidth />
                        </Box>
                        {/* [아이디][비밀번호] */}
                        <Box sx={ROW_2_SX}>
                            <ClearTextField
                                name="incoming_username"
                                label={t("username")}
                                form={form}
                                fullWidth
                                autoComplete="off"
                                placeholder={t("usernamePlaceholder")}
                            />
                            <PasswordTextField
                                name="incoming_password"
                                label={t("passwordRequired")}
                                form={form}
                                fullWidth
                                autoComplete="new-password"
                            />
                        </Box>
                        <Box sx={ROW_2_SX}>
                            <NumberTextField
                                name="sync_interval_min"
                                label={t("fetchInterval")}
                                form={form}
                                fullWidth
                            />
                            {protocol === "imap" ? (
                                <ClearTextField
                                    name="imap_mailbox"
                                    label={t("incomingFolder")}
                                    form={form}
                                    fullWidth
                                    placeholder="INBOX"
                                />
                            ) : (
                                <Box sx={{ display: "flex", alignItems: "center", minHeight: 56 }}>
                                    <Switch form={form} name="pop3_delete_after_fetch" label={t("deleteAfterFetch")} />
                                </Box>
                            )}
                        </Box>
                        <Typography sx={NOTE_SX}>
                            {incomingSecurity === "none"
                                ? t("plainTextWarning")
                                : protocol === "imap"
                                  ? t("imapNote", { security: incomingSecurity.toUpperCase() })
                                  : t("pop3Note", { security: incomingSecurity.toUpperCase() })}
                        </Typography>
                    </Box>
                ),
            },
            {
                id: "mail-account-smtp",
                title: t("outgoingServer"),
                showTitle: true,
                children: (
                    <Box sx={SECTION_SX}>
                        {/* [호스트][보안][포트] */}
                        <Box sx={ROW_SMTP_SX}>
                            <ClearTextField
                                name="smtp_host"
                                label={t("hostRequired")}
                                form={form}
                                fullWidth
                                placeholder="smtp.example.com"
                            />
                            <Select
                                label={t("security")}
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
                            <NumberTextField name="smtp_port" label={t("port")} form={form} fullWidth />
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", minHeight: 40 }}>
                            <Switch
                                form={form}
                                name="smtp_use_incoming_auth"
                                label={t("sameCredentials")}
                            />
                        </Box>
                        {!useIncomingAuth ? (
                            <Box sx={ROW_2_SX}>
                                <ClearTextField
                                    name="smtp_username"
                                    label={t("smtpUsername")}
                                    form={form}
                                    fullWidth
                                    autoComplete="off"
                                />
                                <PasswordTextField
                                    name="smtp_password"
                                    label={t("smtpPasswordRequired")}
                                    form={form}
                                    fullWidth
                                    autoComplete="new-password"
                                />
                            </Box>
                        ) : null}
                    </Box>
                ),
            },
            {
                id: "mail-account-signature",
                title: t("signature"),
                showTitle: true,
                children: (
                    <Box sx={SECTION_SX}>
                        <Box
                            sx={{
                                border: "1px solid",
                                borderColor: "rgba(0,0,0,0.23)",
                                borderRadius: 1,
                                overflow: "hidden",
                                // 높이는 **이 상자**가 정한다. 에디터는 autoHeight 가 아니면 내용 영역에
                                // `.fixed-height { flex:1; height:0; min-height:0 }` 를 걸고 높이를 부모에서 받으므로,
                                // 부모에 높이가 없으면 config.minHeight 를 아무리 키워도 한 줄로 눌린다(2026-09-07).
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
                                {...signatureEditorConfig}
                            />
                        </Box>
                        <Typography sx={NOTE_SX}>{t("signatureNote")}</Typography>
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
            // "외부" 를 붙인다 — 이 앱에는 기업메일(우리 도메인 사서함)이 따로 있어 그냥 "메일 계정" 이면 갈리지 않는다.
            title={{ text: isShared ? (seq > 0 ? t("editSharedAccount") : t("addSharedAccount")) : seq > 0 ? t("editAccount") : t("addAccount") }}
            titleIcons={{ delete: { visible: false } }}
            // 섹션 탭(기본 정보/수신/발신/서명)을 보여 주고, 콘텐츠 높이는 800px 로 고정한다(탭 전환 시 크기 점프 방지).
            // 모바일은 풀스크린 슬라이드라 고정 높이를 두지 않는다(화면 높이를 그대로 쓴다).
            fixedHeight={isMobile ? undefined : 800}
            maxContentHeight={isMobile ? undefined : 800}
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            // 섹션 탭(기본/수신/발신/서명)은 숨긴다 — 한 화면을 스크롤하면 다 보이고, 섹션 제목과 같은 말이 두 번 선다(2026-10-01).
            tabs={{ visible: false }}
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
            locale={formDialogLocale()}
            // sm(600)은 수신 서버 줄(프로토콜·호스트)이 눌려 보였고 md(900)는 너무 넓다 — 그 사이 680 으로 직접 잡는다(2026-10-01).
            width={isMobile ? undefined : 680}
            maxWidth="md"
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
                                          {t("testIncoming", { result: testResult.incoming.ok ? "✅" : `❌ ${testResult.incoming.error ?? ""}` })}{" "}
                                          · {t("testOutgoing", { result: testResult.smtp.ok ? "✅" : `❌ ${testResult.smtp.error ?? ""}` })}
                                      </Typography>
                                  ) : null}
                                  <Stack direction="row" sx={{ width: "100%", gap: 1.5 }}>
                                      <Button
                                          variant="outlined"
                                          onClick={() => void testConnection()}
                                          disabled={testing || isSubmitting}
                                          sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                      >
                                          {testing ? <CircularProgress size={20} color="inherit" /> : t("testConnection")}
                                      </Button>
                                      <Button
                                          variant="outlined"
                                          color="inherit"
                                          onClick={modal.close}
                                          disabled={isSubmitting || testing}
                                          sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                      >
                                          {t("cancel")}
                                      </Button>
                                      <Button
                                          variant="contained"
                                          color="primary"
                                          onClick={() => void form.submit()}
                                          disabled={isSubmitting || testing}
                                          sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                                      >
                                          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : t("save")}
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
                                      {testing ? <CircularProgress size={20} color="inherit" /> : t("testConnection")}
                                  </Button>
                                  {testResult ? (
                                      <Typography sx={{ fontSize: "15px", color: "#111" }}>
                                          {t("testIncoming", { result: testResult.incoming.ok ? "✅" : `❌ ${testResult.incoming.error ?? ""}` })}{" "}
                                          · {t("testOutgoing", { result: testResult.smtp.ok ? "✅" : `❌ ${testResult.smtp.error ?? ""}` })}
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
                                  {isSubmitting ? <CircularProgress size={20} color="inherit" /> : t("save")}
                              </Button>
                          ),
                      }),
            }}
        />
    );
}
