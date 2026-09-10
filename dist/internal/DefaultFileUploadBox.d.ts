/** 기본 첨부 선택 박스 — 드래그앤드롭/클릭 선택 + 선택 파일 칩(앱의 FileUploadBox 가 없을 때 쓴다). */
import type { MuaFileUploadBoxProps } from "../types/config";
/** 기본 드롭존 */
export declare function DefaultFileUploadBox({ multiple, height, acceptedFileTypes, maxFileSize, dropzoneText, onAttachedFilesChange, }: MuaFileUploadBoxProps): import("react").JSX.Element;
