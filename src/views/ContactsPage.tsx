/**
 * 주소록 페이지 — 사용자별 연락처 목록(검색·즐겨찾기) + 등록/수정 다이얼로그 + [메일 보내기](작성 다이얼로그).
 * 데스크탑 = ListLayout 표, 모바일 = 카드 목록(서브페이지 본문으로도 마운트된다: embedded).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Fab, IconButton, Tab, Tabs, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { VirtualDataTable, type DataColumn } from "@ehfuse/mui-virtual-data-table";
import { ListLayout, type ListLayoutProps } from "@ehfuse/mui-dashboard-layout";
import { ErrorAlert } from "@ehfuse/alerts";
import { mailApi, unwrap } from "../apis/mailApi";
import { useComposeController } from "../controllers/composeController";
import { useContactFormController } from "../controllers/contactFormController";
import { useMailSidebarAccounts } from "../hooks/useMailSidebarAccounts";
import { StarRoundedIcon } from "../internal/icons";
import { mfs } from "../internal/mobileFontScale";
import { DefaultMobileCardListLayout } from "../internal/mobileDefaults";
import { MobileCardStack, MobileChip, MobileListLoadingSpinner } from "../internal/mobileParts";
import { useMobileSearchOverlay } from "../internal/mobileSearchOverlay";
import { getMuaSubPageBridge } from "../internal/subPageBridge";
import { useIsMobile } from "../internal/useIsMobile";
import { useMuaConfig, useMuaLogined } from "../MuaProvider";
import type { MailContact } from "../models/types";
import { ComposeDialog } from "./dialogs/ComposeDialog";
import { ContactFormDialog } from "./dialogs/ContactFormDialog";

interface ContactsPageProps {
    embedded?: boolean; // 모바일 서브페이지 본문으로 마운트될 때(제목바 건수 갱신·정의폭 처리)
}

/** 즐겨찾기 별 */
function FavoriteStar({ on, size = 20 }: { on: boolean; size?: number }) {
    return (
        <StarRoundedIcon
            sx={{ fontSize: size, ...(on ? { color: "#f59e0b", fill: "currentColor" } : { color: "#94a3b8" }) }}
        />
    );
}

/** 개인/공용 사각 칩 */
function ScopeChip({ shared }: { shared: boolean }) {
    return (
        <Box
            component="span"
            sx={{
                display: "inline-block",
                px: 1,
                py: 0.3,
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                color: shared ? "#1d4ed8" : "#334155",
                bgcolor: shared ? "#eff6ff" : "#f1f5f9",
            }}
        >
            {shared ? "공용" : "개인"}
        </Box>
    );
}

