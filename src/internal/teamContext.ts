/**
 * 팀 컨텍스트 변경 통지 — 공용 계정·메일함은 팀 소속이라(보기 범위 in_sidebar 가 조회 시점 기준)
 * 주입 앱이 팀 전환/전체 보기 토글 때 notifyMailTeamContextChanged() 를 불러 목록을 다시 읽게 한다(2026-09-03).
 */

type Listener = () => void;
const listeners = new Set<Listener>();

/** 팀 컨텍스트 변경 구독(해제 함수 반환). */
export function subscribeMailTeamContext(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** 팀 컨텍스트가 바뀌었다고 알린다 — 사이드바 계정/메일함 목록이 다시 로드된다. */
export function notifyMailTeamContextChanged(): void {
    listeners.forEach((listener) => listener());
}
