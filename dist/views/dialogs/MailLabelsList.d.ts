import type { MailLabel } from "../../models/types";
/** 라벨 목록(관리 창 본문) — 바뀌면 onChanged(items) 로 새 목록을 알린다. */
export declare function MailLabelsList({ labels, onChanged }: {
    labels: MailLabel[];
    onChanged: (items?: MailLabel[]) => void;
}): import("react").JSX.Element;
/** 라벨 만들기/고치기 창 — label 이 있으면 고치기. 저장하면 onSaved(저장한 라벨). */
export declare function MailLabelFormDialog({ open, label, onClose, onSaved, }: {
    open: boolean;
    label?: MailLabel | null;
    onClose: () => void;
    onSaved: (label: MailLabel) => void;
}): import("react").JSX.Element;
