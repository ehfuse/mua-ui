/** MuaProvider 주입 설정 타입이다. */
import type { VirtualDataTableProps } from "@ehfuse/mui-virtual-data-table";
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
    /**
     * 고르기만 하는 상자(0.4.18) — 상자가 이것을 받으면 고른 파일을 자기 목록에 쌓지 않고 새로 고른 것만 넘긴다.
     * 쓰기 창은 첨부를 모두 위 칩으로 그린다(상자 아래 목록과 위 칩에 같은 파일이 두 번 보이지 않게). 받지 않는 상자는 onAttachedFilesChange 로 동작한다.
     */
    onFilesPicked?: (files: File[]) => void;
    /** 첨부를 올리는 중 표시(0.4.19) — 상자는 드롭존 안의 안내 문구 대신 이 글과 게이지를 보인다(percent null 이면 진행 중 게이지). */
    progress?: {
        label: ReactNode;
        percent: number | null;
    } | null;
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
    flush?: boolean;
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
export type MuaSubPageId = "mail-inbox" | "mail-sent" | "mail-starred" | "mail-draft" | "mail-scheduled" | "mail-spam" | "mail-trash" | "mail-contacts" | "mail-folder";
/** 모바일 셸 주입(모두 선택 — 없으면 패키지 기본 구현). */
export interface MuaMobileConfig {
    CardListLayout?: ComponentType<MuaMobileCardListLayoutProps>;
    DetailDialog?: ComponentType<MuaMobileDetailDialogProps>;
    searchOverlayStateId?: string;
    searchWidth?: string;
    subPage?: MuaSubPageBridge;
    ownScroll?: MuaMobileOwnScroll;
}
/**
 * 하단 탭(페이지 모드) 메일 목록의 자기 스크롤(0.3.168) — 받은 메일을 모두 그리던 카드 목록 대신 VDT 가상 목록으로 그리고,
 * 탭 · 계정 줄은 위에 겹쳐 띄워 목록을 민 만큼(1:1) 앱바와 함께 접는다. 앱 셸이 이 방식을 받쳐 줘야 한다:
 * ① useOwnScroll() 이 불리는 동안 셸은 앱바를 본문 위에 겹쳐 띄우고(자리 0) 본문 여백 · 당김 · 맨 위로 · 자기 접기를 끈다
 * ② 셸은 화면이 쓸 높이를 heightVar 에 적는다 ③ 앱바는 문서 루트의 --appbar-hidden 을 min(값, appBarHeight) 만큼 따라 올라간다.
 */
