/** forma useModal 반환의 공개 부분 — forma 가 UseModalReturn 을 루트로 내보내지 않아(TS2742) 패키지에서 다시 선언한다. */
export interface MuaModalControl {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    modalId: string;
}
