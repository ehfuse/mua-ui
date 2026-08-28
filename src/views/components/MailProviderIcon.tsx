/**
 * 메일 계정 아이콘 — 주소 도메인으로 서비스를 알면 브랜드 로고(Gmail) 또는 브랜드색 글자 배지,
 * 모르면 공용은 사람들 아이콘, 개인은 @ 아이콘.
 */

import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { Box } from "@mui/material";
import type { MailAccountScope } from "../../models/types";
import { findMailProvider } from "../../utils/providers";

interface MailProviderIconProps {
    email: string; // 계정 메일 주소
    scope?: MailAccountScope; // 계정 범위(도메인을 모를 때 아이콘 구분용)
    size?: number; // px (기본 24)
    color?: string; // 기본 아이콘(@/사람들) 색
}

/** Gmail 로고(M 마크) */
function GmailMark({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="4 3.5 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Gmail"
        >
            <path
                d="M22.0515 8.52295L16.0644 13.1954L9.94043 8.52295V8.52421L9.94783 8.53053V15.0732L15.9954 19.8466L22.0515 15.2575V8.52295Z"
                fill="#EA4335"
            />
            <path
                d="M23.6231 7.38639L22.0508 8.52292V15.2575L26.9983 11.459V9.17074C26.9983 9.17074 26.3978 5.90258 23.6231 7.38639Z"
                fill="#FBBC05"
            />
            <path
                d="M22.0508 15.2575V23.9924H25.8428C25.8428 23.9924 26.9219 23.8813 26.9995 22.6513V11.459L22.0508 15.2575Z"
                fill="#34A853"
            />
            <path d="M9.94811 24.0001V15.0732L9.94043 15.0669L9.94811 24.0001Z" fill="#C5221F" />
            <path
                d="M9.94014 8.52404L8.37646 7.39382C5.60179 5.91001 5 9.17692 5 9.17692V11.4651L9.94014 15.0667V8.52404Z"
                fill="#C5221F"
            />
            <path d="M9.94043 8.52441V15.0671L9.94811 15.0734V8.53073L9.94043 8.52441Z" fill="#C5221F" />
            <path
                d="M5 11.4668V22.6591C5.07646 23.8904 6.15673 24.0003 6.15673 24.0003H9.94877L9.94014 15.0671L5 11.4668Z"
                fill="#4285F4"
            />
        </svg>
    );
}

/** 메일 계정 아이콘 */
export function MailProviderIcon({ email, scope, size = 24, color = "#475569" }: MailProviderIconProps) {
    const provider = findMailProvider(email);
    if (provider?.key === "gmail") {
        // viewBox 를 마크 경계로 잘라 다른 아이콘과 같은 시각 크기로 그린다.
        return <GmailMark size={size} />;
    }
    if (provider) {
        // 브랜드색 둥근 배지 + 이니셜
        const badge = Math.round(size * 0.85);
        return (
            <Box
                component="span"
                title={provider.label}
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: badge,
                    height: badge,
                    borderRadius: `${Math.round(badge * 0.25)}px`,
                    bgcolor: provider.color,
                    color: provider.text_color,
                    fontSize: Math.round(badge * 0.62),
                    fontWeight: 800,
                    lineHeight: 1,
                    fontFamily: "Arial, Helvetica, sans-serif",
                    flexShrink: 0,
                }}
            >
                {provider.letter}
            </Box>
        );
    }
    return scope === "shared" ? (
        <GroupsOutlinedIcon sx={{ fontSize: size, color }} />
    ) : (
        <AlternateEmailIcon sx={{ fontSize: size, color }} />
    );
}
