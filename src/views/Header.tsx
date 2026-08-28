/**
 * 메일 목록 헤더 설정(useHeaderConfig) — 검색(300ms 디바운스) + 검색칸 오른쪽 "안 읽은 메일만" 스위치(filter custom — 계정은 사이드바 계정별 받은편지함이 고른다) + 좌/우 슬롯.
 */

import { useCallback, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { FormControlLabel, Switch } from "@mui/material";
import type { ListLayoutProps } from "@ehfuse/mui-dashboard-layout";
import { useMuaConfig } from "../MuaProvider";
import type { MailController } from "../controllers/mailController";
import type { MailFilters } from "../models/types";

interface HeaderConfigProps {
    controller: MailController; // 컨트롤러
    left?: ReactElement; // 왼쪽 툴바
    right?: ReactElement; // 오른쪽 필터
    isMobile?: boolean; // 모바일(검색 오버레이) 여부 — 검색칸이 전체 폭을 쓴다
}

/** 메일 헤더 설정을 반환한다. */
export function useHeaderConfig({
    controller,
    left,
    right,
    isMobile = false,
}: HeaderConfigProps): NonNullable<ListLayoutProps["header"]> {
    // 모바일 검색칸 폭(앱 주입값, 기본 전체 폭)
    const mobileSearchWidth = useMuaConfig().mobile?.searchWidth ?? "100%";
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

    return {
        left,
        right,
        showSearch: true,
        searchPlaceholder: "제목, 보낸 사람 검색",
        searchWidth: isMobile ? mobileSearchWidth : undefined,
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
                    // 검색칸과 같은 줄(row 0)에 붙는 "안 읽은 메일만" 스위치(폴더·계정은 사이드바 메뉴가 고른다).
                    filters: [
                        {
                            type: "custom" as const,
                            name: "mail-unread-only",
                            node: (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size="small"
                                            checked={filters.unreadOnly}
                                            onChange={(_, checked) =>
                                                state.actions.setFilters({ unreadOnly: checked, starredOnly: false })
                                            }
                                        />
                                    }
                                    label="안 읽은 메일만"
                                    sx={{
                                        ml: 0.5,
                                        mr: 0,
                                        "& .MuiFormControlLabel-label": { fontSize: "13.5px", color: "#111" },
                                    }}
                                />
                            ),
                        },
                    ],
                },
            ],
        },
    };
}
