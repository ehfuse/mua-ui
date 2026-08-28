/** 모바일 폰트 오프셋 CSS 변수(앱 대시보드 레이아웃이 모바일에서만 주입 — 없으면 0px 로 기준 크기). */
export const MOBILE_FONT_OFFSET_CSS_VAR = "--app-mobile-font-offset";

/** 기준 px 에 전역 모바일 오프셋을 더한 CSS 문자열(데스크탑은 오프셋 0 이라 기준 크기 유지). */
export function mfs(basePx: number, reducePx = 0): string {
    return `calc(${basePx}px + max(0px, var(${MOBILE_FONT_OFFSET_CSS_VAR}, 0px) - ${reducePx}px))`;
}
