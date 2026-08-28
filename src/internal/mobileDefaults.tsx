/** 모바일 셸 기본 구현 — 앱이 MuaConfig.mobile 로 주입하지 않을 때 쓰는 단순 래퍼/다이얼로그. */

import { useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { ListLayout } from "@ehfuse/mui-dashboard-layout";
import { useModal } from "@ehfuse/forma";
import { useMuaFormDialog } from "../MuaProvider";
import type { MuaMobileCardListLayoutProps, MuaMobileDetailDialogProps } from "../types/config";

/** 기본 카드 목록 래퍼 — 헤더(검색/필터)를 항상 보이고 목록은 부모 스크롤에 맡긴다. */
export function DefaultMobileCardListLayout({ header, storageKey, children }: MuaMobileCardListLayoutProps) {
    return (
        <Box sx={{ minWidth: 0, "& .list-layout": { height: "auto", minWidth: 0 } }}>
            <ListLayout header={header} leftPaper={false} leftScroll={false} storageKey={storageKey} leftPanel={children} />
        </Box>
    );
}

/** 기본 상세 다이얼로그 — mfd 풀스크린 슬라이드(useModal 로 history 1개). */
export function DefaultMobileDetailDialog({ modalId, open, title, onClose, children, actions }: MuaMobileDetailDialogProps) {
    const FormDialog = useMuaFormDialog();
    const handleClosed = useCallback(() => onClose(), [onClose]);
    const modal = useModal({ modalId, onClose: handleClosed });
    const { open: openModal, close, isOpen } = modal;
    useEffect(() => {
        if (open && !isOpen) {
            openModal();
            return;
        }
        if (!open && isOpen) close();
    }, [open, isOpen, openModal, close]);
    return (
        <FormDialog
            open={isOpen}
            onClose={close}
            fullScreen
            mobilePresentation="slide"
            title={{ text: title }}
            titleIcons={{ delete: { visible: false }, print: { visible: false }, share: { visible: false } }}
            tabs={{ visible: false }}
            actions={actions ?? { visible: false }}
            readonly
            locale="ko"
            sx={{ DialogContent: { backgroundColor: "#f1f4f7" } }}
            contentPaddingX={16}
            contentTopPadding={16}
            sectionsPaddingTop={0}
            contentBottomPadding={0}
            scrollPastLastSection={false}
            sections={[{ id: `${modalId}-body`, title, showTitle: false, children }]}
        />
    );
}
