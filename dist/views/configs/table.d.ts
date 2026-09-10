/**
 * 메일 목록 컬럼 설정 — 중요 · 상대 · 제목/미리보기 · 첨부 · 일시.
 */
import type { DataColumn } from "@ehfuse/mui-virtual-data-table";
import type { MailMessageListItem } from "../../models/types";
/** 복수 선택 상태(체크박스 컬럼) */
export interface MailListSelection {
    checked: Set<number>;
    allChecked: boolean;
    someChecked: boolean;
    onToggle: (seq: number) => void;
    onToggleAll: () => void;
}
/** 목록 컬럼을 만든다. */
export declare function getMailColumns(onToggleStar: (row: MailMessageListItem) => void, selection: MailListSelection, search?: string, showSnippet?: boolean): DataColumn<MailMessageListItem>[];
