/** MuaProvider 주입 설정 타입이다. */

import type { VirtualDataTableProps } from "@ehfuse/mui-virtual-data-table";
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
    flush?: boolean; // 본문을 여백 없이 화면 폭에 꽉 채운다(메일 상세 — 좁은 폰에서 본문 폭을 여백에 뺏기지 않게)
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
    | "mail-scheduled"
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
    ownScroll?: MuaMobileOwnScroll; // 하단 탭 메일 목록이 자기 스크롤을 갖는다(0.3.168) — 없으면 예전처럼 셸 본문과 함께 굴러간다
}

/**
 * 하단 탭(페이지 모드) 메일 목록의 자기 스크롤(0.3.168) — 받은 메일을 모두 그리던 카드 목록 대신 VDT 가상 목록으로 그리고,
 * 탭 · 계정 줄은 위에 겹쳐 띄워 목록을 민 만큼(1:1) 앱바와 함께 접는다. 앱 셸이 이 방식을 받쳐 줘야 한다:
 * ① useOwnScroll() 이 불리는 동안 셸은 앱바를 본문 위에 겹쳐 띄우고(자리 0) 본문 여백 · 당김 · 맨 위로 · 자기 접기를 끈다
 * ② 셸은 화면이 쓸 높이를 heightVar 에 적는다 ③ 앱바는 문서 루트의 --appbar-hidden 을 min(값, appBarHeight) 만큼 따라 올라간다.
 */
export interface MuaMobileOwnScroll {
    useOwnScroll: () => void; // 셸에 "이 화면이 스스로 스크롤한다" 고 알리는 훅(마운트 동안)
    appBarHeight: number; // 셸 앱바 높이(px) — 목록 첫머리를 이만큼 더 비운다
    background: string; // 셸 본문 바탕색 — 덮개(탭 · 계정 줄)를 이 색으로 칠한다
    heightVar?: string; // 화면 높이 CSS 변수(기본 "--shell-own-height")
    scrollbars?: VirtualDataTableProps<unknown>["scrollbars"]; // 목록 스크롤 설정(당겨서 새로고침 · 맨 위로 FAB — 셸과 같은 값을 준다)
    appBarSlot?: (el: HTMLElement | null) => void; // 앱바를 목록 첫 줄 안에 그릴 자리(0.3.176) — 주면 셸은 이 자리에 앱바를 포털로 그리고, 앱바도 메일과 함께 굴러간다(머리 접기 계산 없음)
    cssLinked?: boolean; // 머리 접기를 CSS 스크롤 연동 애니메이션으로(기본 true, 지원할 때) — false 면 JS(--appbar-hidden). 안드로이드 WebView 에서 관성 스크롤이 멈췄다 한 번에 튀어 끌 수 있게 했다(0.3.172)
}

/** 공용(shared) 범위 후보 팀 1건 — 앱(업무함)의 팀 개념을 주입받는다. */
export interface MuaTeamOption {
    seq: number; // 팀(account_group) seq
    name: string; // 팀 이름
    role?: string; // 이 팀에서의 내 역할(owner/manager/member) — 공용 계정 등록 가능 판정에 쓴다
}

