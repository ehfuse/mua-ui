/**
 * 연락처 등록/수정 다이얼로그(mfd) — 이름 · 메일 · 소속 · 전화 · 메모 · 즐겨찾기. 수정 모드는 [메일 보내기] 와 삭제(휴지통 아이콘).
 */

import { useCallback } from "react";
import { Box, Button } from "@mui/material";
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
    const isSubmitting = Boolean(form.isSubmitting);

    const handleDelete = useCallback(() => {
        if (!(seq > 0)) return;
        ConfirmDialog({
            title: "연락처 삭제",
            message: "이 연락처를 삭제하시겠습니까?",
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
            title={{ text: seq > 0 ? "연락처 수정" : "연락처 추가" }}
            titleIcons={{ delete: { visible: seq > 0 } }}
            onDelete={seq > 0 ? handleDelete : undefined}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="xs"
            scrollPastLastSection={false}
            contentBottomPadding={24}
            sections={[
                {
                    id: "mail-contact-basic",
                    showTitle: false,
                    children: (
                        <Box sx={{ display: "grid", gap: 2.5, width: "100%" }}>
                            <ClearTextField name="name" label="이름" form={form} fullWidth autoFocus />
                            <ClearTextField name="email" label="메일 주소 *" form={form} fullWidth autoComplete="off" />
                            <ClearTextField name="organization" label="소속" form={form} fullWidth />
                            <ClearTextField name="phone" label="전화번호" form={form} fullWidth />
                            <ClearTextField name="memo" label="메모" form={form} fullWidth multiline minRows={2} />
                            <Switch form={form} name="is_favorite" label="즐겨찾기" />
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
                            메일 보내기
                        </Button>
                    ) : undefined,
                right: (
                    <Button variant="contained" onClick={() => void form.submit()} disabled={isSubmitting}>
                        저장
                    </Button>
                ),
            }}
        />
    );
}
