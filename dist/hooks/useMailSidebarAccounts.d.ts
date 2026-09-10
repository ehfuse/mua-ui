/**
 * 사이드바용 메일 계정 로더 — 셸(코드마켓 Layout/Sidebar)에서 메일 계정 목록(+미읽음)을 전역 mail-state 에 채운다.
 *
 * 메일 화면 컨트롤러(useMailController)와 같은 stateId 를 쓰므로 메일 화면이 갱신하는 미읽음 수가
 * 사이드바 배지에 그대로 반영되고, 반대로 사이드바가 먼저 채운 계정 목록을 메일 화면이 이어받는다.
 * realtime(mua.mail.changed) 수신 시 조용히 다시 읽어 배지를 맞춘다.
 */
import type { MailAccount } from "../models/types";
/** 로그인 상태일 때 메일 계정 목록을 1회 로드하고 realtime 으로 갱신한다. */
export declare function useMailSidebarAccounts(enabled: boolean): MailAccount[];
