/**
 * 메일 주소 도메인 → 서비스(브랜드) 식별 — 사이드바/계정 목록의 아이콘 표시에 쓴다.
 */

/** 서비스 키 */
export type MailProviderKey = "gmail" | "naver" | "daum" | "kakao" | "outlook" | "nate";

/** 서비스 정보 */
export interface MailProviderInfo {
    key: MailProviderKey; // 서비스 키
    label: string; // 표시명
    color: string; // 브랜드 배경색(글자 배지용)
    text_color: string; // 배지 글자색
    letter: string; // 배지 글자(로고 SVG 가 없는 서비스)
}

const PROVIDERS: Record<MailProviderKey, MailProviderInfo> = {
    gmail: { key: "gmail", label: "Gmail", color: "#fff", text_color: "#EA4335", letter: "M" },
    naver: { key: "naver", label: "네이버", color: "#03C75A", text_color: "#fff", letter: "N" },
    daum: { key: "daum", label: "다음", color: "#3B6CFF", text_color: "#fff", letter: "D" },
    kakao: { key: "kakao", label: "카카오", color: "#FEE500", text_color: "#191919", letter: "K" },
    outlook: { key: "outlook", label: "Outlook", color: "#0078D4", text_color: "#fff", letter: "O" },
    nate: { key: "nate", label: "네이트", color: "#E4002B", text_color: "#fff", letter: "n" },
};

const DOMAIN_TO_PROVIDER: Record<string, MailProviderKey> = {
    "gmail.com": "gmail",
    "googlemail.com": "gmail",
    "naver.com": "naver",
    "daum.net": "daum",
    "hanmail.net": "daum",
    "kakao.com": "kakao",
    "outlook.com": "outlook",
    "outlook.kr": "outlook",
    "hotmail.com": "outlook",
    "hotmail.co.kr": "outlook",
    "live.com": "outlook",
    "nate.com": "nate",
};

/** 메일 주소로 서비스를 찾는다(모르는 도메인이면 null). */
export function findMailProvider(email: string): MailProviderInfo | null {
    const domain = String(email ?? "")
        .trim()
        .toLowerCase()
        .split("@")[1];
    const key = domain ? DOMAIN_TO_PROVIDER[domain] : undefined;
    return key ? PROVIDERS[key] : null;
}
