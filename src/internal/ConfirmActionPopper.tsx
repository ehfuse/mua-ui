/** 확인 팝퍼(코드샵 www ConfirmActionPopper 복사본) — 데스크탑은 앵커 팝퍼, 모바일은 가운데 다이얼로그. zIndex 는 드로어(1200) 위. */
import type { ReactNode } from "react";
import { Button, ClickAwayListener, Dialog, Paper, Popper, Typography, Box } from "@mui/material";
import type { PopperProps } from "@mui/material/Popper";
import { useIsMobile } from "./useIsMobile";

/**
 * 확인/취소 직후 같은 자리로 떨어지는 잔여 클릭(터치 ghost click)을 한 번만 삼킨다.
 * 터치는 tap 후 ~300ms 뒤 합성 click 을 한 번 더 보내는데, 그 사이 팝퍼가 닫히면 그 클릭이
 * 아래에 있던 요소로 떨어져 방금 한 조작이 곧바로 되돌려진다(업무함 완료 체크에서 재현).
 */
function swallowGhostClick(): void {
    if (typeof document === "undefined") return;
    let timer = 0;
    const handler = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        cleanup();
    };
    const cleanup = () => {
        window.clearTimeout(timer);
        document.removeEventListener("click", handler, true);
    };
    document.addEventListener("click", handler, true);
    timer = window.setTimeout(cleanup, 350);
}

interface ConfirmActionPopperProps {
    open: boolean;
    anchorEl: PopperProps["anchorEl"] | null; // 요소 또는 가상 앵커({ getBoundingClientRect })
    title?: ReactNode;
    content?: ReactNode; // 제목과 버튼 사이에 렌더할 추가 콘텐츠(입력칸 등)
    confirmText?: string;
    cancelText?: string;
    placement?: PopperProps["placement"];
    minWidth?: number;
    minHeight?: number;
    titleFontSize?: number;
    actionFontSize?: number;
    actionMinHeight?: number;
    zIndex?: number;
    onCancel: () => void;
    onConfirm: () => void;
}

/** 확인 본문(제목 + 추가 콘텐츠 + 취소/확인 버튼)을 렌더링한다. 팝퍼/다이얼로그 공용. */
function ConfirmActionBody({
    title,
    content,
    confirmText,
    cancelText,
    titleFontSize,
    actionFontSize,
    actionMinHeight,
    onCancel,
    onConfirm,
}: Required<
    Pick<
        ConfirmActionPopperProps,
        "confirmText" | "cancelText" | "titleFontSize" | "actionFontSize" | "actionMinHeight" | "onCancel" | "onConfirm"
    >
> &
    Pick<ConfirmActionPopperProps, "title" | "content">) {
    /** 확인/취소 — 잔여 클릭을 삼킨 뒤 콜백을 실행한다(닫힌 자리의 요소가 다시 눌리지 않게). */
    const handleCancel = () => {
        swallowGhostClick();
        onCancel();
    };
    const handleConfirm = () => {
        swallowGhostClick();
        onConfirm();
    };
    return (
        <>
            <Typography
                component="div"
                sx={{ fontSize: titleFontSize, fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}
            >
                {title}
            </Typography>
            {content}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                    size="medium"
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancel}
                    fullWidth
                    sx={{ fontSize: actionFontSize, minHeight: actionMinHeight, fontWeight: 700 }}
                >
                    {cancelText}
                </Button>
                <Button
                    size="medium"
                    variant="contained"
                    color="primary"
                    onClick={handleConfirm}
                    fullWidth
                    sx={{ fontSize: actionFontSize, minHeight: actionMinHeight, fontWeight: 700 }}
                >
                    {confirmText}
                </Button>
            </Box>
        </>
    );
}

/** 공통 확인 UI를 렌더링한다. 데스크탑은 앵커 팝퍼, 모바일은 화면 가운데 다이얼로그로 분기한다. */
export function ConfirmActionPopper({
    open,
    anchorEl,
    title = "확인하시겠습니까?",
    content,
    confirmText = "확인",
    cancelText = "취소",
    placement = "top",
    minWidth = 160,
    minHeight,
    titleFontSize = 17,
    actionFontSize = 16,
    actionMinHeight = 44,
    zIndex = 1300,
    onCancel,
    onConfirm,
}: ConfirmActionPopperProps) {
    const isMobile = useIsMobile();
    // 모바일 가운데 다이얼로그는 팝퍼 기본값(제목 17 / 버튼 16·44px)으로는 작아 손가락으로 누르기 불편하다 —
    // 호출부가 더 크게 지정하지 않았으면 제목 19 / 버튼 18·56px 로 키운다(팝퍼(데스크탑)는 그대로).
    const body = (
        <ConfirmActionBody
            title={title}
            content={content}
            confirmText={confirmText}
            cancelText={cancelText}
            titleFontSize={isMobile ? Math.max(titleFontSize, 19) : titleFontSize}
            actionFontSize={isMobile ? Math.max(actionFontSize, 18) : actionFontSize}
            actionMinHeight={isMobile ? Math.max(actionMinHeight, 56) : actionMinHeight}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );

    // 모바일: 앵커 없이 화면 가운데 다이얼로그로 확인한다. 폭은 화면의 92%(최대 420px) 로 넉넉히 잡는다.
    if (isMobile) {
        return (
            <Dialog
                open={open}
                onClose={onCancel}
                sx={{ zIndex }}
                slotProps={{
                    paper: {
                        sx: {
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            width: "min(92vw, 420px)",
                            maxWidth: "92vw",
                            m: 0,
                        },
                    },
                }}
            >
                {body}
            </Dialog>
        );
    }

    return (
        <Popper open={open} anchorEl={anchorEl} placement={placement} sx={{ zIndex }}>
            <ClickAwayListener onClickAway={onCancel}>
                <Paper
                    elevation={4}
                    sx={{
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        minWidth,
                        minHeight,
                        justifyContent: minHeight ? "space-between" : "flex-start",
                    }}
                    onClick={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    {body}
                </Paper>
            </ClickAwayListener>
        </Popper>
    );
}
