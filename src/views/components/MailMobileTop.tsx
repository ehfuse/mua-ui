/**
 * 메일 목록 모바일 머리(0.3.130) — 갈래 탭(전체 · 안 읽음 · 별표)과, 돋보기로 여닫는 검색칸.
 *
 * 전에는 검색칸과 "안 읽음" 스위치가 늘 한 줄을 차지했다 — 검색은 가끔 쓰는데 자리를 늘 먹었고, 별표한 메일만 보는 길은 폰에 없었다.
 * 탭이 늘 보이고 검색칸은 접혀 있다가 돋보기를 누르면 그 아래로 펼쳐진다(겹쳐 뜨는 창이 아니라 목록을 밀어 내린다).
 * 접으면 검색어도 함께 지운다 — 칸이 안 보이는데 검색이 걸려 있으면 메일이 사라진 것처럼 보인다.
 *
 * 앱이 모바일 목록 래퍼(MuaConfig.mobile.CardListLayout)를 주입하지 않았을 때만 쓴다 — 주입한 앱(코드샵)은 앱바의 검색 오버레이를 그대로 쓴다.
 */

import { useEffect, useRef, useState } from "react";
import { Box, Collapse, IconButton, InputAdornment, Paper, Tab, Tabs, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { mfs } from "../../internal/mobileFontScale";

/** 갈래 — 전체 · 안 읽음 · 별표. */
export type MailMobileScope = "all" | "unread" | "starred";

interface MailMobileTopProps {
    scope: MailMobileScope; // 지금 갈래
    onScopeChange: (scope: MailMobileScope) => void; // 갈래 바꾸기
    unreadCount: number; // 안 읽은 수(받은편지함일 때만 — 그 밖은 0)
    search: string; // 지금 걸려 있는 검색어
    onSearch: (keyword: string) => void; // 검색어 바꾸기(빈 값 = 검색 풀기)
}

/** 검색어를 치다 멈춘 뒤 이만큼 지나면 찾는다. */
const SEARCH_DEBOUNCE_MS = 300;

export function MailMobileTop({ scope, onScopeChange, unreadCount, search, onSearch }: MailMobileTopProps) {
    // 검색이 걸린 채로 들어왔으면 칸을 펼쳐 둔다 — 접혀 있으면 왜 메일이 적은지 알 수 없다.
    const [open, setOpen] = useState(Boolean(search));
    const [draft, setDraft] = useState(search);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    const change = (value: string) => {
        setDraft(value);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onSearch(value.trim()), SEARCH_DEBOUNCE_MS);
    };
    const toggle = () => {
        if (open) {
            // 접으면서 검색도 푼다.
            if (timerRef.current) clearTimeout(timerRef.current);
            setDraft("");
            if (search) onSearch("");
            setOpen(false);
            return;
        }
        setOpen(true);
    };

    return (
        <Paper elevation={1} sx={{ overflow: "hidden" }}>
            <Box sx={{ display: "flex", alignItems: "stretch", borderBottom: open ? "1px solid #e2e8f0" : "none" }}>
                <Tabs
                    value={scope}
                    onChange={(_event, next: MailMobileScope) => onScopeChange(next)}
                    variant="fullWidth"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: 48,
                        "& .MuiTab-root": {
                            minHeight: 48,
                            minWidth: 0,
                            px: 1,
                            fontSize: mfs(15),
                            fontWeight: 500,
                            color: "#64748b",
                            whiteSpace: "nowrap",
                            textTransform: "none",
                        },
                        "& .MuiTab-root.Mui-selected": { color: "primary.main", fontWeight: 700 },
                    }}
                >
                    <Tab value="all" label="전체" disableRipple />
                    <Tab value="unread" label={unreadCount > 0 ? `안 읽음 ${unreadCount}` : "안 읽음"} disableRipple />
                    <Tab value="starred" label="별표" disableRipple />
                </Tabs>
                {/* 돋보기 — 검색칸을 펼치고 접는다. 펼쳐 있을 때는 닫기(X)로 바뀐다. */}
                <IconButton aria-label={open ? "검색 닫기" : "메일 검색"} onClick={toggle} sx={{ alignSelf: "center", mx: 0.5, color: open || search ? "primary.main" : "#475569" }}>
                    {open ? <CloseIcon /> : <SearchIcon />}
                </IconButton>
            </Box>
            <Collapse in={open} timeout={180} onEntered={() => inputRef.current?.focus()} unmountOnExit>
                <Box sx={{ p: 1.5 }}>
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
        </Paper>
    );
}