/** 메일 UI 횡단 주입 설정이다(모두 선택 — 없으면 각 지점이 기본값으로 동작한다). */
export interface MuaConfig {
    account?: MuaAccount | null; // 로그인 계정(소비처가 구독한 리액티브 값) — null/미지정이면 비로그인으로 본다
    isAdmin?: boolean; // 라이선스 관리자 여부(미지정 시 account.rbac_role === "admin")
    FormDialogComponent?: ComponentType<any>; // 앱 공통 FormDialog(폰트 배율 등) — 미지정 시 mfd 기본
    FileUploadBoxComponent?: ComponentType<MuaFileUploadBoxProps>; // 첨부 선택 박스 — 미지정 시 패키지 기본 드롭존
    /**
     * 좁은 화면에서 메일 쓰기 에디터의 서식 툴바를 보일지(0.3.151) — "never"(기본 · 지금 동작): 숨김 /
     * "pwa": 홈 화면에 설치한 웹앱(display-mode: standalone)에서만 보임 / "always": 늘 보임.
     * 앱(WebView)은 standalone 이 아니라 "pwa" 로 두어도 지금처럼 숨는다.
     */
    mobileEditorToolbar?: "never" | "pwa" | "always";
    /**
     * 메일 쓰기 에디터 바꿔 끼우기(0.3.153) — 미지정이면 @ehfuse/editor(기본). 표 등 더 많은 기능이 든 에디터(@ehfuse/editor-pro)를
     * 쓰려는 앱이 그 EhfuseEditor 와 툴바 구성을 넘긴다. 같은 EhfuseEditor 꼴(ref · defaultValue · toolbarOptions · EditorConfig)이어야 한다.
     */
    ComposeEditorComponent?: ComponentType<any>;
    composeToolbarOptions?: unknown;
    /**
     * 서명을 본문 아래 따로 두고 고치기(0.3.153) — 켜면 열 때 본문의 서명(div.mail-signature)을 꺼내 에디터 아래 "서명" 칸에 두고,
     * 보내기 · 임시저장 때 본문에 다시 넣는다(답장 · 전달은 인용문 앞에). 고친 서명은 이 메일에만 쓴다. 미지정이면 지금처럼 본문 안에 있다.
     */
    signatureBelowEditor?: boolean;
    /**
     * 메일 쓰기 자동 임시저장(0.3.155) — 켜면 [임시저장] 단추 대신 내용이 바뀌고 잠시 입력이 멈추면 조용히 임시보관함에 저장하고,
     * 보내지 않고 창을 닫을 때도 한 번 저장한다. 예약해 둔 메일은 자동 저장하지 않는다(임시저장이 예약을 풀기 때문).
     */
    autoSaveDraft?: boolean;
    /**
     * 넓은 화면 목록 머리(0.3.157) — iconToolbar: 검색칸 오른쪽 단추(삭제 · 스팸 · 답장 · 전달 · 읽음 …)를 글 대신 아이콘으로(이름은 툴팁).
     * scopeTabs: 목록 위에 전체 · 안 읽음 · 별표 탭(폰 머리와 같은 갈래) — 켜면 머리의 "안 읽음" 스위치는 감춘다(같은 일을 한다).
     */
    desktop?: { iconToolbar?: boolean; scopeTabs?: boolean };
    /**
     * 색상 라벨(0.3.158) — 켜면 목록 행에 라벨 칩, 머리 툴바 [라벨] 단추 · 우클릭 "라벨" 하위 메뉴, 갈래 탭 뒤에 라벨마다 탭,
     * 관리 창의 "라벨" 목록이 생긴다. 서버에 /v1/mua/labels · /v1/mua/messages/labels · 목록 label_seq 거르기가 있어야 한다 —
     * 없는 앱(서버가 옛 것)은 켜지 않는다. 미지정이면 라벨 API 를 부르지 않고 화면도 그대로다.
     */
    labels?: boolean;
    saveBlob?: (blob: Blob, filename: string) => Promise<boolean> | boolean | void; // 첨부 저장(앱 WebView 브리지 등) — 미지정 시 앵커 다운로드
    previewAttachment?: (file: { name: string; mime: string; size: number; blob: Blob }) => void; // 첨부 미리 보기(앱의 파일 뷰어, 0.3.170) — 주면 첨부를 누를 때 내려받지 않고 뷰어로 연다(내려받기는 뷰어 안에서)
    inboxPath?: string; // 받은편지함 라우트 경로(기본 "/codemarket/mail") — 계정별 경로·모바일 복귀 경로의 기준
    homePath?: string; // 모바일에서 서브페이지를 연 뒤 replace 이동할 경로(기본 inboxPath 의 상위)
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
    mobile?: MuaMobileConfig; // 모바일 셸 주입
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
