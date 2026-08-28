import { useMediaQuery, useTheme } from "@mui/material";

/** 모바일 여부 — MUI breakpoint lg(1024px) 미만(코드샵 대시보드와 동일 기준). */
export function useIsMobile(): boolean {
    const theme = useTheme();
    return !useMediaQuery(theme.breakpoints.up("lg"));
}
