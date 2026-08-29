/** 사용자 메일함 아이콘 — taskbox 아이콘 키/색으로 그린다(키가 없거나 모르면 기본 폴더). 개인/공용 구분은 칩이 맡고 아이콘은 통일. */

import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import { getProjectIconComponent } from "@ehfuse/taskbox";
import type { SxProps, Theme } from "@mui/material";

interface FolderIconProps {
    icon?: string; // 아이콘 키
    color?: string; // 색(hex)
    shared?: boolean; // 공용(호환용 — 아이콘엔 영향 없음)
    fontSize?: number; // px
    sx?: SxProps<Theme>;
}

/** 메일함 아이콘 */
export function FolderIcon({ icon, color, fontSize, sx }: FolderIconProps) {
    const Custom = icon ? getProjectIconComponent(icon) : null;
    const style = { ...(fontSize ? { fontSize } : {}), ...(color ? { color } : {}) };
    if (Custom) return <Custom sx={[style, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] as SxProps<Theme>} />;
    return <FolderOutlinedIcon sx={[style, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] as SxProps<Theme>} />;
}
