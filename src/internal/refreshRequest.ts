/**
 * "메일 목록 새로고침" 요청 스토어 — 모바일 서브페이지 다이얼로그(앱 mfd)의 당겨서-새로고침은 메일 화면 밖(다이얼로그 껍데기)에서
 * 발동하므로, 요청만 넣고 메일 레이아웃이 구독해 목록·건수를 다시 읽는다. 구독자가 돌려준 Promise 를 모아 끝날 때까지 기다린다
 * (OverlayScrollbar 가 인디케이터를 그동안 유지한다).
 */
type RefreshListener = () => void | Promise<void>;

const listeners = new Set<RefreshListener>();

/** 메일 목록 새로고침을 요청한다 — 메일 화면이 떠 있으면 목록·건수를 다시 읽고 끝나면 resolve. */
export async function requestMailRefresh(): Promise<void> {
    await Promise.all(
        [...listeners].map((listener) =>
            Promise.resolve()
                .then(listener)
                .catch(() => undefined)
        )
    );
}

/** 새로고침 요청 구독(메일 레이아웃이 마운트 동안 건다). */
export function subscribeMailRefresh(listener: RefreshListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
