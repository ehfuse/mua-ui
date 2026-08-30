/**
 * 메일 모바일 서브페이지 본문 — 폴더마다 하나씩, 같은 MailLayout 을 embedded(폴더 고정)로 마운트한다.
 *
 * SubPageDialogHost(mfd 풀스크린 슬라이드) 안에서 렌더되며 라우트 파라미터가 없으므로
 * 폴더는 props 로, 계정별 받은편지함의 계정은 모듈 스토어(useMailSubPageAccountSeq)로 받는다.
 */

import { useMailSubPageAccountSeq, useMailSubPageFolderSeq } from "../models/subPage";
import MailLayout from "./Layout";
import ContactsPage from "./ContactsPage";

/** 받은편지함(전체 또는 계정별 — 계정은 openMailSubPage 가 스토어에 적어 둔 값). */
export function MailInboxSubPage() {
    const accountSeq = useMailSubPageAccountSeq();
    return <MailLayout embedded={{ folder: "inbox", accountSeq }} />;
}

/**
 * 받은편지함 탭 페이지(모바일 하단 내비게이션) — 서브페이지 다이얼로그가 아니라 라우트 페이지 안에 인라인으로 그린다.
 * 레이아웃 스크롤(당겨서-새로고침 포함)을 그대로 쓰고, 뒤로가기는 라우트 규칙을 따른다.
 */
export function MailInboxTabPage() {
    return <MailLayout embedded={{ folder: "inbox", inline: true }} />;
}

/** 보낸편지함 */
export function MailSentSubPage() {
    return <MailLayout embedded={{ folder: "sent" }} />;
}

/** 중요편지함(별표 가상 폴더) */
export function MailStarredSubPage() {
    return <MailLayout embedded={{ folder: "starred" }} />;
}

/** 임시보관함 */
export function MailDraftSubPage() {
    return <MailLayout embedded={{ folder: "draft" }} />;
}

/** 스팸함 */
export function MailSpamSubPage() {
    return <MailLayout embedded={{ folder: "spam" }} />;
}

/** 휴지통 */
export function MailTrashSubPage() {
    return <MailLayout embedded={{ folder: "trash" }} />;
}

/** 주소록 */
export function MailContactsSubPage() {
    return <ContactsPage embedded />;
}

/** 사용자 메일함(openMailFolderSubPage 가 스토어에 적어 둔 메일함) */
export function MailFolderSubPage() {
    const folderSeq = useMailSubPageFolderSeq();
    return <MailLayout embedded={{ folder: "custom", folderSeq }} />;
}
