/**
 * 다이얼로그를 기기(브라우저) 뒤로가기로 닫히게 해주는 훅(www hooks/useDialogBackClose 사본).
 *
 * mfd FormDialog 는 히스토리를 건드리지 않아, 열림 상태를 자체 state 로만 관리하는 다이얼로그는 뒤로가기가
 * 다이얼로그가 아니라 라우트를 되돌린다. forma useModal 은 열 때 히스토리를 한 칸 쌓고 popstate 를 가로채
 * 그 모달만 닫는다 — 이 훅은 그 장치를 "이미 있는 열림 상태"에 얹는다(표시 여부의 원본은 소비처가 계속 소유).
 *
 * ⚠️ modalId 는 동시에 마운트되는 인스턴스마다 달라야 한다. 인스턴스가 여러 개면 생략(자동 id)한다.
 */
/** 뒤로가기 닫기 훅 옵션 */
export interface DialogBackCloseOptions {
    open: boolean;
    onClose: () => void;
    modalId?: string;
}
/** 뒤로가기 닫기 훅 반환값 */
export interface DialogBackCloseControl {
    requestClose: () => void;
}
/** 다이얼로그를 기기 뒤로가기로 닫을 수 있게 forma 모달 히스토리에 등록한다. */
export declare function useDialogBackClose({ open, onClose, modalId }: DialogBackCloseOptions): DialogBackCloseControl;
