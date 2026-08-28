/**
 * 메일 액션 아이콘(답장/전달) — stroke 기반이라 currentColor 를 상속받는다.
 */

import { SvgIcon, type SvgIconProps } from "@mui/material";

/** 답장(왼쪽으로 꺾인 화살표) */
export function ReplyArrowIcon({ sx, ...props }: SvgIconProps) {
    return (
        <SvgIcon viewBox="0 0 24 24" {...props} sx={{ fill: "none", ...sx }}>
            <path
                d="M20 17V15.8C20 14.1198 20 13.2798 19.673 12.638C19.3854 12.0735 18.9265 11.6146 18.362 11.327C17.7202 11 16.8802 11 15.2 11H4M4 11L8 7M4 11L8 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </SvgIcon>
    );
}

/** 전달(오른쪽으로 꺾인 화살표) */
export function ForwardArrowIcon({ sx, ...props }: SvgIconProps) {
    return (
        <SvgIcon viewBox="0 0 24 24" {...props} sx={{ fill: "none", ...sx }}>
            <path
                d="M4 17V15.8C4 14.1198 4 13.2798 4.32698 12.638C4.6146 12.0735 5.07354 11.6146 5.63803 11.327C6.27976 11 7.11984 11 8.8 11H20M20 11L16 7M20 11L16 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </SvgIcon>
    );
}

/** 전체 답장(왼쪽 이중 화살표) */
export function ReplyAllArrowIcon({ sx, ...props }: SvgIconProps) {
    return (
        <SvgIcon viewBox="0 0 24 24" {...props} sx={{ fill: "none", ...sx }}>
            <polyline
                points="7 17 2 12 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <polyline
                points="12 17 7 12 12 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M22 18v-2a4 4 0 00-4-4H7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </SvgIcon>
    );
}
