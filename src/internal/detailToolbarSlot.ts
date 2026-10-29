import { createContext } from "react";

/**
 * 모바일 메일 상세의 아이콘 줄 자리(0.4.21, 2026-10-29 사용자 지정 "아이콘 줄도 머리 접기처럼").
 * 상세 창이 제목바 밑(mfd titleBottom)에 빈 자리를 만들어 여기 올리면, 상세 패널은 아이콘 줄을 본문 대신 그 자리에 포털로 그린다 —
 * 내려도 접히지 않고 화면 맨 위에 붙어 늘 보인다 — 제목바만 접힌다(0.4.22, 사용자 지정 "아이콘 줄이 항상 보여야"). 본문에 두면 밀려 나가 맨 위까지 올려야 다시 보였다.
 * 자리가 없으면(null — 앱이 주입한 상세 창 · 접히지 않는 창) 전처럼 본문 맨 위에 그린다.
 */
export const DetailToolbarSlotContext = createContext<HTMLElement | null>(null);
