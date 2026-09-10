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
 */
import { type MailBootstrapData } from "../apis/mailApi";
/** 진입 응답에서 나눠 주는 목록 종류 */
export type MailEntryKey = keyof MailBootstrapData;
/**
 * 진입 응답에서 그 종류를 가져온다. 돌아오는 값의 뜻:
 *   - Promise  : 내가 받는다(값이 오면 전역 상태에 넣는다).
 *   - null     : 다른 쪽이 **지금 채우는 중** — 기다리면 전역 상태에 들어온다(다시 읽지 않는다).
 *   - undefined 로 resolve : 줄 것이 없다(요청 실패, 또는 이미 한 번 나눠 준 뒤) — 개별 라우트로 읽어야 한다.
 */
export declare function takeMailEntry<K extends MailEntryKey>(key: K): Promise<MailBootstrapData[K] | undefined> | null;
/** 다음 진입 때 다시 읽게 한다(로그아웃·재로그인 — 앱 bootstrap 이 부른다). */
export declare function resetMailEntry(): void;
/** 사이드바 훅이 전역 mail-state 의 그 목록을 채웠다고 표시한다(훅이 꺼지면 지운다 — 로그아웃 뒤 재로그인 대비). */
export declare function markMailSidebarFilled(key: "accounts" | "folders", value: boolean): void;
/** 사이드바 훅이 그 목록을 채워 두었는지 — 메일 화면 첫 로드가 서버 대신 전역 상태를 이어받을지 판단한다. */
export declare function isMailSidebarFilled(key: "accounts" | "folders"): boolean;
