/** 모바일 셸 기본 구현 — 앱이 MuaConfig.mobile 로 주입하지 않을 때 쓰는 단순 래퍼/다이얼로그. */
import type { MuaMobileCardListLayoutProps, MuaMobileDetailDialogProps } from "../types/config";
/** 기본 카드 목록 래퍼 — 헤더(검색/필터)를 항상 보이고 목록은 부모 스크롤에 맡긴다. */
export declare function DefaultMobileCardListLayout({ header, storageKey, children }: MuaMobileCardListLayoutProps): import("react").JSX.Element;
/** 기본 상세 다이얼로그 — mfd 풀스크린 슬라이드(useModal 로 history 1개). */
export declare function DefaultMobileDetailDialog({ modalId, open, title, onClose, children, actions, }: MuaMobileDetailDialogProps): import("react").JSX.Element;
