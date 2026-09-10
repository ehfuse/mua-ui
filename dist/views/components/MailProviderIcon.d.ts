/**
 * 메일 계정 아이콘 — 주소 도메인으로 서비스를 알면 브랜드 로고(Gmail) 또는 브랜드색 글자 배지,
 * 모르면 공용은 사람들 아이콘, 개인은 @ 아이콘.
 */
import type { MailAccountScope } from "../../models/types";
interface MailProviderIconProps {
    email: string;
    scope?: MailAccountScope;
    size?: number;
    color?: string;
}
/** 메일 계정 아이콘 */
export declare function MailProviderIcon({ email, scope, size, color }: MailProviderIconProps): import("react").JSX.Element;
export {};
