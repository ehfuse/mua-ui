/**
 * 모바일 앱바 돋보기 ↔ 검색/필터 오버레이 전역 상태(forma) — 앱(코드샵 대시보드)과 같은 stateId 를 써서 같은 인스턴스를 공유한다.
 * (id 는 MuaConfig.mobile.searchOverlayStateId 로 바꿀 수 있다)
 */

import { useGlobalFormaState } from "@ehfuse/forma";
import { useMuaConfig } from "../MuaProvider";

/** 기본 stateId(코드샵 대시보드 mobileSearchOverlay 와 동일). */
export const DEFAULT_MOBILE_SEARCH_OVERLAY_STATE_ID = "dashboard-mobile-search-overlay";

/** 검색 오버레이 전역 상태 */
export interface MobileSearchOverlayState {
    open: boolean; // 오버레이 열림
    active: boolean; // 현재 화면이 오버레이를 제공하는지(돋보기 노출 조건)
    icon: "search" | "document"; // 앱바 버튼 아이콘
}

/** 모바일 검색 오버레이 전역 상태를 반환한다. */
export function useMobileSearchOverlay() {
    const stateId = useMuaConfig().mobile?.searchOverlayStateId ?? DEFAULT_MOBILE_SEARCH_OVERLAY_STATE_ID;
    return useGlobalFormaState<MobileSearchOverlayState>({
        stateId,
        initialValues: { open: false, active: false, icon: "search" },
    });
}
