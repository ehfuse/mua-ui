/**
 * "메일함 관리 열기" 요청 스토어 — 사이드바(메일 그룹의 +)는 메일 화면 밖에서도 눌리므로 요청만 적어 두고,
 * 메일 레이아웃이 마운트/라우트 진입 시 소비해 다이얼로그를 연다.
 */
let pending = false;
const listeners = new Set<() => void>();

/** 메일함 관리 열기를 요청한다(메일 화면이 떠 있으면 즉시 열린다). */
export function requestMailFoldersManage(): void {
    pending = true;
    listeners.forEach((l) => l());
}

/** 대기 중인 요청을 가져가고 지운다. */
export function consumeMailFoldersManageRequest(): boolean {
    const was = pending;
    pending = false;
    return was;
}

/** 요청 변경 구독 */
export function subscribeMailFoldersManage(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
