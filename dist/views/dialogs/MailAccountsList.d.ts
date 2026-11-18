import type { MailAccount } from "../../models/types";
interface MailAccountsListProps {
    accounts: MailAccount[];
    syncingSeqs: number[];
    onEdit: (account: MailAccount) => void;
    onDelete: (account: MailAccount) => void;
    /** 고치기 · 지우기 단추를 숨긴다(0.4.93, config accountsReadOnly). */
    readOnly?: boolean;
    onSync: (account: MailAccount) => void;
    /** 순서 바꾸기 — 드래그로 놓은 순간의 seq 배열(위에서부터). 주지 않으면 드래그가 꺼진다. */
    onReorder?: (seqs: number[]) => void;
}
/** 계정 목록 */
export declare function MailAccountsList({ accounts, syncingSeqs, onEdit, onDelete, readOnly, onSync, onReorder }: MailAccountsListProps): import("react").JSX.Element;
export {};
