/** 사용자 메일함 아이콘 — taskbox 아이콘 키/색으로 그린다(키가 없거나 모르면 기본 폴더). 개인/공용 구분은 칩이 맡고 아이콘은 통일. */
import type { SxProps, Theme } from "@mui/material";
interface FolderIconProps {
    icon?: string;
    color?: string;
    shared?: boolean;
    fontSize?: number;
    sx?: SxProps<Theme>;
}
/** 메일함 아이콘 */
export declare function FolderIcon({ icon, color, fontSize, sx }: FolderIconProps): import("react").JSX.Element;
export {};
