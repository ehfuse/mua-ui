/**
 * 주소록 페이지 — 사용자별 연락처 목록(검색·즐겨찾기) + 등록/수정 다이얼로그 + [메일 보내기](작성 다이얼로그).
 * 데스크탑 = ListLayout 표, 모바일 = 카드 목록(서브페이지 본문으로도 마운트된다: embedded).
 */
interface ContactsPageProps {
    embedded?: boolean;
}
/** 주소록 페이지 컴포넌트 */
export default function ContactsPage({ embedded }: ContactsPageProps): import("react").JSX.Element;
export {};
