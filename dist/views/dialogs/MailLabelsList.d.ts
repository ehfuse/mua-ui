/**
 * 색상 라벨 관리(0.3.158) — 관리 창의 "라벨" 목록(이름 · 색 · 순서 · 지우기)과 라벨 만들기/고치기 창.
 * 라벨은 사람마다라 공용/개인 구분이 없다. 지우면 그 라벨을 단 메일에서도 떨어진다(메일은 그대로).
 */
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
