/**
 * 메일 목록 모바일 머리(0.3.131) — 접히는 검색칸과 갈래 탭(전체 · 안 읽음 · 별표).
 *
 * 검색칸은 접혀 있다가 **앱 제목 옆 돋보기**를 누르면 제목 줄 바로 아래로 펼쳐진다(겹쳐 뜨는 창이 아니라 목록을 밀어 내린다).
 * 돋보기는 앱(상단 바)이 그리고, 여닫힘은 앱과 같이 쓰는 전역 상태(mobileSearchOverlay.open)로 받는다.
 * 탭은 상자·바깥 여백 없이 화면 폭을 다 쓰는 흰 띠다 — 제목 줄에 바로 붙어 그 화면의 갈래로 읽힌다.
 * 접으면 검색어도 함께 지운다 — 칸이 안 보이는데 검색이 걸려 있으면 메일이 사라진 것처럼 보인다.
 *
 * 앱이 모바일 목록 래퍼(MuaConfig.mobile.CardListLayout)를 주입하지 않았을 때만 쓴다 — 주입한 앱(코드샵)은 앱바의 검색 오버레이를 그대로 쓴다.
 */

import { useEffect, useRef, useState } from "react";
import { Box, Collapse, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { mfs } from "../../internal/mobileFontScale";

/** 갈래 — 전체 · 안 읽음 · 별표. */
export type MailMobileScope = "all" | "unread" | "starred";

interface MailMobileTopProps {
    scope: MailMobileScope; // 지금 갈래
    onScopeChange: (scope: MailMobileScope) => void; // 갈래 바꾸기
    unreadCount: number; // 안 읽은 수(받은편지함일 때만 — 그 밖은 0)
    searchOpen: boolean; // 검색칸 펼침(앱 제목 옆 돋보기가 여닫는다)
    search: string; // 지금 걸려 있는 검색어
    onSearch: (keyword: string) => void; // 검색어 바꾸기(빈 값 = 검색 풀기)
    /** 화면 본문의 좌우·위 여백(px) — 그만큼 밖으로 빼 화면 끝과 제목 줄에 붙인다. */
    bleed?: number;
}

/** 검색어를 치다 멈춘 뒤 이만큼 지나면 찾는다. */
const SEARCH_DEBOUNCE_MS = 300;

const TABS: { key: MailMobileScope; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "unread", label: "안 읽음" },
    { key: "starred", label: "별표" },
];

export function MailMobileTop({ scope, onScopeChange, unreadCount, searchOpen, search, onSearch, bleed = 16 }: MailMobileTopProps) {
    const [draft, setDraft] = useState(search);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);
    // 접히면 검색을 푼다(펼친 적이 있을 때만 — 처음 그릴 때의 "닫힘" 은 지나친다).
    const wasOpenRef = useRef(searchOpen);
    useEffect(() => {
        if (wasOpenRef.current && !searchOpen) {
            if (timerRef.current) clearTimeout(timerRef.current);
            setDraft("");
            if (search) onSearch("");
        }
        wasOpenRef.current = searchOpen;
        // search·onSearch 는 접히는 순간의 값만 쓰면 된다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchOpen]);

    const change = (value: string) => {
        setDraft(value);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onSearch(value.trim()), SEARCH_DEBOUNCE_MS);
    };

    return (
        <Box sx={{ mx: `-${bleed}px`, mt: `-${bleed}px`, bgcolor: "#fff", borderBottom: "1px solid #e2e8f0" }}>
            <Collapse in={searchOpen} timeout={180} onEntered={() => inputRef.current?.focus()} unmountOnExit>
                <Box sx={{ px: `${bleed}px`, pt: 1.5, pb: 0.5 }}>
                    <TextField
                        inputRef={inputRef}
                        size="medium"
                        fullWidth
                        placeholder="제목, 보낸 사람 검색"
                        value={draft}
                        onChange={(event) => change(event.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 18, color: "#9aa2af" }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        // 다른 목록의 제목 카드 검색칸과 같은 높이(안쪽 위아래 13px).
                        sx={{ "& .MuiOutlinedInput-input": { paddingTop: "13px", paddingBottom: "13px" } }}
                    />
                </Box>
            </Collapse>
            {/* 갈래 탭 — 세 칸이 폭을 똑같이 나눈다. 고른 탭만 파란 굵은 글자 + 아래 굵은 줄. */}
            <Box role="tablist" aria-label="메일 보기" sx={{ display: "flex" }}>
                {TABS.map((tab) => {
                    const selected = scope === tab.key;
                    return (
                        <Box
                            component="button"
                            type="button"
                            role="tab"
                            key={tab.key}
                            aria-selected={selected}
                            onClick={() => onScopeChange(tab.key)}
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                height: 48,
                                cursor: "pointer",
                                border: "none",
                                // 안 고른 탭도 같은 두께(투명)를 두어 글자가 위아래로 움직이지 않는다.
                                borderBottom: "2px solid",
                                borderBottomColor: selected ? "primary.main" : "transparent",
                                mb: "-1px",
                                bgcolor: "transparent",
                                font: "inherit",
                                fontSize: mfs(15),
                                fontWeight: selected ? 700 : 500,
                                color: selected ? "primary.main" : "#64748b",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {tab.key === "unread" && unreadCount > 0 ? `${tab.label} ${unreadCount}` : tab.label}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
