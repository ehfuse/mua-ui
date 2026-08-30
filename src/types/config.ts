/** MuaProvider 주입 설정 타입이다. */

import type { ComponentType, ReactNode } from "react";
import type { ListLayoutProps } from "@ehfuse/mui-dashboard-layout";
import type { FormDialogProps } from "@ehfuse/mui-form-dialog";

/** 메일 UI 가 필요로 하는 로그인 계정 정보다(소비처 계정 객체의 부분집합). */
export interface MuaAccount {
    seq?: number; // 계정 seq
    name?: string; // 표시 이름(신규 메일 계정의 "보내는 사람 이름" 기본값)
    rbac_role?: string; // 권한 역할(admin = 공용 계정 등록 가능)
    license_seq?: number; // 소속 라이선스 seq
}

/** 첨부 파일 선택 박스(작성 다이얼로그) 계약 — 앱의 FileUploadBox 가 이 props 를 받으면 그대로 주입할 수 있다. */
export interface MuaFileUploadBoxProps {
    multiple?: boolean; // 다중 선택
    height?: number | string; // 박스 높이
    variant?: "box" | "icon" | "list"; // 표시 형태(기본 box)
    acceptedFileTypes?: string[]; // 허용 확장자(빈 배열 = 전부)
    maxFileSize?: number; // 파일당 최대 MB
    dropzoneText?: ReactNode; // 드롭존 안내 문구
    onAttachedFilesChange?: (files: File[]) => void; // 선택(스테이징) 파일 변경
}

/** 모바일 카드 목록 래퍼 계약(앱의 MobileCardListLayout 과 동일). */
export interface MuaMobileCardListLayoutProps {
    header: NonNullable<ListLayoutProps["header"]>; // 헤더(검색/필터) 설정
    searchOverlayOpen: boolean; // 검색 오버레이 열림 여부
    storageKey?: string; // ListLayout 저장 키
    children: ReactNode; // 카드 목록
    inDialog?: boolean; // 서브페이지 다이얼로그 안에서 렌더되는지
}

/** 모바일 상세 슬라이드 다이얼로그 계약(앱의 MobileDetailDialog 와 동일). */
export interface MuaMobileDetailDialogProps {
    modalId: string; // 모달 고유 ID
    open: boolean; // 열림 여부
    title: string; // 제목바 문구
    onClose: () => void; // 닫힘 처리
    children: ReactNode; // 본문
    actions?: FormDialogProps["actions"]; // 하단 액션바(선택)
}

/**
 * 모바일 서브페이지 브리지 — 앱의 전역 서브페이지 호스트(라우트 이동 없이 mfd 풀스크린 슬라이드로 여는 스토어)와 잇는다.
 * 컴포넌트 밖(사이드바 메뉴 정의 등)에서도 불리므로 Provider 가 모듈 등록소에 올려 둔다.
 */
export interface MuaSubPageBridge {
    open?: (id: MuaSubPageId) => void; // 서브페이지 열기(id = "mail-inbox" 등)
    setTitle?: (title: string | null) => void; // 제목바 문구 덮어쓰기(null = 기본)
    setCount?: (count: number | null) => void; // 제목바 건수 "(N)"
}

/** 메일 서브페이지 id */
export type MuaSubPageId =
    | "mail-inbox"
    | "mail-sent"
    | "mail-starred"
    | "mail-draft"
    | "mail-spam"
    | "mail-trash"
    | "mail-contacts"
    | "mail-folder";

/** 모바일 셸 주입(모두 선택 — 없으면 패키지 기본 구현). */
export interface MuaMobileConfig {
    CardListLayout?: ComponentType<MuaMobileCardListLayoutProps>; // 카드 목록 래퍼(검색 오버레이·정의폭)
    DetailDialog?: ComponentType<MuaMobileDetailDialogProps>; // 상세 슬라이드 다이얼로그
    searchOverlayStateId?: string; // 앱바 돋보기 ↔ 검색 오버레이 forma 전역 상태 id(기본 "dashboard-mobile-search-overlay")
    searchWidth?: string; // 모바일 검색칸 폭(기본 "100%")
    subPage?: MuaSubPageBridge; // 서브페이지 브리지
}

/** 메일 UI 횡단 주입 설정이다(모두 선택 — 없으면 각 지점이 기본값으로 동작한다). */
export interface MuaConfig {
    account?: MuaAccount | null; // 로그인 계정(소비처가 구독한 리액티브 값) — null/미지정이면 비로그인으로 본다
    isAdmin?: boolean; // 라이선스 관리자 여부(미지정 시 account.rbac_role === "admin")
    FormDialogComponent?: ComponentType<any>; // 앱 공통 FormDialog(폰트 배율 등) — 미지정 시 mfd 기본
    FileUploadBoxComponent?: ComponentType<MuaFileUploadBoxProps>; // 첨부 선택 박스 — 미지정 시 패키지 기본 드롭존
    saveBlob?: (blob: Blob, filename: string) => Promise<boolean> | boolean | void; // 첨부 저장(앱 WebView 브리지 등) — 미지정 시 앵커 다운로드
    inboxPath?: string; // 받은편지함 라우트 경로(기본 "/codemarket/mail") — 계정별 경로·모바일 복귀 경로의 기준
    homePath?: string; // 모바일에서 서브페이지를 연 뒤 replace 이동할 경로(기본 inboxPath 의 상위)
    mobile?: MuaMobileConfig; // 모바일 셸 주입
    /**
     * 본문 안의 링크를 여는 방법. 미지정이면 window.open(새 탭).
     * 앱 웹뷰(Flutter)처럼 새 탭이 없는 환경은 여기서 외부 브라우저 열기 메시지를 보낸다(업무함과 같은 주입).
     */
    openExternalUrl?: (url: string) => void;
}
