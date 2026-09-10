/** 패키지 내부 공용 아이콘(휴지통·둥근 별) — stroke 기반이라 currentColor 를 상속받는다. */
import { type SvgIconProps } from "@mui/material";
/** 휴지통(삭제) */
export declare function TrashIcon({ sx, ...props }: SvgIconProps): import("react").JSX.Element;
/** 둥근 별(중요 표시) — 채운 별은 sx={{ fill: "currentColor" }} */
export declare function StarRoundedIcon({ sx, ...props }: SvgIconProps): import("react").JSX.Element;
