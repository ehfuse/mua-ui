/**
 * 사용자 메일함 목록(메일 관리 다이얼로그의 "메일함" 탭) — 행: [아이콘(클릭=아이콘/색 선택)][이름·개인/공용 칩][메일 수 · 사용량][수정·삭제].
 * MailFolderFormDialog 는 이름/아이콘/공용 여부를 받는 mfd — 관리 다이얼로그의 [+ 만들기](신규)와 행의 ✎(수정)이 같은 창을 쓴다.
 * 삭제하면 그 메일함의 메일은 받은편지함으로 돌아간다.
 */
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
