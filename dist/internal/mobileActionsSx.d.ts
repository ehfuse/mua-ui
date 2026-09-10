/**
 * 모바일 mfd 액션바를 전폭으로 쓰기 위한 sx — mfd 는 actions.left 를 내용 폭 래퍼로 감싸므로
 * 슬롯(.left-actions)과 래퍼(> *)를 함께 늘려야 안의 Stack 이 화면 폭을 받는다. 취소 버튼을 끈 뒤 남는
 * 빈 오른쪽 슬롯은 숨긴다. FormDialog `sx={isMobile ? MOBILE_FULL_WIDTH_ACTIONS_SX : undefined}` 로 쓴다.
 */
export declare const MOBILE_FULL_WIDTH_ACTIONS_SX: {
    readonly DialogActions: {
        readonly "& .left-actions": {
            readonly flex: 1;
            readonly minWidth: 0;
            readonly width: "100%";
        };
        readonly "& .left-actions > *": {
            readonly flex: 1;
            readonly minWidth: 0;
            readonly width: "100%";
        };
        readonly "& .right-actions": {
            readonly display: "none";
        };
    };
};
