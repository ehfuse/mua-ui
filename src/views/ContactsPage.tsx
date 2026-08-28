/**
 * 주소록 페이지 — 사용자별 연락처 목록(검색·즐겨찾기) + 등록/수정 다이얼로그 + [메일 보내기](작성 다이얼로그).
 * 데스크탑 = ListLayout 표, 모바일 = 카드 목록(서브페이지 본문으로도 마운트된다: embedded).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Fab, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import type { DataColumn } from "@ehfuse/mui-virtual-data-table";
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
    };

    const columns = useMemo<DataColumn<MailContact>[]>(
        () => [
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
                render: (row) => (
                    <Typography noWrap sx={{ fontSize: "14px", fontWeight: 600 }}>
                        {row.name || "-"}
                    </Typography>
                ),
            },
            {
                id: "email",
                text: "메일 주소",
                width: "28%",
                render: (row) => (
                    <Typography noWrap sx={{ fontSize: "14px" }}>
                        {row.email}
                    </Typography>
                ),
            },
            {
                id: "organization",
                text: "소속",
                width: "16%",
                render: (row) => (
                    <Typography noWrap sx={{ fontSize: "14px" }}>
                        {row.organization || ""}
                    </Typography>
                ),
            },
            {
                id: "phone",
                text: "전화번호",
                width: 130,
                render: (row) => (
                    <Typography noWrap sx={{ fontSize: "14px" }}>
                        {row.phone || ""}
                    </Typography>
                ),
            },
            {
                id: "memo",
                text: "메모",
                render: (row) => (
                    <Typography noWrap sx={{ fontSize: "13.5px", color: "#475569" }}>
                        {row.memo || ""}
                    </Typography>
                ),
            },
        ],
        [toggleFavorite]
    );

    const emptyMessage = search
        ? "검색 결과가 없습니다."
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
                    {loading && contacts.length === 0 ? <MobileListLoadingSpinner /> : null}
                    {!loading && contacts.length === 0 ? (
                        <Typography sx={{ fontSize: mfs(15), color: "#475569", textAlign: "center", py: 4 }}>
                            {emptyMessage}
                        </Typography>
                    ) : (
                        <MobileCardStack>
                            {contacts.map((contact) => (
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

    return (
        <Box sx={{ userSelect: "none", height: "100%", minHeight: 0 }}>
            <ListLayout
                storageKey="mail-contacts-layout"
                header={headerConfig}
                tableProps={{
                    columns,
                    data: contacts,
                    totalCount: contacts.length,
                    getRowId: (row: MailContact) => row.seq,
                    rowHeight: 48,
                    loading,
                    onRowClick: (row: MailContact) => openEdit(row),
                    emptyMessage,
                }}
            />
            {dialogs}
        </Box>
    );
}
