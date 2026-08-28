/** 패키지 공통 툴팁 — 화살표 · 위쪽 배치 · 인터랙션 없음 · 애니메이션 없음(즉시 표시/숨김). */

import { Tooltip as MuiTooltip, type TooltipProps } from "@mui/material";

/** 공통 툴팁 */
export function Tooltip({ children, ...props }: TooltipProps) {
    return (
        <MuiTooltip
            arrow
            placement="top"
            disableInteractive
            enterDelay={0}
            slotProps={{ transition: { timeout: 0 } }}
            {...props}
        >
            {children}
        </MuiTooltip>
    );
}
