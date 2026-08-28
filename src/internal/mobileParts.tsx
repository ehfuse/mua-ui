/** 모바일 카드 목록 부품(칩·카드 스택·로딩 스피너) — 코드샵 대시보드 규격과 동일하게 패키지 안에 둔다. */

import type { ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";
import { StackContentsLayout } from "@ehfuse/mui-dashboard-layout";
import { mfs } from "./mobileFontScale";

/** 라벨칩 색 톤. */
export type MobileChipTone = "default" | "blue" | "green" | "red" | "amber" | "gray";

const CHIP_TONES: Record<MobileChipTone, { bg: string; color: string }> = {
    default: { bg: "#f1f5f9", color: "#475569" },
    gray: { bg: "#f1f5f9", color: "#475569" },
    blue: { bg: "#eff6ff", color: "#1d4ed8" },
    green: { bg: "#ecfdf5", color: "#16a34a" },
    red: { bg: "#fef2f2", color: "#dc2626" },
    amber: { bg: "#fffbeb", color: "#b45309" },
};

/** 테두리 없는 사각칩(라벨·상태 표시용). */
export function MobileChip({
    children,
    tone = "default",
    bold = false,
}: {
    children: ReactNode;
    tone?: MobileChipTone;
    bold?: boolean;
}) {
    const { bg, color } = CHIP_TONES[tone];
    return (
        <Box
            component="span"
            sx={{
                flexShrink: 0,
                px: 0.75,
                py: 0.15,
                borderRadius: 0.5,
                backgroundColor: bg,
                color,
                fontSize: mfs(15),
                fontWeight: bold ? 700 : 500,
                lineHeight: 1.5,
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </Box>
    );
}

/** 모바일 목록 카드 간격(외부여백과 동일). */
export const MOBILE_LIST_CARD_GAP = { xs: 2, md: 3 };

/** 모바일 초기/새로고침 로딩 — 뷰포트 고정 스피너(앱바 높이 절반만큼 내려 콘텐츠 영역 중앙). */
export function MobileListLoadingSpinner() {
    return (
        <Box
            sx={{
                position: "fixed",
                top: "calc(50% + 30px)",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1,
            }}
        >
            <CircularProgress size={44} thickness={4} sx={{ color: "#94a3b8" }} />
        </Box>
    );
}

/** 모바일 카드 스택(mdl StackContentsLayout 이 자식마다 Paper 로 감싼다). */
export function MobileCardStack({ children }: { children: ReactNode }) {
    return (
        <Box sx={{ minWidth: 0, "& > .stack-contents-layout": { pb: MOBILE_LIST_CARD_GAP } }}>
            <StackContentsLayout gap={MOBILE_LIST_CARD_GAP as unknown as string}>{children}</StackContentsLayout>
        </Box>
    );
}

/** 모바일 다음 페이지(무한 스크롤) 로딩 — 하단 중앙 작은 스피너. */
export function MobileListLoadingMoreSpinner() {
    return (
        <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={24} thickness={4} sx={{ color: "#94a3b8" }} />
        </Box>
    );
}

/**
 * 무한 스크롤 sentinel 이 속한 실제 스크롤 컨테이너를 찾는다(서브페이지 다이얼로그 안은 본문이 자체 스크롤이라
 * IntersectionObserver root 를 명시해야 교차가 감지된다). 없으면 null(=뷰포트).
 */
export function findScrollParent(node: HTMLElement | null): HTMLElement | null {
    let current = node?.parentElement ?? null;
    while (current) {
        const { overflowY } = window.getComputedStyle(current);
        if ((overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}
