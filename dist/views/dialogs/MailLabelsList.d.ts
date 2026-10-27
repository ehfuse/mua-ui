import { mailApi } from "../../apis/mailApi";
import type { MailLabel } from "../../models/types";
/**
 * 라벨 저장 API — 메일 라벨(기본)과 주소록 라벨(2026-10-27, 따로 둔다)이 같은 관리 · 만들기 창을 쓴다.
 * modalKey 는 기기 뒤로가기 칸 이름 — 두 화면이 함께 떠 있어도 겹치지 않게 다르게 준다.
 */
export interface LabelApi {
    create: typeof mailApi.createLabel;
    update: typeof mailApi.updateLabel;
    reorder: typeof mailApi.reorderLabels;
    remove: typeof mailApi.deleteLabel;
    modalKey: string;
}
export declare const mailLabelApi: LabelApi;
export declare const contactLabelApi: LabelApi;
/** 라벨 목록(관리 창 본문) — 바뀌면 onChanged(items) 로 새 목록을 알린다. */
export declare function MailLabelsList({ labels, onChanged, api, }: {
    labels: MailLabel[];
    onChanged: (items?: MailLabel[]) => void;
    api?: LabelApi;
}): import("react").JSX.Element;
/** 라벨 만들기/고치기 창 — label 이 있으면 고치기. 저장하면 onSaved(저장한 라벨). */
export declare function MailLabelFormDialog({ open, label, onClose, onSaved, api, }: {
    open: boolean;
    label?: MailLabel | null;
    onClose: () => void;
    onSaved: (label: MailLabel) => void;
    api?: LabelApi;
}): import("react").JSX.Element;
