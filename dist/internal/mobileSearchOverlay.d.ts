/**
 * 모바일 앱바 돋보기 ↔ 검색/필터 오버레이 전역 상태(forma) — 앱(코드샵 대시보드)과 같은 stateId 를 써서 같은 인스턴스를 공유한다.
 * (id 는 MuaConfig.mobile.searchOverlayStateId 로 바꿀 수 있다)
 */
/** 기본 stateId(코드샵 대시보드 mobileSearchOverlay 와 동일). */
export declare const DEFAULT_MOBILE_SEARCH_OVERLAY_STATE_ID = "dashboard-mobile-search-overlay";
/** 검색 오버레이 전역 상태 */
export interface MobileSearchOverlayState {
    open: boolean;
    active: boolean;
    icon: "search" | "document";
}
/** 모바일 검색 오버레이 전역 상태를 반환한다. */
export declare function useMobileSearchOverlay(): import("@ehfuse/forma").UseGlobalFormaStateReturn<MobileSearchOverlayState>;
