/** 메일함 관리 열기를 요청한다(메일 화면이 떠 있으면 즉시 열린다). */
export declare function requestMailFoldersManage(): void;
/** 대기 중인 요청을 가져가고 지운다. */
export declare function consumeMailFoldersManageRequest(): boolean;
/** 요청 변경 구독 */
export declare function subscribeMailFoldersManage(listener: () => void): () => void;
