/** 검색어 하이라이트 — 텍스트 안의 검색어(대소문자 무시)를 노란 배경으로 표시한다. */
import type { ReactNode } from "react";
interface HighlightTextProps {
    text: string;
    query: string;
}
/** 검색어를 <mark> 로 감싼 조각들 */
export declare function HighlightText({ text, query }: HighlightTextProps): ReactNode;
export {};
