import type { MailUserFolder } from "../../models/types";
/** 메일함 목록(+ 행의 ✎ 로 여는 수정 창) */
export declare function MailFoldersList({ folders, onChanged }: {
    folders: MailUserFolder[];
    onChanged: () => void;
}): import("react").JSX.Element;
/** 메일함 추가/수정 다이얼로그 — [아이콘][이름] + 공용 스위치(액션바). folder 가 있으면 수정 */
export declare function MailFolderFormDialog({ open, folder, onClose, onChanged, }: {
    open: boolean;
    folder?: MailUserFolder | null;
    onClose: () => void;
    onChanged: () => void;
}): import("react").JSX.Element;
