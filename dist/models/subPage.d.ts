/**
 * 메일 모바일 서브페이지(mfd 풀스크린 슬라이드) 열기 헬퍼 + 계정 타깃 스토어.
 *
 * 폴더는 서브페이지 id(`mail-inbox` 등 — subPageHost)로 구분되지만, 계정별 받은편지함은 폴더가 같고
 * **계정만 다르다**. 전역 서브페이지 스토어는 id 하나만 받으므로, 계정은 이 모듈 스토어에 적어 두고
 * 본문(MailSubPages)이 마운트될 때 읽어 필터로 쓴다.
 * (알림 딥링크용 deepLinkSeq 는 URL `?seq=` 로 심어지는 값이라 여기에 섞어 쓰지 않는다.)
 */
import type { MuaSubPageId as SubPageId } from "../types/config";
import type { MailListFolder } from "./types";
/** 폴더 → 서브페이지 id */
/** 서브페이지로 열 수 있는 메일 화면 키(폴더 + 주소록) */
export type MailSubPageKey = MailListFolder | "contacts";
export declare const MAIL_SUB_PAGE_ID_BY_FOLDER: Record<MailSubPageKey, SubPageId>;
/** 폴더 표시명(제목바·상세 다이얼로그 제목) — 사이드바 메뉴 라벨과 동일. */
export declare const MAIL_FOLDER_LABELS: Record<MailSubPageKey, string>;
/** 서브페이지 id 가 메일 폴더 페이지인지 판정한다. */
export declare function isMailSubPageId(id: SubPageId): boolean;
/** 현재 메일함 타깃을 구독한다(사용자 메일함 서브페이지 본문 전용). */
export declare function useMailSubPageFolderSeq(): number;
/** 사용자 메일함 서브페이지를 연다. */
export declare function openMailFolderSubPage(folderSeq: number): void;
/** 현재 계정 타깃을 구독한다(서브페이지 본문 전용). */
export declare function useMailSubPageAccountSeq(): number;
/**
 * 메일 폴더 서브페이지를 연다(모바일 사이드바 메뉴·계정 항목·라우트 진입이 모두 이 함수를 쓴다).
 * @param folder 폴더
 * @param accountSeq 계정별 받은편지함이면 계정 seq(그 외 0 = 전체 계정)
 */
export declare function openMailSubPage(folder: MailSubPageKey, accountSeq?: number): void;