export interface MuaMobileOwnScroll {
    useOwnScroll: () => void;
    appBarHeight: number;
    background: string;
    heightVar?: string;
    scrollbars?: VirtualDataTableProps<unknown>["scrollbars"];
    appBarSlot?: (el: HTMLElement | null) => void;
    cssLinked?: boolean;
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
     * 받는 사람 자동완성에 더할 사람들(0.3.186) — 앱이 가진 직원 · 구성원 명단(이름 · 주소 · 소속).
     * 주소록(조직 공용 + 개인)과 함께 후보가 된다. 같은 주소가 주소록에 있으면 주소록 쪽을 쓴다(즐겨찾기 · 소속을 사람이 고쳐 두었을 수 있다).
     * 직원을 주소록에 일일이 넣지 않아도 이름을 치면 뜨게 하려는 것이다.
     */
    recipientDirectory?: Array<{
        name: string;
        email: string;
        organization?: string;
    }>;
    /**
     * 받는 사람 고르기 창(0.4.3) — 주면 받는 사람 · 참조 · 숨은참조 칸 왼쪽에 사람 아이콘이 서고, 누르면 이것을 부른다.
     * 앱이 제 고르기 창(조직도 등)을 띄우고 고른 사람들을 돌려준다(취소면 null). 이미 칸에 있는 주소는 다시 넣지 않는다.
     */
    /**
     * 폴더 화면 주소(2026-10-27) — 패키지 안에서 다른 폴더로 보내야 할 때(사용량 게이지의 [스팸 비우기]) 앱 라우트로 옮긴다.
     * 없으면 주소는 그대로 두고 목록만 그 폴더로 바꾼다.
     */
    folderPath?: (folder: "inbox" | "sent" | "spam" | "trash" | "draft" | "starred") => string;
    pickRecipients?: (field: "to" | "cc" | "bcc") => Promise<Array<{
        name?: string;
        email: string;
    }> | null | undefined>;
    /**
     * 메일 쓰기 자동 임시저장(0.3.155) — 켜면 [임시저장] 단추 대신 내용이 바뀌고 잠시 입력이 멈추면 조용히 임시보관함에 저장하고,
     * 보내지 않고 창을 닫을 때도 한 번 저장한다. 예약해 둔 메일은 자동 저장하지 않는다(임시저장이 예약을 풀기 때문).
     */
    autoSaveDraft?: boolean;
    /**
     * 넓은 화면 목록 머리(0.3.157) — iconToolbar: 검색칸 오른쪽 단추(삭제 · 스팸 · 답장 · 전달 · 읽음 …)를 글 대신 아이콘으로(이름은 툴팁).
     * scopeTabs: 목록 위에 전체 · 안 읽음 · 별표 탭(폰 머리와 같은 갈래) — 켜면 머리의 "안 읽음" 스위치는 감춘다(같은 일을 한다).
     */
    desktop?: {
        iconToolbar?: boolean;
        scopeTabs?: boolean;
    };
    /**
     * 색상 라벨(0.3.158) — 켜면 목록 행에 라벨 칩, 머리 툴바 [라벨] 단추 · 우클릭 "라벨" 하위 메뉴, 갈래 탭 뒤에 라벨마다 탭,
     * 관리 창의 "라벨" 목록이 생긴다. 서버에 /v1/mua/labels · /v1/mua/messages/labels · 목록 label_seq 거르기가 있어야 한다 —
     * 없는 앱(서버가 옛 것)은 켜지 않는다. 미지정이면 라벨 API 를 부르지 않고 화면도 그대로다.
     */
    labels?: boolean;
    saveBlob?: (blob: Blob, filename: string) => Promise<boolean> | boolean | void;
    previewAttachment?: (file: {
        name: string;
        mime: string;
        size: number;
        blob: Blob;
    }) => void;
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
     * 메일 상세를 새 창으로 연다(0.4.12) — 주면 넓은 화면 상세 머리줄에 [새 창으로 열기] 가 생긴다. false 를 돌려주면(창이 막힘) 상세를 닫지 않는다.
     * 창을 띄우고 그 창에서 windowMessageSeq 를 주는 것은 소비처 몫이다.
     */
    openMessageWindow?: (seq: number) => boolean | void;
    /** 이 화면이 메일 창이면 보여 줄 메일 번호(0.4.12) — 주면 목록 없이 그 메일 하나만 창 가득 그린다. */
    windowMessageSeq?: number;
    /**
     * 모바일 목록이 처음 읽는 동안의 스피너(0.4.15) — 미지정이면 회색 원형 스피너를 화면 가운데 띄운다.
     * 앱이 새로고침 때 띄워 둔 부트 스피너를 이어 쓰게 할 때 준다(스피너가 바뀌며 다시 도는 것처럼 보이지 않게).
     */
    loadingSpinner?: ComponentType;
    /**
     * 앱이 메일 관리 UI(MailManageHost)를 자기 레이아웃에 직접 둔다는 표시.
     * 켜면 메일 화면(Layout)은 호스트를 그리지 않는다 — 둘 다 그리면 요청을 양쪽이 소비해 다이얼로그가 두 개 뜬다.
     * 사이드바 메일 그룹의 + 처럼 메일 화면 밖에서 관리를 여는 앱이 쓴다.
     */
    appHostsMailManage?: boolean;
}
