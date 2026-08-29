/** 사용자 메일함 아이콘 — taskbox 아이콘 키/색으로 그린다(키가 없거나 모르면 기본 폴더). */

import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import FolderSharedOutlinedIcon from "@mui/icons-material/FolderSharedOutlined";
import { getProjectIconComponent } from "@ehfuse/taskbox";
import type { SxProps, Theme } from "@mui/material";

interface FolderIconProps {
    icon?: string; // 아이콘 키
    color?: string; // 색(hex)
    shared?: boolean; // 공용(키가 없을 때 공유 폴더 아이콘)
    fontSize?: number; // px
    sx?: SxProps<Theme>;
}

/** 메일함 아이콘 */
export function FolderIcon({ icon, color, shared = false, fontSize, sx }: FolderIconProps) {
    const Custom = icon ? getProjectIconComponent(icon) : null;
    const style = { ...(fontSize ? { fontSize } : {}), ...(color ? { color } : {}) };
    if (Custom) return <Custom sx={[style, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] as SxProps<Theme>} />;
    const Fallback = shared ? FolderSharedOutlinedIcon : FolderOutlinedIcon;
    return <Fallback sx={[style, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] as SxProps<Theme>} />;
}
