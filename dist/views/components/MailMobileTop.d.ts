/**
 * 메일 목록 모바일 머리(0.3.131) — 접히는 검색칸과 갈래 탭(전체 · 안 읽음 · 별표 · 라벨).
 *
 * 라벨(0.3.162)은 넓은 화면처럼 라벨마다 탭을 두면 폰 폭을 넘치므로 탭 하나로 둔다 — 누르면 내 라벨을 고르는 메뉴가 뜨고,
 * 고르면 그 라벨의 메일만 보이며 탭 글자가 그 라벨 이름이 된다. 라벨 기능을 켠 앱(config.labels)에서만 보인다.
 *
 * 검색칸은 접혀 있다가 **앱 제목 옆 돋보기**를 누르면 제목 줄 바로 아래로 펼쳐진다(겹쳐 뜨는 창이 아니라 목록을 밀어 내린다).
 * 돋보기는 앱(상단 바)이 그리고, 여닫힘은 앱과 같이 쓰는 전역 상태(mobileSearchOverlay.open)로 받는다.
 * 탭은 상자·바깥 여백 없이 화면 폭을 다 쓰는 흰 띠다 — 제목 줄에 바로 붙어 그 화면의 갈래로 읽힌다.
 * 접으면 검색어도 함께 지운다 — 칸이 안 보이는데 검색이 걸려 있으면 메일이 사라진 것처럼 보인다.
 *
 * 앱이 모바일 목록 래퍼(MuaConfig.mobile.CardListLayout)를 주입하지 않았을 때만 쓴다 — 주입한 앱(코드샵)은 앱바의 검색 오버레이를 그대로 쓴다.
 */
import type { MailLabel } from "../../models/types";
/** 갈래 — 전체 · 안 읽음 · 별표 · 라벨. */
export type MailMobileScope = "all" | "unread" | "starred" | "label";
interface MailMobileTopProps {
    scope: MailMobileScope;
    onScopeChange: (scope: MailMobileScope) => void;
    unreadCount: number;
    searchOpen: boolean;
    search: string;
    onSearch: (keyword: string) => void;
    /** 내 라벨 — 주면 "라벨" 탭이 생긴다(라벨 기능을 켠 앱만). */
    labels?: MailLabel[];
    labelSeq?: number;
    onLabelChange?: (labelSeq: number) => void;
    onManageLabels?: () => void;
    /** 화면 본문의 좌우·위 여백(px) — 그만큼 밖으로 빼 화면 끝과 제목 줄에 붙인다. */
    bleed?: number;
}
export declare function MailMobileTop({ scope, onScopeChange, unreadCount, searchOpen, search, onSearch, labels, labelSeq, onLabelChange, onManageLabels, bleed, }: MailMobileTopProps): import("react").JSX.Element;
export {};
