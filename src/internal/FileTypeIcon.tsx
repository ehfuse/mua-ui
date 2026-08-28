/** 첨부 파일 종류 아이콘 — @ehfuse/file-viewer 의 아이콘(뷰어 파일 목록과 같은 매핑)을 그대로 쓴다. */

import { Box } from "@mui/material";
import { FileTypeIcon as ViewerFileTypeIcon } from "@ehfuse/file-viewer/icons";

interface FileTypeIconProps {
    name: string; // 파일명
    mime?: string; // MIME
    size?: number; // 한 변 px(기본 22)
    className?: string; // MUI Chip 이 icon 에 주입하는 MuiChip-icon(여백 규칙) — 받아서 래퍼에 단다
}

/** 파일 종류 아이콘 */
export function FileTypeIcon({ name, mime = "", size = 22, className }: FileTypeIconProps) {
    return (
        <Box
            component="span"
            className={className}
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: size,
                height: size,
                flexShrink: 0,
            }}
        >
            <ViewerFileTypeIcon fileName={name} mime={mime} size={size} />
        </Box>
    );
}
