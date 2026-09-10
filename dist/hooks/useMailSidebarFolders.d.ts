/**
 * 사이드바용 사용자 메일함 로더 — 전역 mail-state 의 folders(+미읽음 수)를 채운다(메일 화면과 공유, 메일함 관리 후 갱신).
 * realtime(mua.mail.changed) 수신 시 다시 읽어 배지를 맞춘다.
 */
import type { MailUserFolder } from "../models/types";
/** 로그인 상태일 때 사용자 메일함 목록을 1회 로드한다(메일 화면이 갱신하면 그대로 반영된다). */
export declare function useMailSidebarFolders(enabled: boolean): MailUserFolder[];
