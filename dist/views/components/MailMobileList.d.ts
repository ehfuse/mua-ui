/**
 * 메일 목록 모바일 카드(서브페이지 다이얼로그 본문).
 *
 * 좁은 화면에서는 데스크탑 표(중요·상대·제목/미리보기·첨부·일시)가 접혀 못 읽는다 — 메일 1통을 카드 하나로 축약한다.
 *   1줄: 상대(보낸 사람 / 보낸·임시보관함은 받는 사람) + 오른쪽 일시 칩
 *   2줄: 제목(안 읽은 메일은 굵게) + 첨부 아이콘
 *   3줄: 미리보기(2줄 말줄임)
 * 왼쪽 별은 중요 토글(카드 클릭과 분리), 카드를 누르면 상세(MobileDetailDialog)가 슬라이드로 열린다.
 * 안 읽은 메일은 왼쪽 파란 세로띠로 구분한다.
 */
import { type MouseEvent } from "react";
import type { MailLabel, MailMessageListItem } from "../../models/types";
interface MailMobileListProps {
    rows: MailMessageListItem[];
    loading: boolean;
    emptyMessage: string;
    onSelect: (row: MailMessageListItem) => void;
    onToggleStar: (row: MailMessageListItem) => void;
    checkedSeqs: Set<number>;
    onToggleCheck: (seq: number) => void;
    onRowContextMenu?: (row: MailMessageListItem, event: MouseEvent) => void;
    /** 화면 끝까지 쓰는 띠로 그린다 — 본문 좌우 여백(px). 0 이면 카드 모양. */
    bleed?: number;
    /** 색상 라벨(config.labels) — 있으면 제목 앞에 칩을 둔다. */
    labels?: MailLabel[];
}
/** 메일 모바일 카드 목록을 렌더링한다. */
export declare function MailMobileList({ rows, loading, emptyMessage, onSelect, labels, onToggleStar, checkedSeqs, onToggleCheck, onRowContextMenu, bleed, }: MailMobileListProps): import("react").JSX.Element;
/** 메일 카드 한 줄 속성 — 목록(MailMobileList)과 가상 목록(MailMobileOwnScroll)이 함께 쓴다(0.3.168) */
export interface MailMobileRowProps {
    row: MailMessageListItem;
    labels: MailLabel[];
    checked: boolean;
    onSelect: (row: MailMessageListItem) => void;
    onToggleStar: (row: MailMessageListItem) => void;
    onToggleCheck: (seq: number) => void;
    onRowContextMenu?: (row: MailMessageListItem, event: MouseEvent) => void;
    bleed: number;
}
/** 메일 카드 한 줄 — 1줄 체크 · 별 · 상대 · 일시 / 2줄 제목(+첨부) / 3줄 미리보기 */
export declare function MailMobileRow({ row, labels, checked, onSelect, onToggleStar, onToggleCheck, onRowContextMenu, bleed, }: MailMobileRowProps): import("react").JSX.Element;
/** 대화 수(2026-10-20) — 묶은 줄이 두 통 이상이면 이름 옆에 흐리게 적는다(지메일 "보낸 사람 2" 와 같다). */
export declare function ThreadCount({ row, fontSize }: {
    row: MailMessageListItem;
    fontSize?: string;
}): import("react").JSX.Element | null;
export {};
