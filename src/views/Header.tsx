/**
 * 메일 목록 헤더 설정(useHeaderConfig) — 검색(300ms 디바운스) + 검색칸 오른쪽 "안 읽음" 스위치(filter custom — 계정은 사이드바 계정별 받은편지함이 고른다) + 좌/우 슬롯.
 */

import { useCallback, useEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { FormControlLabel, Stack, Switch } from "@mui/material";
import type { ListLayoutProps } from "@ehfuse/mui-dashboard-layout";
import { useMuaConfig } from "../MuaProvider";
import type { MailController } from "../controllers/mailController";
import type { MailFilters } from "../models/types";

interface HeaderConfigProps {
    controller: MailController; // 컨트롤러
    left?: ReactElement; // 왼쪽 툴바
    right?: ReactElement; // 오른쪽 액션(동기화·설정) — 데스크탑은 "안 읽음" 스위치가 그 왼쪽에 붙는다
    toolbar?: ReactNode; // 검색칸 오른쪽(필터 영역)에 놓을 툴바(삭제/스팸/답장/전달/읽음 표시 버튼)
    isMobile?: boolean; // 모바일(검색 오버레이) 여부 — 검색칸이 전체 폭을 쓴다
}

/** 메일 헤더 설정을 반환한다. */
/** 모바일에서 "안 읽음" 스위치(스위치 58 + 글자 + 여백)가 차지하는 폭 — 검색칸이 이만큼 좁아져 한 줄에 선다. */
const MOBILE_UNREAD_SWITCH_WIDTH = 124;

export function useHeaderConfig({
    controller,
    left,
    right,
    toolbar,
    isMobile = false,
}: HeaderConfigProps): NonNullable<ListLayoutProps["header"]> {
    // 모바일 검색칸 폭(앱 주입값). 기본은 "안 읽음" 스위치가 **같은 줄 오른쪽**에 서도록 그만큼 뺀 폭이다(0.3.122) —
    // 전체 폭(100%)이면 스위치가 다음 줄로 밀려 검색 상자가 두 줄을 차지했다.
    const mobileSearchWidth = useMuaConfig().mobile?.searchWidth ?? `calc(100% - ${MOBILE_UNREAD_SWITCH_WIDTH}px)`;
    const { state } = controller;
    const loadingList = state.useValue("loadingList") as boolean;
    const filters = state.useValue("filters") as MailFilters;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleSearchChange = useCallback(
        (keyword: string) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => state.actions.setFilters({ search: keyword.trim() }), 300);
        },
        [state.actions]
    );

    const handleSearch = useCallback(
        (keyword: string) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            state.actions.setFilters({ search: keyword.trim() });
        },
        [state.actions]
    );

    /** "안 읽음" 스위치(폴더·계정은 사이드바 메뉴가 고른다). */
    const unreadSwitch = (
        <FormControlLabel
            control={
                <Switch
                    checked={filters.unreadOnly}
                    onChange={(_, checked) => state.actions.setFilters({ unreadOnly: checked, starredOnly: false })}
                />
            }
            // 이름은 "안 읽음"(0.3.122) — "안 읽은 메일만" 은 길어 검색칸과 한 줄에 서지 못했다.
            label="안 읽음"
            sx={{
                ml: 0.5,
                mr: 0,
                flexShrink: 0,
                "& .MuiFormControlLabel-label": { fontSize: "14px", color: "#111", whiteSpace: "nowrap" },
            }}
        />
    );
    // 데스크탑: 검색칸 오른쪽(필터 영역)에 툴바, 오른쪽 슬롯에 [안 읽은 메일만 스위치][동기화·설정].
    // 모바일: 헤더가 검색 오버레이라 스위치만 필터 영역에 둔다(툴바는 목록 위).
    const filterNodes = isMobile
        ? [{ name: "mail-unread-only", node: unreadSwitch }]
        : toolbar
          ? [{ name: "mail-toolbar", node: toolbar }]
          : [];
    const rightSlot = isMobile ? (
        right
    ) : (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            {unreadSwitch}
            {right}
        </Stack>
    );

    return {
        left,
        right: rightSlot,
        showSearch: true,
        // 모바일은 짧게(0.3.123) — "안 읽음" 스위치와 한 줄을 나눠 쓰면서 칸이 좁아져 긴 안내 글이 "제목, 보낸 사ㅌ" 처럼 잘렸다. 폭 360 폰에서는 글이 설 자리가 75px 뿐이라 "제목·보낸 사람" 도 넘친다(실측).
        searchPlaceholder: isMobile ? "메일 검색" : "제목, 보낸 사람 검색",
        searchWidth: isMobile ? mobileSearchWidth : undefined,
        // 모바일은 medium(56px) — 게시판·내 문서의 제목줄 검색칸과 같은 높이라야 탭을 오가도 같은 판으로 읽힌다(mdl 3.3.68).
        searchSize: isMobile ? "medium" : undefined,
        onSearchChange: handleSearchChange,
        onSearch: handleSearch,
        searchMinLength: 1,
        searchLoading: loadingList,
        showCollapseButton: false,
        defaultCollapsed: true,
        // 필터 초기화 아이콘은 스위치 하나뿐이라 두지 않는다.
        showClearIcon: false,
        filter: {
            showChips: false,
            groups: [
                {
                    // 검색칸과 같은 줄(row 0)에 붙는 custom 노드들.
                    filters: filterNodes.map((f) => ({ type: "custom" as const, name: f.name, node: f.node })),
                },
            ],
        },
    };
}
