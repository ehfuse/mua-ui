/** 첨부 파일 종류 아이콘 — @ehfuse/file-viewer 의 아이콘(뷰어 파일 목록과 같은 매핑)을 그대로 쓴다. */
interface FileTypeIconProps {
    name: string;
    mime?: string;
    size?: number;
    className?: string;
}
/** 파일 종류 아이콘 */
export declare function FileTypeIcon({ name, mime, size, className }: FileTypeIconProps): import("react").JSX.Element;
export {};
