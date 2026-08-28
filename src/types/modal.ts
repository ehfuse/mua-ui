/** forma useModal 반환의 공개 부분 — forma 가 UseModalReturn 을 루트로 내보내지 않아(TS2742) 패키지에서 다시 선언한다. */
export interface MuaModalControl {
    isOpen: boolean; // 열림 여부
    open: () => void; // 연다(히스토리 한 칸을 쌓는다)
    close: () => void; // 닫는다(쌓아둔 히스토리 칸을 되돌린다)
    toggle: () => void; // 열림/닫힘을 뒤집는다
    modalId: string; // 모달 식별자
}
