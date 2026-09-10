/**
 * 메일 주소 도메인 → 서비스(브랜드) 식별 — 사이드바/계정 목록의 아이콘 표시에 쓴다.
 */
/** 서비스 키 */
export type MailProviderKey = "gmail" | "naver" | "daum" | "kakao" | "outlook" | "nate";
/** 서비스 정보 */
export interface MailProviderInfo {
    key: MailProviderKey;
    label: string;
    color: string;
    text_color: string;
    letter: string;
}
/** 메일 주소로 서비스를 찾는다(모르는 도메인이면 null). */
export declare function findMailProvider(email: string): MailProviderInfo | null;
