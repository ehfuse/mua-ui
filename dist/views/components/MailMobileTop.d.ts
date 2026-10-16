/**
 * 메일 목록 모바일 머리(0.3.131) — 접히는 검색칸과 갈래 탭(전체 · 안 읽음 · 별표).
 *
 * 검색칸은 접혀 있다가 **앱 제목 옆 돋보기**를 누르면 제목 줄 바로 아래로 펼쳐진다(겹쳐 뜨는 창이 아니라 목록을 밀어 내린다).
 * 돋보기는 앱(상단 바)이 그리고, 여닫힘은 앱과 같이 쓰는 전역 상태(mobileSearchOverlay.open)로 받는다.
 * 탭은 상자·바깥 여백 없이 화면 폭을 다 쓰는 흰 띠다 — 제목 줄에 바로 붙어 그 화면의 갈래로 읽힌다.
 * 접으면 검색어도 함께 지운다 — 칸이 안 보이는데 검색이 걸려 있으면 메일이 사라진 것처럼 보인다.
 *
 * 앱이 모바일 목록 래퍼(MuaConfig.mobile.CardListLayout)를 주입하지 않았을 때만 쓴다 — 주입한 앱(코드샵)은 앱바의 검색 오버레이를 그대로 쓴다.
 */
/** 갈래 — 전체 · 안 읽음 · 별표. */
export type MailMobileScope = "all" | "unread" | "starred";
interface MailMobileTopProps {
    scope: MailMobileScope;
    onScopeChange: (scope: MailMobileScope) => void;
    unreadCount: number;
    searchOpen: boolean;
    search: string;
    onSearch: (keyword: string) => void;
    /** 화면 본문의 좌우·위 여백(px) — 그만큼 밖으로 빼 화면 끝과 제목 줄에 붙인다. */
    bleed?: number;
}
export declare function MailMobileTop({ scope, onScopeChange, unreadCount, searchOpen, search, onSearch, bleed }: MailMobileTopProps): import("react").JSX.Element;
export {};
