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
import { openMailSubPage } from "../models/subPage";
import { toRouteFolder } from "../utils/routeFolder";
import MailLayout from "./Layout";

/** 메일 라우트 페이지 — 모바일이면 서브페이지 다이얼로그로 전환하고, 데스크탑이면 레이아웃을 그대로 렌더한다. */
export default function MailRouteEntry() {
    const isMobile = useIsMobile();
    const location = useLocation();
    const params = useParams<{ folder?: string; accountSeq?: string }>();
    const folder = toRouteFolder(params.folder);
    const accountSeq = params.accountSeq !== undefined ? Number(params.accountSeq) || 0 : 0;

    // 모바일 진입 시 전역 서브페이지를 연다(아래 Navigate 로 라우트는 메인으로 교체된다).
    useEffect(() => {
        if (isMobile) {
            openMailSubPage(folder, accountSeq);
        }
    }, [isMobile, folder, accountSeq]);

    if (isMobile) {
        // replace 로 교체해 history 에 메일 라우트 항목을 남기지 않는다(뒤로가기 = 다이얼로그 닫기 한 번).
        return <Navigate to={getMailHomePath()} replace state={location.state} />;
    }

    return <MailLayout />;
}
