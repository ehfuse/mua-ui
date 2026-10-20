/**
 * 메일 원문(RFC 822) 보기 창(2026-10-20 사용자 요청 "원문보기 메뉴") — 받은 경로 · 인증 결과(Received · DKIM · SPF) 같은 헤더를 확인할 때 연다.
 * 기업메일은 받은 원문 그대로, 외부 계정 메일은 원문을 보관하지 않아 저장된 내용으로 다시 만든 것이다(그때는 받은 헤더가 없다 — 창 위에 알린다).
 * 첨부가 큰 메일은 앞부분만 보이고, 전체는 [내려받기](.eml)로 본다.
 */

import { useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { ErrorAlert } from "@ehfuse/alerts";
import type { FormDialogSection } from "@ehfuse/mui-form-dialog";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaFormDialog, useMuaSaveBlob } from "../../MuaProvider";
import { mailApi, unwrap, type MailMessageSource } from "../../apis/mailApi";
import { formatBytes } from "../../utils/format";

interface MailSourceDialogProps {
    open: boolean;
    seq: number; // 볼 메일(닫힌 동안 0)
    onClose: () => void;
}

/** 원문 보기 창이다. */
export function MailSourceDialog({ open, seq, onClose }: MailSourceDialogProps) {
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const saveBlob = useMuaSaveBlob();
    const [data, setData] = useState<MailMessageSource | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!open || !(seq > 0)) return;
        let alive = true;
        setData(null);
        mailApi
            .getMessageSource(seq)
            .then((res) => alive && setData(unwrap(res, "원문을 불러오지 못했습니다.")))
            .catch((error) => {
                if (!alive) return;
                ErrorAlert({ message: error instanceof Error ? error.message : "원문을 불러오지 못했습니다." });
                onClose();
            });
        return () => {
            alive = false;
        };
        // onClose 는 열 때마다 새로 만들어질 수 있다 — 같은 메일을 다시 읽지 않게 seq · open 으로만 부른다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, seq]);

    /** 잘리지 않은 원문을 .eml 로 저장한다. */
    const download = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const full = data && !data.truncated ? data : unwrap(await mailApi.getMessageSource(seq, true), "원문을 내려받지 못했습니다.");
            await saveBlob(new Blob([full.source], { type: "message/rfc822" }), full.file_name);
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "원문을 내려받지 못했습니다." });
        } finally {
            setDownloading(false);
        }
    };

    const sections = useMemo<FormDialogSection[]>(
        () => [
            {
                id: "mail-source",
                showTitle: false,
                children: !data ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6, width: "100%" }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%", minWidth: 0 }}>
                        {data.rebuilt || data.truncated ? (
                            <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 14, color: "text.secondary" }}>
                                {data.rebuilt ? (
                                    <li>외부 계정에서 가져온 메일은 원문을 보관하지 않아, 저장된 내용으로 다시 만든 것입니다(받은 경로 · 인증 헤더가 없습니다).</li>
                                ) : null}
                                {data.truncated ? (
                                    <li>원문이 커서({formatBytes(data.size)}) 앞부분만 보입니다. 전체는 [내려받기]로 보세요.</li>
                                ) : null}
                            </Box>
                        ) : null}
                        <Box
                            component="pre"
                            sx={{
                                m: 0,
                                p: 1.5,
                                fontFamily: "inherit",
                                fontSize: 14,
                                lineHeight: 1.6,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-all",
                                bgcolor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 1,
                                userSelect: "text",
                            }}
                        >
                            {data.source}
                        </Box>
                    </Box>
                ),
            },
        ],
        [data]
    );

    return (
        <FormDialog
            fontScaleKey="MailSourceDialog"
            open={open}
            onClose={onClose}
            title={{ text: "원문 보기" }}
            titleIcons={{ delete: { visible: false } }}
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="md"
            scrollPastLastSection={false}
            sections={sections}
            actions={{
                visible: true,
                showCancelButton: false,
                right: (
                    <>
                        <Button onClick={onClose}>닫기</Button>
                        <Button variant="contained" disabled={!data || downloading} onClick={() => void download()}>
                            {downloading ? <CircularProgress size={20} color="inherit" /> : "내려받기(.eml)"}
                        </Button>
                    </>
                ),
            }}
        />
    );
}
