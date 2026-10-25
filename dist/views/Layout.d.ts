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
export default function MailLayout({ embedded }?: MailLayoutProps): import("react").JSX.Element;
export {};
