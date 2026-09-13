/**
 * 메일 라우트 진입점(`/codemarket/mail`, `/codemarket/mail/:folder`, `/codemarket/mail/account/:accountSeq`).
 *
 * 데스크탑은 MailLayout(ListLayout 표 + 오른쪽 상세 패널)을 그대로 그린다.
 * 모바일은 대시보드 SubPageRoute 와 같은 규칙 — 페이지를 그리지 않고 **mfd 풀스크린 슬라이드 서브페이지**를 연 뒤
 * 코드마켓 메인으로 replace 이동한다. 그래야 다이얼로그를 닫았을 때 빈 메일 페이지가 아니라 메인이 드러나고,
 * 뒤로가기 한 번(useModal history 1개)으로 닫힌다. 라우트를 없애지 않는 이유는 딥링크/새로고침/북마크 때문이다.
 */

import { useEffect } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useIsMobile } from "../internal/useIsMobile";
import { getMailHomePath } from "../internal/pathsRegistry";
import { openMailFolderSubPage, openMailSubPage } from "../models/subPage";
import { toRouteFolder } from "../utils/routeFolder";
import MailLayout from "./Layout";
import ContactsPage from "./ContactsPage";

import { getMuaSubPageBridge } from "../internal/subPageBridge";
/** 메일 라우트 페이지 — 모바일이면 서브페이지 다이얼로그로 전환하고, 데스크탑이면 레이아웃을 그대로 렌더한다. */
export default function MailRouteEntry() {
    const isMobile = useIsMobile();
    const location = useLocation();
    const params = useParams<{ folder?: string; accountSeq?: string; folderSeq?: string }>();
    // `mail/contacts` 는 폴더가 아니라 주소록 페이지다.
    const isContacts = params.folder === "contacts";
    const folder = toRouteFolder(params.folder);
    const accountSeq = params.accountSeq !== undefined ? Number(params.accountSeq) || 0 : 0;
    const userFolderSeq = params.folderSeq !== undefined ? Number(params.folderSeq) || 0 : 0;

    // 모바일에서 서브페이지로 넘길지 — 앱이 서브페이지 브리지를 등록했을 때만이다(2026-09-13).
    // 브리지가 없는 앱(업무함은 모바일을 라우트 트리로 다룬다)에서 넘기면 open 이 아무 일도 안 하고
    // 아래 Navigate 가 받은편지함으로 되돌려, 메뉴에서 어느 메일함을 눌러도 받은편지함만 보였다.
    // 그런 앱에서는 라우트 그대로 목록을 그린다 — MailLayout 이 라우트 파라미터로 폴더를 정한다.
    const handOffToSubPage = isMobile && Boolean(getMuaSubPageBridge()?.open);

    // 모바일 진입 시 전역 서브페이지를 연다(아래 Navigate 로 라우트는 메인으로 교체된다).
    useEffect(() => {
        if (handOffToSubPage) {
            if (userFolderSeq > 0) openMailFolderSubPage(userFolderSeq);
            else openMailSubPage(isContacts ? "contacts" : folder, accountSeq);
        }
    }, [handOffToSubPage, isContacts, folder, accountSeq, userFolderSeq]);

    if (handOffToSubPage) {
        // replace 로 교체해 history 에 메일 라우트 항목을 남기지 않는다(뒤로가기 = 다이얼로그 닫기 한 번).
        return <Navigate to={getMailHomePath()} replace state={location.state} />;
    }

    return isContacts ? <ContactsPage /> : <MailLayout />;
}
