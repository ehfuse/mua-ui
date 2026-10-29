import { createContext } from "react";

/**
 * 모바일 메일 상세의 아이콘 줄 자리(0.4.21, 2026-10-29 사용자 지정 "아이콘 줄도 머리 접기처럼").
 * 상세 창이 제목바 밑(mfd titleBottom)에 빈 자리를 만들어 여기 올리면, 상세 패널은 아이콘 줄을 본문 대신 그 자리에 포털로 그린다 —
 * 제목바와 한 덩어리로 내리면 접히고, 조금만 올려도 함께 내려온다(본문에 두면 맨 위까지 올려야 다시 보였다).
 * 자리가 없으면(null — 앱이 주입한 상세 창 · 접히지 않는 창) 전처럼 본문 맨 위에 그린다.
 */
export const DetailToolbarSlotContext = createContext<HTMLElement | null>(null);
