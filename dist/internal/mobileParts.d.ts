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
/**
 * 모바일 목록형(2026-10-08) — 흰 바탕 한 장에 줄을 잇고 줄 사이는 가로 구분선만 둔다.
 * 메일 목록은 카드형(줄마다 떨어진 상자)이었는데, 상자 사이 간격과 그림자 때문에 한 화면에 몇 통 안 보이고 훑기 어려웠다.
 * 바탕 한 장은 카드 스택의 Paper 와 같은 그림자·모서리라 다른 화면의 카드와 결이 같다.
 */
export declare function MobilePlainList({ children, bleed }: {
    children: ReactNode; /** 화면 끝까지 쓰는 띠(2026-10-12) — 본문 좌우 여백(px)만큼 밖으로 빼고 모서리·그림자를 걷는다. 0 이면 카드 모양 그대로. */
    bleed?: number;
}): import("react").JSX.Element;
/**
 * 띠 사이 간격 — 호스트 앱이 정한 값(--mobile-edge-gap)을 따른다. 앱의 다른 목록(회의록 · 근태)과 같은 간격이어야 한 앱으로 읽힌다.
 * 변수가 없는 앱에서는 7px.
 */
export declare const MOBILE_EDGE_GAP = "var(--mobile-edge-gap, 7px)";
/** 모바일 다음 페이지(무한 스크롤) 로딩 — 하단 중앙 작은 스피너. */
export declare function MobileListLoadingMoreSpinner(): import("react").JSX.Element;
/**
 * 무한 스크롤 sentinel 이 속한 실제 스크롤 컨테이너를 찾는다(서브페이지 다이얼로그 안은 본문이 자체 스크롤이라
 * IntersectionObserver root 를 명시해야 교차가 감지된다). 없으면 null(=뷰포트).
 */
export declare function findScrollParent(node: HTMLElement | null): HTMLElement | null;
