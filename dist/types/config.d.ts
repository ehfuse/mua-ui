/** MuaProvider 주입 설정 타입이다. */
import type { ComponentType, ReactNode } from "react";
import type { ListLayoutProps } from "@ehfuse/mui-dashboard-layout";
import type { FormDialogProps } from "@ehfuse/mui-form-dialog";
/** 메일 UI 가 필요로 하는 로그인 계정 정보다(소비처 계정 객체의 부분집합). */
export interface MuaAccount {
    seq?: number;
    name?: string;
    rbac_role?: string;
    license_seq?: number;
}
/** 첨부 파일 선택 박스(작성 다이얼로그) 계약 — 앱의 FileUploadBox 가 이 props 를 받으면 그대로 주입할 수 있다. */
export interface MuaFileUploadBoxProps {
    multiple?: boolean;
    height?: number | string;
    variant?: "box" | "icon" | "list";
    acceptedFileTypes?: string[];
    maxFileSize?: number;
    dropzoneText?: ReactNode;
    onAttachedFilesChange?: (files: File[]) => void;
}
/** 모바일 카드 목록 래퍼 계약(앱의 MobileCardListLayout 과 동일). */
export interface MuaMobileCardListLayoutProps {
    header: NonNullable<ListLayoutProps["header"]>;
    searchOverlayOpen: boolean;
    storageKey?: string;
    children: ReactNode;
    inDialog?: boolean;
}
/** 모바일 상세 슬라이드 다이얼로그 계약(앱의 MobileDetailDialog 와 동일). */
export interface MuaMobileDetailDialogProps {
    modalId: string;
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    actions?: FormDialogProps["actions"];
}
/**
 * 모바일 서브페이지 브리지 — 앱의 전역 서브페이지 호스트(라우트 이동 없이 mfd 풀스크린 슬라이드로 여는 스토어)와 잇는다.
 * 컴포넌트 밖(사이드바 메뉴 정의 등)에서도 불리므로 Provider 가 모듈 등록소에 올려 둔다.
 */
export interface MuaSubPageBridge {
    open?: (id: MuaSubPageId) => void;
    setTitle?: (title: string | null) => void;
    setCount?: (count: number | null) => void;
}
/** 메일 서브페이지 id */
export type MuaSubPageId = "mail-inbox" | "mail-sent" | "mail-starred" | "mail-draft" | "mail-spam" | "mail-trash" | "mail-contacts" | "mail-folder";
/** 모바일 셸 주입(모두 선택 — 없으면 패키지 기본 구현). */
export interface MuaMobileConfig {
    CardListLayout?: ComponentType<MuaMobileCardListLayoutProps>;
    DetailDialog?: ComponentType<MuaMobileDetailDialogProps>;
    searchOverlayStateId?: string;
    searchWidth?: string;
    subPage?: MuaSubPageBridge;
}
/** 공용(shared) 범위 후보 팀 1건 — 앱(업무함)의 팀 개념을 주입받는다. */
export interface MuaTeamOption {
    seq: number;
    name: string;
    role?: string;
}
/** 메일 UI 횡단 주입 설정이다(모두 선택 — 없으면 각 지점이 기본값으로 동작한다). */
export interface MuaConfig {
    account?: MuaAccount | null;
    isAdmin?: boolean;
    FormDialogComponent?: ComponentType<any>;
    FileUploadBoxComponent?: ComponentType<MuaFileUploadBoxProps>;
    saveBlob?: (blob: Blob, filename: string) => Promise<boolean> | boolean | void;
    inboxPath?: string;
    homePath?: string;
    /**
     * 내가 속한 팀 목록 — 지정하면 공용 계정/메일함 폼에 "어느 팀의 공용인지" 선택이 생기고,
     * 서버도 팀 단위로 공용을 격리한다(팀별로 공용 메일이 다르다). 미지정이면 팀 UI 없음(단일 조직 앱).
     */
    teams?: MuaTeamOption[];
    /** 현재 팀 seq — 팀 선택의 기본값(미지정/0 이면 첫 팀). */
    currentTeamSeq?: number;
    /**
     * 모바일 판정 주입(소비처가 구독한 리액티브 값) — 미지정 시 뷰포트 < theme lg.
     * 앱의 모바일 기준(예: 업무함 768px)과 패키지 기본(lg=1200)이 다르면 데스크톱 창에서
     * 메일만 모바일 서브페이지로 열리는 어긋남이 생긴다 — 앱 판정을 그대로 넘겨 맞춘다.
     */
    isMobile?: boolean;
    mobile?: MuaMobileConfig;
    /**
     * 본문 안의 링크를 여는 방법. 미지정이면 window.open(새 탭).
     * 앱 웹뷰(Flutter)처럼 새 탭이 없는 환경은 여기서 외부 브라우저 열기 메시지를 보낸다(업무함과 같은 주입).
     */
    openExternalUrl?: (url: string) => void;
    /**
     * 앱이 메일 관리 UI(MailManageHost)를 자기 레이아웃에 직접 둔다는 표시.
     * 켜면 메일 화면(Layout)은 호스트를 그리지 않는다 — 둘 다 그리면 요청을 양쪽이 소비해 다이얼로그가 두 개 뜬다.
     * 사이드바 메일 그룹의 + 처럼 메일 화면 밖에서 관리를 여는 앱이 쓴다.
     */
    appHostsMailManage?: boolean;
}
