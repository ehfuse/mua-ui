/**
 * 진입 부트스트랩 — 계정·메일함·규칙을 GET /v1/mua/bootstrap **한 번**으로 읽어 사이드바 훅과 메일 화면이 나눠 쓴다.
 *
 * 셸 사이드바가 메일 계정·메일함을 그리는 구조라, 예전엔 메일 화면이 아닌 곳에서 새로고침해도
 * /accounts 와 /folders 가 따로 나갔다(메일 화면이면 /rules 까지 3건). 셋 다 진입 시 한 번에 받으면 되는
 * 목록이라 여기서 합친다(0.3.81). 먼저 도는 쪽이 요청을 내고, 같은 tick 의 다른 쪽은 그 응답을 이어받는다.
 *
 * ⚠️ 종류(accounts/folders/rules)마다 **한 번만** 준다. 메일 화면은 다른 화면에 갔다 오면 다시 마운트되는데,
 * 그때 낡은 진입 응답을 다시 쓰면 그 사이 바뀐 계정·메일함·규칙이 되돌아간다. 두 번째부터는 null 을 돌려
 * 부르는 쪽이 개별 라우트로 읽거나(규칙) 이미 채워 둔 전역 상태를 이어받게(계정·메일함) 한다.
 *
 * 채움 표시(markMailSidebarFilled)는 누군가(사이드바 훅 또는 메일 화면) 전역 mail-state 에 계정·메일함을 넣었다는 뜻이다.
 * 뒤에 마운트되는 쪽은 그 목록을 다시 읽지 않는다 — 사이드바 훅이 realtime·팀 컨텍스트 알림으로 계속 맞춰 두므로
 * 이어받아도 어긋나지 않는다(0.3.79).
 *
 * 채움 표시는 **켜진 사이드바 훅이 하나라도 남아 있는 동안** 유지한다(0.4.86). 예전엔 훅이 내려갈 때마다 지워,
 * 셸 사이드바 말고 화면 안에서 쓰는 훅(직원 목록 · 피드 프로필의 "메일 쓰기" 가능 여부)이 내려가면 표시가 사라져
 * 다음 화면 · 메일 재진입마다 /accounts 가 다시 나갔다. 켜진 훅이 모두 내려가면(로그아웃) 맞춰 줄 쪽이 없으니 지운다.
 * 같은 tick 에 여러 훅이 다시 읽으면(realtime · 팀 전환 — 훅마다 알림을 받는다) 요청 한 건을 나눠 쓴다.
 */

import { mailApi, unwrap, type MailBootstrapData } from "../apis/mailApi";

/** 진입 응답에서 나눠 주는 목록 종류 */
export type MailEntryKey = keyof MailBootstrapData;

let entry: Promise<MailBootstrapData | null> | null = null;
const claimed = new Set<MailEntryKey>();
const delivered = new Set<MailEntryKey>();

/** 진입 응답을 한 번만 읽는다(실패는 null — 부르는 쪽이 개별 라우트로 읽는다). */
function loadEntry(): Promise<MailBootstrapData | null> {
    if (!entry) {
        entry = mailApi
            .bootstrap()
            .then((res) => unwrap(res, ""))
            .catch(() => null);
    }
    return entry;
}

/**
 * 진입 응답에서 그 종류를 가져온다. 돌아오는 값의 뜻:
 *   - Promise  : 내가 받는다(값이 오면 전역 상태에 넣는다).
 *   - null     : 다른 쪽이 **지금 채우는 중** — 기다리면 전역 상태에 들어온다(다시 읽지 않는다).
 *   - undefined 로 resolve : 줄 것이 없다(요청 실패, 또는 이미 한 번 나눠 준 뒤) — 개별 라우트로 읽어야 한다.
 */
export function takeMailEntry<K extends MailEntryKey>(key: K): Promise<MailBootstrapData[K] | undefined> | null {
    if (claimed.has(key)) return delivered.has(key) ? Promise.resolve(undefined) : null;
    // ⚠️ await 앞에서 동기로 찜한다 — 사이드바 훅과 메일 화면의 effect 가 같은 tick 에 돌아, 응답을 기다렸다
    // 표시하면 둘 다 "내가 채운다" 로 판단해 요청이 두 번 나간다.
    claimed.add(key);
    return loadEntry().then((data) => {
        delivered.add(key);
        return data ? data[key] : undefined;
    });
}

/** 다음 진입 때 다시 읽게 한다(로그아웃·재로그인 — 앱 bootstrap 이 부른다). */
export function resetMailEntry(): void {
    entry = null;
    claimed.clear();
    delivered.clear();
    filled.clear();
}

type SidebarListKey = "accounts" | "folders";

const filled = new Set<SidebarListKey>();
/** 켜져 있는 사이드바 훅 수(목록마다) — 0 이 되면 채움 표시를 지운다. */
const holders: Record<SidebarListKey, number> = { accounts: 0, folders: 0 };
/** 지금 다시 읽는 중인 요청(목록마다) — 같은 때 부른 훅들이 이어받는다. */
const reloading: Partial<Record<SidebarListKey, Promise<void>>> = {};

/** 사이드바 훅이 전역 mail-state 의 그 목록을 채웠다고 표시한다. */
export function markMailSidebarFilled(key: SidebarListKey, value: boolean): void {
    if (value) filled.add(key);
    else filled.delete(key);
}

/**
 * 켜진 사이드바 훅이 그 목록을 맡는다 — 돌려준 함수로 놓는다. 마지막 훅이 놓으면 채움 표시를 지운다
 * (맞춰 줄 훅이 없으니 다음에 켜지는 훅 · 메일 화면이 다시 읽는다).
 */
export function holdMailSidebarList(key: SidebarListKey): () => void {
    holders[key] += 1;
    let released = false;
    return () => {
        if (released) return;
        released = true;
        holders[key] = Math.max(0, holders[key] - 1);
        if (holders[key] === 0) filled.delete(key);
    };
}

/** 그 목록을 다시 읽는다 — 이미 읽는 중이면 그 요청을 이어받는다(훅 여럿이 같은 알림을 받아도 한 건). */
export function reloadMailSidebarList(key: SidebarListKey, load: () => Promise<void>): Promise<void> {
    const running = reloading[key];
    if (running) return running;
    const request = load().finally(() => {
        if (reloading[key] === request) delete reloading[key];
    });
    reloading[key] = request;
    return request;
}

/** 사이드바 훅이 그 목록을 채워 두었는지 — 메일 화면 첫 로드가 서버 대신 전역 상태를 이어받을지 판단한다. */
export function isMailSidebarFilled(key: "accounts" | "folders"): boolean {
    return filled.has(key);
}
