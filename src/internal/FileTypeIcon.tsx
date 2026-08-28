/** 첨부 파일 종류 아이콘 — @ehfuse/file-viewer 의 아이콘(뷰어 파일 목록과 같은 매핑)을 그대로 쓴다. */

import { FileTypeIcon as ViewerFileTypeIcon } from "@ehfuse/file-viewer/icons";

interface FileTypeIconProps {
    name: string; // 파일명
    mime?: string; // MIME
    size?: number; // 한 변 px(기본 22)
}

/** 파일 종류 아이콘 */
export function FileTypeIcon({ name, mime = "", size = 22 }: FileTypeIconProps) {
    return <ViewerFileTypeIcon fileName={name} mime={mime} size={size} />;
}