/** 주소록 페이지 컴포넌트 */
export default function ContactsPage({ embedded = false }: ContactsPageProps) {
    const isMobile = useIsMobile();
    const logined = useMuaLogined();
    const mobileConfig = useMuaConfig().mobile;
    const MobileCardListLayout = mobileConfig?.CardListLayout ?? DefaultMobileCardListLayout;
    const mobileSearchWidth = mobileConfig?.searchWidth ?? "100%";

    const [contacts, setContacts] = useState<MailContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    // 목록 위 갈래 탭(2026-10-16) — 메일 목록처럼 전체 · 별표. 주소록은 한 번에 다 읽으므로 별표는 화면에서 거른다.
    const [scope, setScope] = useState<"all" | "favorite">("all");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 모바일: 서브페이지 제목바 돋보기 ↔ 검색 오버레이
    const searchOverlay = useMobileSearchOverlay();
    const searchOverlayOpen = searchOverlay.useValue("open") as boolean;
    useEffect(() => {
        if (!isMobile) return;
        searchOverlay.setValue("active", true);
        return () => {
            searchOverlay.setValue("active", false);
            searchOverlay.setValue("open", false);
        };
    }, [isMobile, searchOverlay]);

    /** 목록을 읽는다. */
    const load = useCallback(async (keyword: string, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = unwrap(await mailApi.listContacts(keyword), "주소록을 읽지 못했습니다.");
            setContacts(Array.isArray(data.items) ? data.items : []);
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "주소록을 읽지 못했습니다." });
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void load(search);
    }, [search, load]);

    // 서브페이지 제목바 건수
    useEffect(() => {
        if (!embedded) return;
        getMuaSubPageBridge()?.setCount?.(contacts.length);
        return () => getMuaSubPageBridge()?.setCount?.(null);
    }, [embedded, contacts.length]);

    const refresh = useCallback(() => void load(search, true), [load, search]);
    const contactForm = useContactFormController({ onSaved: refresh, onRemoved: refresh });

    // [메일 보내기] — 발신 계정은 기본 발신 계정(사이드바와 같은 전역 mail-state 의 계정 목록)
    const accounts = useMailSidebarAccounts(logined);
    const compose = useComposeController();
    const handleCompose = useCallback(
        (email: string) => {
            const account = accounts.find((a) => a.is_default) ?? accounts[0];
            if (!account) {
                ErrorAlert({ message: "메일을 보내려면 먼저 메일 계정을 등록하세요." });
                return;
            }
            contactForm.modal.close();
            compose.form.actions.openNew(account, email);
        },
        [accounts, compose.form.actions, contactForm.modal]
    );

    /** 즐겨찾기 토글(낙관적 반영) */
    const toggleFavorite = useCallback(async (contact: MailContact) => {
        const next = !contact.is_favorite;
        setContacts((prev) => prev.map((c) => (c.seq === contact.seq ? { ...c, is_favorite: next } : c)));
        try {
            unwrap(await mailApi.updateContact(contact.seq, { is_favorite: next }), "저장하지 못했습니다.");
        } catch (error) {
            setContacts((prev) => prev.map((c) => (c.seq === contact.seq ? { ...c, is_favorite: !next } : c)));
            ErrorAlert({ message: error instanceof Error ? error.message : "저장하지 못했습니다." });
        }
    }, []);

    const handleSearchChange = useCallback((keyword: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSearch(keyword.trim()), 300);
    }, []);
    const handleSearch = useCallback((keyword: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setSearch(keyword.trim());
    }, []);
    useEffect(
        () => () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        },
        []
    );

    const openNew = useCallback(() => contactForm.form.actions.openDialog(null), [contactForm.form.actions]);
    const openEdit = useCallback(
        (contact: MailContact) => contactForm.form.actions.openDialog(contact),
        [contactForm.form.actions]
    );

    const headerConfig: NonNullable<ListLayoutProps["header"]> = {
        left: isMobile ? undefined : (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openNew}>
                연락처 추가
            </Button>
        ),
        showSearch: true,
        searchPlaceholder: "이름, 메일 검색",
        searchWidth: isMobile ? mobileSearchWidth : undefined,
        onSearchChange: handleSearchChange,
        onSearch: handleSearch,
        searchMinLength: 1,
        searchLoading: loading,
        // 필터가 없으므로 펼치기/접기(v) 아이콘을 두지 않는다.
        showCollapseButton: false,
        defaultCollapsed: true,
    };

    /** 칸 글자 — 넘치면 말줄임(표 칸의 기본 글자 크기를 그대로 쓴다). */
    const cellText = (text: string, secondary = false) => (
        <Box
            component="span"
            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...(secondary ? { color: "text.secondary" } : {}) }}
        >
            {text}
        </Box>
    );

    // 열 모양은 고객 목록(CustomerListPage)과 같다(2026-10-16) — 번호 · 굵은 이름(15px) · 짧은 값은 가운데 · 덜 중요한 값은 회색.
    const columns = useMemo<DataColumn<MailContact>[]>(
        () => [
            {
                // 줄 번호 — 지금 보는 목록에서 몇 번째인가. 연락처의 고유 번호가 아니다.
                id: "no",
                text: "번호",
                width: 64,
                align: "center",
                render: (_row, index) => cellText(String(index + 1), true),
            },
            {
                id: "is_favorite",
                text: "",
                width: 44,
                align: "center",
                style: { textAlign: "center" },
                render: (row) => (
                    <IconButton
                        size="small"
                        aria-label={row.is_favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                        onClick={(event) => {
                            event.stopPropagation();
                            void toggleFavorite(row);
                        }}
                        sx={{ p: 0.5 }}
                    >
                        <FavoriteStar on={row.is_favorite} />
                    </IconButton>
                ),
            },
            {
                id: "name",
                text: "이름",
                width: "18%",
                style: { fontSize: 15 },
                render: (row) => (
                    <Box component="span" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.name || "-"}
                    </Box>
                ),
            },
            {
                id: "scope",
                text: "구분",
                width: 80,
                align: "center",
                style: { textAlign: "center" },
                render: (row) => <ScopeChip shared={row.scope === "shared"} />,
            },
            { id: "email", text: "메일 주소", width: "26%", render: (row) => cellText(row.email) },
            { id: "organization", text: "소속", width: "16%", render: (row) => cellText(row.organization || "") },
            { id: "phone", text: "전화번호", width: 150, align: "center", render: (row) => cellText(row.phone || "") },
            { id: "memo", text: "메모", render: (row) => cellText(row.memo || "", true) },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [toggleFavorite]
    );

    const shown = useMemo(() => (scope === "favorite" ? contacts.filter((c) => c.is_favorite) : contacts), [scope, contacts]);
    const favoriteCount = useMemo(() => contacts.filter((c) => c.is_favorite).length, [contacts]);

    const emptyMessage = search
        ? "검색 결과가 없습니다."
        : scope === "favorite"
          ? "별표한 연락처가 없습니다. 연락처 줄의 별을 누르면 여기에 모입니다."
        : "등록된 연락처가 없습니다. 연락처를 추가하거나 메일 상세의 보낸 사람 옆 주소록 아이콘을 누르세요.";

    const dialogs = (
        <>
            <ContactFormDialog controller={contactForm} onCompose={handleCompose} />
            <ComposeDialog controller={compose} accounts={accounts} />
        </>
    );

    if (isMobile) {
        return (
            <>
                <MobileCardListLayout
                    header={headerConfig}
                    searchOverlayOpen={searchOverlayOpen}
                    storageKey="mail-contacts-mobile"
                    inDialog={embedded}
                >
                    {/* 갈래 탭 — 메일 목록의 폰 탭(MailMobileTop)과 같은 모양: 칸이 폭을 똑같이 나누고 고른 칸만 파란 굵은 글자 + 밑줄. */}
                    <Box role="tablist" aria-label="주소록 보기" sx={{ display: "flex", mx: "-16px", mt: "-16px", mb: 1.5, bgcolor: "#fff", borderBottom: "1px solid #e2e8f0" }}>
                        {(["all", "favorite"] as const).map((key) => {
                            const selected = scope === key;
                            return (
                                <Box
                                    component="button"
                                    type="button"
                                    role="tab"
                                    key={key}
                                    aria-selected={selected}
                                    onClick={() => setScope(key)}
                                    sx={{
                                        flex: 1,
                                        minWidth: 0,
                                        height: 48,
                                        cursor: "pointer",
                                        border: "none",
                                        borderBottom: "2px solid",
                                        borderBottomColor: selected ? "primary.main" : "transparent",
                                        mb: "-1px",
                                        bgcolor: "transparent",
                                        font: "inherit",
                                        fontSize: mfs(15),
                                        fontWeight: selected ? 700 : 500,
                                        color: selected ? "primary.main" : "#64748b",
                                    }}
                                >
                                    {key === "all" ? "전체" : favoriteCount > 0 ? `별표 ${favoriteCount}` : "별표"}
                                </Box>
                            );
                        })}
                    </Box>
                    {loading && contacts.length === 0 ? <MobileListLoadingSpinner /> : null}
                    {!loading && shown.length === 0 ? (
                        <Typography sx={{ fontSize: mfs(15), color: "#475569", textAlign: "center", py: 4 }}>
                            {emptyMessage}
                        </Typography>
                    ) : (
                        <MobileCardStack>
                            {shown.map((contact) => (
                                <Box
                                    key={contact.seq}
                                    onClick={() => openEdit(contact)}
                                    sx={{
                                        p: 1.5,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.25,
                                        cursor: "pointer",
                                        minWidth: 0,
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void toggleFavorite(contact);
                                        }}
                                        sx={{ p: 0.5, flexShrink: 0 }}
                                    >
                                        <FavoriteStar on={contact.is_favorite} size={22} />
                                    </IconButton>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                            <Typography
                                                noWrap
                                                sx={{
                                                    fontSize: mfs(16),
                                                    fontWeight: 700,
                                                    color: "#111",
                                                    width: 0,
                                                    flex: 1,
                                                }}
                                            >
                                                {contact.name || contact.email}
                                            </Typography>
                                            {contact.scope === "shared" ? (
                                                <MobileChip tone="blue">공용</MobileChip>
                                            ) : null}
                                            {contact.organization ? (
                                                <MobileChip>{contact.organization}</MobileChip>
                                            ) : null}
                                        </Box>
                                        <Typography noWrap sx={{ fontSize: mfs(15), color: "#334155" }}>
                                            {contact.email}
                                        </Typography>
                                        {contact.phone ? (
                                            <Typography noWrap sx={{ fontSize: mfs(15), color: "#475569" }}>
                                                {contact.phone}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                </Box>
                            ))}
                        </MobileCardStack>
                    )}
                </MobileCardListLayout>
                <Fab
                    color="primary"
                    aria-label="연락처 추가"
                    onClick={openNew}
                    sx={{
                        position: "fixed",
                        right: 24,
                        bottom: "calc(24px + var(--mobile-bottom-nav, 0px))",
                        zIndex: 40,
                    }}
                >
                    <EditOutlinedIcon />
                </Fab>
                {dialogs}
            </>
        );
    }

    const tableProps = {
        // 노션풍 — 고객·거래처·업무함 목록표와 같은 모양(2026-10-16).
        variant: "notion" as const,
        columns,
        data: shown,
        totalCount: shown.length,
        getRowId: (row: MailContact) => row.seq,
        rowHeight: 48,
        loading,
        onRowClick: (row: MailContact) => openEdit(row),
        emptyMessage,
    };

    return (
        <Box sx={{ userSelect: "none", height: "100%", minHeight: 0 }}>
            <ListLayout
                storageKey="mail-contacts-layout"
                header={headerConfig}
                // 표 위 갈래 탭(전체 · 별표) — 메일 목록의 탭과 같은 모양. ListLayout 에 표 위 자리가 없어 표를 직접 그려 넘긴다.
                leftPanel={
                    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                        <Tabs
                            value={scope}
                            onChange={(_event, value: "all" | "favorite") => setScope(value)}
                            sx={{ minHeight: 44, borderBottom: "1px solid #e2e8f0", flexShrink: 0, "& .MuiTab-root": { minHeight: 44, fontSize: 14.5, px: 2.5 } }}
                        >
                            <Tab value="all" label="전체" />
                            <Tab
                                value="favorite"
                                aria-label="별표"
                                sx={{ minWidth: 56 }}
                                label={<StarRoundedIcon sx={{ fontSize: 22, color: "#f59e0b", fill: "currentColor" }} />}
                            />
                        </Tabs>
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <VirtualDataTable {...tableProps} />
                        </Box>
                    </Box>
                }
            />
            {dialogs}
        </Box>
    );
}
