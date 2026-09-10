/**
 * 메일(MUA) 레이아웃 — ListLayout(툴바 헤더 + 메시지 목록 + 오른쪽 상세 패널).
 *
 * 데이터는 로그인 토큰의 사용자(account_seq) 기준으로 AS 가 스코핑하므로 코드마켓/대시보드 어느 셸에 마운트해도 동작한다.
 * 목록 재조회는 필터(계정/폴더/검색/미읽음/중요) 변화를 effect 가 보고 호출하고, realtime(mua.mail.changed)은 조용히 갱신한다.
 */
import type { MailListFolder } from "../models/types";
interface MailLayoutProps {
    /**
     * 모바일 서브페이지(mfd 풀스크린 슬라이드) 안에 폴더 고정으로 마운트될 때의 설정.
     * 다이얼로그 본문에는 라우트 파라미터가 없으므로 폴더·계정을 props 로 받는다(MailSubPages).
     * 없으면 라우트(`mail` / `mail/account/:accountSeq` / `mail/:folder`)가 폴더를 정한다.
     */
    embedded?: {
        folder: MailListFolder;
        accountSeq?: number;
        folderSeq?: number;
        /**
         * 페이지 모드 — 폴더는 고정하되 서브페이지 다이얼로그 안이 아니라 라우트 페이지(모바일 하단 탭)로 그린다.
         * 다이얼로그 제목 브리지(건수/제목)를 쓰지 않고, 카드 목록 래퍼도 페이지 여백을 갖는다(inDialog=false).
         */
        inline?: boolean;
    };
}
/**
 * 메일 레이아웃 컴포넌트 — 폴더는 라우트(또는 embedded props)가 정한다(사이드바 메뉴와 1:1).
 *   `mail` = 받은편지함(전체 계정) · `mail/account/:accountSeq` = 계정별 받은편지함 · `mail/:folder` = 그 외 폴더(계정 선택 유지)
 * 데스크탑 = ListLayout 표 + 오른쪽 상세 패널, 모바일 = 카드 목록(MobileCardListLayout) + 상세/작성/계정 mfd 슬라이드.
 */
export default function MailLayout({ embedded }?: MailLayoutProps): import("react").JSX.Element;
export {};
