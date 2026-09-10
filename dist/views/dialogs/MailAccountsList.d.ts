/**
 * 메일 계정 목록(메일 관리 다이얼로그의 "계정" 탭) — 내가 쓸 수 있는 계정(개인 + 공용)을 수정/삭제/지금 동기화.
 * 수정·삭제는 can_manage(개인=소유자, 공용=관리자·등록자)인 계정만 가능하다.
 */
import type { MailAccount } from "../../models/types";
interface MailAccountsListProps {
    accounts: MailAccount[];
    syncingSeqs: number[];
    onEdit: (account: MailAccount) => void;
    onDelete: (account: MailAccount) => void;
    onSync: (account: MailAccount) => void;
    /** 순서 바꾸기 — 드래그로 놓은 순간의 seq 배열(위에서부터). 주지 않으면 드래그가 꺼진다. */
    onReorder?: (seqs: number[]) => void;
}
/** 계정 목록 */
export declare function MailAccountsList({ accounts, syncingSeqs, onEdit, onDelete, onSync, onReorder }: MailAccountsListProps): import("react").JSX.Element;
export {};
