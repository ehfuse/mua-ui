/**
 * 모바일 여부 — 앱이 MuaConfig.isMobile 로 주입한 판정이 우선이고,
 * 미지정이면 MUI breakpoint lg 미만(코드샵 대시보드 기준 1024px — 테마의 lg 를 따른다).
 */
export declare function useIsMobile(): boolean;
