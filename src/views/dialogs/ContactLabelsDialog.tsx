import { formDialogLocale, t } from "../../i18n";
/**
 * 주소록 라벨 관리 창(2026-10-27) — 메일의 관리 창 "라벨" 목록과 같은 모양(이름 · 색 · 순서 · 지우기)을 주소록 전용 라벨로 띄운다.
 * 주소록 라벨은 메일 라벨과 따로다(contactLabelApi).
 */

import { useState } from "react";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useIsMobile } from "../../internal/useIsMobile";
import { useDialogBackClose } from "../../internal/useDialogBackClose";
import { useMuaFormDialog } from "../../MuaProvider";
import type { MailLabel } from "../../models/types";
import { MailLabelFormDialog, MailLabelsList, contactLabelApi } from "./MailLabelsList";

export function ContactLabelsDialog({
    open,
    labels,
    onClose,
    onChanged,
}: {
    open: boolean;
    labels: MailLabel[];
    onClose: () => void;
    onChanged: (items?: MailLabel[]) => void;
}) {
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const { requestClose } = useDialogBackClose({ open, onClose, modalId: "contact-labels-dialog" });
    const [addOpen, setAddOpen] = useState(false);
    return (
        <>
            <FormDialog
                fontScaleKey="ContactLabelsDialog"
                fullScreen={isMobile}
                mobilePresentation={isMobile ? "slide" : "dialog"}
                open={open}
                onClose={requestClose}
                title={{ text: t("manageLabels") }}
                titleIcons={{ delete: { visible: false } }}
                tabs={{ visible: false }}
                locale={formDialogLocale()}
                maxWidth="sm"
                scrollPastLastSection={false}
                contentBottomPadding={24}
                sections={[
                    {
                        id: "contact-labels",
                        showTitle: false,
                        children: <MailLabelsList labels={labels} api={contactLabelApi} onChanged={onChanged} />,
                    },
                ]}
                actions={{
                    visible: true,
                    showCancelButton: false,
                    left: (
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setAddOpen(true)}
                            sx={{ color: "#111", borderColor: "#cbd5e1", whiteSpace: "nowrap" }}
                        >
                            {t("newLabel")}
                        </Button>
                    ),
                    right: (
                        <Button variant="contained" onClick={requestClose} sx={{ minWidth: 80 }}>
                            {t("close")}
                        </Button>
                    ),
                }}
            />
            <MailLabelFormDialog open={addOpen} api={contactLabelApi} onClose={() => setAddOpen(false)} onSaved={() => onChanged()} />
        </>
    );
}
