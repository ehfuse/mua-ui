/** 검색어 하이라이트 — 텍스트 안의 검색어(대소문자 무시)를 노란 배경으로 표시한다. */

import type { ReactNode } from "react";

interface HighlightTextProps {
    text: string; // 원문
    query: string; // 검색어(빈 값이면 원문 그대로)
}

/** 검색어를 <mark> 로 감싼 조각들 */
export function HighlightText({ text, query }: HighlightTextProps): ReactNode {
    const q = query.trim();
    if (!q || !text) return text;
    const lower = text.toLowerCase();
    const needle = q.toLowerCase();
    const parts: ReactNode[] = [];
    let cursor = 0;
    let index = lower.indexOf(needle);
    let key = 0;
    while (index >= 0) {
        if (index > cursor) parts.push(text.slice(cursor, index));
        parts.push(
            <mark key={key++} style={{ backgroundColor: "#fef08a", color: "inherit", padding: 0, borderRadius: 2 }}>
                {text.slice(index, index + needle.length)}
            </mark>
        );
        cursor = index + needle.length;
        index = lower.indexOf(needle, cursor);
    }
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
}
