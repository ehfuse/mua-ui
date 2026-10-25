import { formDialogLocale, t } from "../../i18n";
/**
 * 연락처 등록/수정 다이얼로그(mfd) — 이름 · 메일 · 소속 · 전화 · 메모 · 즐겨찾기. 수정 모드는 [메일 보내기] 와 삭제(휴지통 아이콘).
 */

import { useCallback } from "react";
import { Box, Button, Typography } from "@mui/material";
import { ConfirmDialog } from "@ehfuse/alerts";
import { ClearTextField, Switch } from "@ehfuse/mui-form-controls";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaFormDialog } from "../../MuaProvider";
import type { ContactFormController } from "../../controllers/contactFormController";

interface ContactFormDialogProps {
    controller: ContactFormController; // 컨트롤러
    onCompose?: (email: string, name: string) => void; // [메일 보내기]
}

/** 연락처 다이얼로그 컴포넌트 */
export function ContactFormDialog({ controller, onCompose }: ContactFormDialogProps) {
    const { form, modal, removeContact } = controller;
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const seq = Number(form.useFormValue("seq") ?? 0);
    const canManage = form.useFormValue("can_manage") !== false;
    const isSubmitting = Boolean(form.isSubmitting);

    const handleDelete = useCallback(() => {
        if (!(seq > 0)) return;
        ConfirmDialog({
            title: t("deleteContact"),
            message: t("deleteContactConfirm"),
            onConfirm: () => void removeContact(seq),
        });
    }, [seq, removeContact]);

    const handleCompose = useCallback(() => {
        const values = form.getFormValues();
        onCompose?.(values.email.trim(), values.name.trim());
    }, [form, onCompose]);

    return (
        <FormDialog
            fontScaleKey="MailContactFormDialog"
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            open={modal.isOpen}
            onClose={modal.close}
            title={{ text: seq > 0 ? t("editContact") : t("addContact") }}
            titleIcons={{ delete: { visible: seq > 0 && canManage } }}
            onDelete={seq > 0 && canManage ? handleDelete : undefined}
            tabs={{ visible: false }}
            locale={formDialogLocale()}
            maxWidth="xs"
            scrollPastLastSection={false}
            contentBottomPadding={24}
            sections={[
                {
                    id: "mail-contact-basic",
                    showTitle: false,
                    children: (
                        <Box sx={{ display: "grid", gap: 2.5, width: "100%" }}>
                            <ClearTextField name="name" label={t("name")} form={form} fullWidth autoFocus />
                            <ClearTextField name="email" label={t("emailRequired")} form={form} fullWidth autoComplete="off" />
                            <ClearTextField name="organization" label={t("organization")} form={form} fullWidth />
                            <ClearTextField name="phone" label={t("phone")} form={form} fullWidth />
                            <ClearTextField name="memo" label={t("memo")} form={form} fullWidth multiline minRows={2} />
                            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                <Switch form={form} name="is_favorite" label={t("favorite")} />
                                <Switch form={form} name="is_shared" label={t("sharedContacts")} disabled={!canManage} />
                            </Box>
                            {!canManage ? (
                                <Typography sx={{ fontSize: "14px", color: "#b45309" }}>
                                    {t("sharedContactEditOnly")}
                                </Typography>
                            ) : null}
                        </Box>
                    ),
                },
            ]}
            actions={{
                visible: true,
                showCancelButton: false,
                left:
                    seq > 0 && onCompose ? (
                        <Button variant="outlined" onClick={handleCompose} disabled={isSubmitting}>
                            {t("sendMail")}
                        </Button>
                    ) : undefined,
                right: (
                    <Button
                        variant="contained"
                        onClick={() => void form.submit()}
                        disabled={isSubmitting || !canManage}
                    >
                        {t("save")}
                    </Button>
                ),
            }}
        />
    );
}
