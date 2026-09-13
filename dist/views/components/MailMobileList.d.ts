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
import type { MailMessageListItem } from "../../models/types";
interface MailMobileListProps {
    rows: MailMessageListItem[];
    loading: boolean;
    emptyMessage: string;
    onSelect: (row: MailMessageListItem) => void;
    onToggleStar: (row: MailMessageListItem) => void;
    checkedSeqs: Set<number>;
    onToggleCheck: (seq: number) => void;
    onRowContextMenu?: (row: MailMessageListItem, event: MouseEvent) => void;
}
/** 메일 모바일 카드 목록을 렌더링한다. */
export declare function MailMobileList({ rows, loading, emptyMessage, onSelect, onToggleStar, checkedSeqs, onToggleCheck, onRowContextMenu, }: MailMobileListProps): import("react").JSX.Element;
export {};
