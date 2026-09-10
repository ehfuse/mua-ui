/** 모바일 카드 목록 부품(칩·카드 스택·로딩 스피너) — 코드샵 대시보드 규격과 동일하게 패키지 안에 둔다. */
import type { ReactNode } from "react";
/** 라벨칩 색 톤. */
export type MobileChipTone = "default" | "blue" | "green" | "red" | "amber" | "gray";
/** 테두리 없는 사각칩(라벨·상태 표시용). */
export declare function MobileChip({ children, tone, bold, }: {
    children: ReactNode;
    tone?: MobileChipTone;
    bold?: boolean;
}): import("react").JSX.Element;
/** 모바일 목록 카드 간격(외부여백과 동일). */
export declare const MOBILE_LIST_CARD_GAP: {
    xs: number;
    md: number;
};
/** 모바일 초기/새로고침 로딩 — 뷰포트 고정 스피너(앱바 높이 절반만큼 내려 콘텐츠 영역 중앙). */
export declare function MobileListLoadingSpinner(): import("react").JSX.Element;
/** 모바일 카드 스택(mdl StackContentsLayout 이 자식마다 Paper 로 감싼다). */
export declare function MobileCardStack({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
/** 모바일 다음 페이지(무한 스크롤) 로딩 — 하단 중앙 작은 스피너. */
export declare function MobileListLoadingMoreSpinner(): import("react").JSX.Element;
/**
 * 무한 스크롤 sentinel 이 속한 실제 스크롤 컨테이너를 찾는다(서브페이지 다이얼로그 안은 본문이 자체 스크롤이라
 * IntersectionObserver root 를 명시해야 교차가 감지된다). 없으면 null(=뷰포트).
 */
export declare function findScrollParent(node: HTMLElement | null): HTMLElement | null;
