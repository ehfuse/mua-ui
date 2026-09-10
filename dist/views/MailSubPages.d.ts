/**
 * 메일 모바일 서브페이지 본문 — 폴더마다 하나씩, 같은 MailLayout 을 embedded(폴더 고정)로 마운트한다.
 *
 * SubPageDialogHost(mfd 풀스크린 슬라이드) 안에서 렌더되며 라우트 파라미터가 없으므로
 * 폴더는 props 로, 계정별 받은편지함의 계정은 모듈 스토어(useMailSubPageAccountSeq)로 받는다.
 */
/** 받은편지함(전체 또는 계정별 — 계정은 openMailSubPage 가 스토어에 적어 둔 값). */
export declare function MailInboxSubPage(): import("react").JSX.Element;
/**
 * 받은편지함 탭 페이지(모바일 하단 내비게이션) — 서브페이지 다이얼로그가 아니라 라우트 페이지 안에 인라인으로 그린다.
 * 레이아웃 스크롤(당겨서-새로고침 포함)을 그대로 쓰고, 뒤로가기는 라우트 규칙을 따른다.
 */
export declare function MailInboxTabPage(): import("react").JSX.Element;
/** 보낸편지함 */
export declare function MailSentSubPage(): import("react").JSX.Element;
/** 중요편지함(별표 가상 폴더) */
export declare function MailStarredSubPage(): import("react").JSX.Element;
/** 임시보관함 */
export declare function MailDraftSubPage(): import("react").JSX.Element;
/** 스팸함 */
export declare function MailSpamSubPage(): import("react").JSX.Element;
/** 휴지통 */
export declare function MailTrashSubPage(): import("react").JSX.Element;
/** 주소록 */
export declare function MailContactsSubPage(): import("react").JSX.Element;
/** 사용자 메일함(openMailFolderSubPage 가 스토어에 적어 둔 메일함) */
export declare function MailFolderSubPage(): import("react").JSX.Element;
