import { t } from "../i18n";
/**
 * 주소록 페이지 — 사용자별 연락처 목록(검색·즐겨찾기) + 등록/수정 다이얼로그 + [메일 보내기](작성 다이얼로그).
 * 데스크탑 = ListLayout 표, 모바일 = 카드 목록(서브페이지 본문으로도 마운트된다: embedded).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Fab, IconButton, Tab, Tabs, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LabelIcon from "@mui/icons-material/Label";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
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
import type { MailContact, MailLabel } from "../models/types";
import { MailLabelChips, MailLabelDot, MailLabelMenu, labelCheckStates, labelColor } from "./components/MailLabels";
import { ContactLabelsDialog } from "./dialogs/ContactLabelsDialog";
import { MailLabelFormDialog, contactLabelApi } from "./dialogs/MailLabelsList";
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
            {shared ? t("shared") : t("personal")}
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
    // 목록 위 갈래 탭(2026-10-16) — 메일 목록처럼 전체 · 별표 · 라벨마다(2026-10-27). 주소록은 한 번에 다 읽으므로 화면에서 거른다.
    // 라벨 탭 값은 "label:<seq>".
    const [scope, setScope] = useState<string>("all");
    // 내 주소록 라벨 — 메일 라벨과 따로다(2026-10-27 사용자 지시). 줄의 라벨 아이콘 메뉴 · 관리 창에서 만든다.
    const [labels, setLabels] = useState<MailLabel[]>([]);
    const loadLabels = useCallback(async (items?: MailLabel[]) => {
        if (items) {
            setLabels(items);
            return items;
        }
        try {
            const res = await mailApi.listContactLabels();
            const next = res && res.ok !== false && Array.isArray(res.data?.items) ? res.data.items : [];
            setLabels(next);
            return next;
        } catch {
            return [];
        }
    }, []);
    useEffect(() => {
        if (logined) void loadLabels();
    }, [logined, loadLabels]);
    // 줄의 라벨 아이콘 메뉴 — 단추는 메뉴를 여는 순간 목록이 다시 그려져 바뀌므로 누른 때의 좌표를 쥔다(메일 목록과 같다).
    const [rowLabelMenu, setRowLabelMenu] = useState<{ position: { top: number; left: number }; seq: number } | null>(null);
    const [labelFormFor, setLabelFormFor] = useState<number | null>(null); // 새 라벨을 만들어 달 연락처 seq(0 = 만들기만)
    const [labelsManageOpen, setLabelsManageOpen] = useState(false);
    const openRowLabelMenu = (contact: MailContact, anchor: HTMLElement) => {
        const rect = anchor.getBoundingClientRect();
        setRowLabelMenu({ position: { top: rect.bottom, left: rect.left }, seq: contact.seq });
    };
    // 보던 라벨이 지워졌으면 전체로
    useEffect(() => {
        if (scope.startsWith("label:") && !labels.some((label) => `label:${label.seq}` === scope)) setScope("all");
    }, [labels, scope]);
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
            const data = unwrap(await mailApi.listContacts(keyword), t("loadContactsFailed"));
            setContacts(Array.isArray(data.items) ? data.items : []);
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : t("loadContactsFailed") });
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
                ErrorAlert({ message: t("addAccountToSend") });
                return;
            }
            contactForm.modal.close();
            compose.form.actions.openNew(account, email);
        },
        [accounts, compose.form.actions, contactForm.modal]
    );

    /** 연락처 하나에 주소록 라벨 달기·떼기(낙관적 반영) — 내 라벨만 바꾼다(공용 연락처도). */
    const toggleContactLabel = useCallback(
        async (seq: number, labelSeq: number, add: boolean) => {
            const contact = contacts.find((c) => c.seq === seq);
            if (!contact) return;
            const before = contact.label_seqs ?? [];
            const next = add ? [...before.filter((s) => s !== labelSeq), labelSeq] : before.filter((s) => s !== labelSeq);
            setContacts((prev) => prev.map((c) => (c.seq === seq ? { ...c, label_seqs: next } : c)));
            try {
                unwrap(await mailApi.updateContact(seq, { label_seqs: next }), t("labelChangeFailed"));
            } catch (error) {
                setContacts((prev) => prev.map((c) => (c.seq === seq ? { ...c, label_seqs: before } : c)));
                ErrorAlert({ message: error instanceof Error ? error.message : t("labelChangeFailed") });
            }
        },
        [contacts]
    );

    /** 즐겨찾기 토글(낙관적 반영) */
    const toggleFavorite = useCallback(async (contact: MailContact) => {
        const next = !contact.is_favorite;
        setContacts((prev) => prev.map((c) => (c.seq === contact.seq ? { ...c, is_favorite: next } : c)));
        try {
            unwrap(await mailApi.updateContact(contact.seq, { is_favorite: next }), t("saveFailed"));
        } catch (error) {
            setContacts((prev) => prev.map((c) => (c.seq === contact.seq ? { ...c, is_favorite: !next } : c)));
            ErrorAlert({ message: error instanceof Error ? error.message : t("saveFailed") });
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
                {t("addContact")}
            </Button>
        ),
        showSearch: true,
        searchPlaceholder: t("searchNameEmail"),
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
                text: t("number"),
                width: 64,
                align: "center",
                render: (_row, index) => cellText(String(index + 1), true),
            },
            {
                id: "is_favorite",
                text: "",
                // 별 · 라벨 단추 둘(28px씩)에 칸 좌우 여백(14px씩)이 들어가는 폭 — 메일 목록의 별 · 라벨 칸과 같다.
                // 44 였을 때는 별 하나도 넘쳐 오른쪽으로 6px 쏠렸다(2026-10-27).
                width: 84,
                align: "center",
                style: { textAlign: "center" },
                render: (row) => (
                    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
                        <IconButton
                            size="small"
                            aria-label={row.is_favorite ? t("unfavorite") : t("favorite")}
                            onClick={(event) => {
                                event.stopPropagation();
                                void toggleFavorite(row);
                            }}
                            sx={{ p: 0.5 }}
                        >
                            <FavoriteStar on={row.is_favorite} />
                        </IconButton>
                        <IconButton
                            size="small"
                            aria-label={t("label")}
                            onClick={(event) => {
                                event.stopPropagation();
                                openRowLabelMenu(row, event.currentTarget);
                            }}
                            sx={{ p: 0.5 }}
                        >
                            {/* 단 라벨이 있으면 첫 라벨 색으로 채운다 — 없으면 별과 같은 회색 테두리(메일 목록과 같다). */}
                            {(() => {
                                const first = labels.find((label) => row.label_seqs?.includes(label.seq));
                                return first ? (
                                    <LabelIcon sx={{ fontSize: 20, color: labelColor(first) }} />
                                ) : (
                                    <LabelOutlinedIcon sx={{ fontSize: 20, color: "#94a3b8" }} />
                                );
                            })()}
                        </IconButton>
                    </Box>
                ),
            },
            {
                id: "name",
                text: t("name"),
                width: "18%",
                style: { fontSize: 15 },
                render: (row) => (
                    // 라벨 칩은 이름 뒤에(메일 목록은 제목 앞이지만 주소록은 이름이 먼저 읽혀야 한다).
                    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                        <Box component="span" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                            {row.name || "-"}
                        </Box>
                        <MailLabelChips seqs={row.label_seqs} labels={labels} maxWidth={100} />
                    </Box>
                ),
            },
            {
                id: "scope",
                text: t("type"),
                width: 80,
                align: "center",
                style: { textAlign: "center" },
                render: (row) => <ScopeChip shared={row.scope === "shared"} />,
            },
            { id: "email", text: t("emailAddress"), width: "26%", render: (row) => cellText(row.email) },
            { id: "organization", text: t("organization"), width: "16%", render: (row) => cellText(row.organization || "") },
            { id: "phone", text: t("phone"), width: 150, align: "center", render: (row) => cellText(row.phone || "") },
            { id: "memo", text: t("memo"), render: (row) => cellText(row.memo || "", true) },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [toggleFavorite, labels]
    );

    const shown = useMemo(() => {
        if (scope === "favorite") return contacts.filter((c) => c.is_favorite);
        if (scope.startsWith("label:")) {
            const labelSeq = Number(scope.slice("label:".length));
            return contacts.filter((c) => c.label_seqs?.includes(labelSeq));
        }
        return contacts;
    }, [scope, contacts]);
    const favoriteCount = useMemo(() => contacts.filter((c) => c.is_favorite).length, [contacts]);

    const emptyMessage = search
        ? t("noResults")
        : scope === "favorite"
          ? t("noStarredContacts")
        : t("noContacts");

    const dialogs = (
        <>
            <ContactFormDialog controller={contactForm} onCompose={handleCompose} labels={labels} />
            <MailLabelMenu
                anchorPosition={rowLabelMenu?.position ?? null}
                onClose={() => setRowLabelMenu(null)}
                labels={labels}
                states={labelCheckStates(contacts.filter((c) => c.seq === rowLabelMenu?.seq), labels)}
                onToggle={(label, add) => rowLabelMenu && void toggleContactLabel(rowLabelMenu.seq, label.seq, add)}
                onCreate={() => {
                    setLabelFormFor(rowLabelMenu?.seq ?? 0);
                    setRowLabelMenu(null);
                }}
                onManage={() => setLabelsManageOpen(true)}
            />
            <MailLabelFormDialog
                open={labelFormFor !== null}
                api={contactLabelApi}
                onClose={() => setLabelFormFor(null)}
                onSaved={(label) => {
                    const target = labelFormFor ?? 0;
                    void loadLabels().then(() => {
                        if (target > 0) void toggleContactLabel(target, label.seq, true);
                    });
                }}
            />
            <ContactLabelsDialog
                open={labelsManageOpen}
                labels={labels}
                onClose={() => setLabelsManageOpen(false)}
                onChanged={(items) => void loadLabels(items)}
            />
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
                    <Box
                        role="tablist"
                        aria-label={t("contactsView")}
                        sx={{ display: "flex", mx: "-16px", mt: "-16px", mb: 1.5, bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", overflowX: "auto", scrollbarWidth: "none" }}
                    >
                        {["all", "favorite", ...labels.map((label) => `label:${label.seq}`)].map((key) => {
                            const label = key.startsWith("label:") ? labels.find((l) => `label:${l.seq}` === key) : undefined;
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
                                        // 라벨이 있으면 칸이 늘어 옆으로 밀린다 — 전체 · 별표만일 때는 지금처럼 폭을 똑같이 나눈다.
                                        flex: labels.length > 0 ? "0 0 auto" : 1,
                                        minWidth: 0,
                                        px: labels.length > 0 ? 2 : 0,
                                        whiteSpace: "nowrap",
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
                                    {label ? (
                                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                                            <MailLabelDot color={labelColor(label)} size={18} />
                                            {label.name}
                                        </Box>
                                    ) : key === "all" ? (
                                        t("all")
                                    ) : favoriteCount > 0 ? (
                                        t("starredCount", { count: favoriteCount })
                                    ) : (
                                        t("starred")
                                    )}
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
                                                <MobileChip tone="blue">{t("shared")}</MobileChip>
                                            ) : null}
                                            {contact.organization ? (
                                                <MobileChip>{contact.organization}</MobileChip>
                                            ) : null}
                                            <MailLabelChips seqs={contact.label_seqs} labels={labels} maxWidth={90} />
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
                                    <IconButton
                                        size="small"
                                        aria-label={t("label")}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            openRowLabelMenu(contact, event.currentTarget);
                                        }}
                                        sx={{ p: 0.5, flexShrink: 0 }}
                                    >
                                        {(() => {
                                            const first = labels.find((label) => contact.label_seqs?.includes(label.seq));
                                            return first ? (
                                                <LabelIcon sx={{ fontSize: 22, color: labelColor(first) }} />
                                            ) : (
                                                <LabelOutlinedIcon sx={{ fontSize: 22, color: "#94a3b8" }} />
                                            );
                                        })()}
                                    </IconButton>
                                </Box>
                            ))}
                        </MobileCardStack>
                    )}
                </MobileCardListLayout>
                <Fab
                    color="primary"
                    aria-label={t("addContact")}
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
                            onChange={(_event, value: string) => setScope(value)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ minHeight: 44, borderBottom: "1px solid #e2e8f0", flexShrink: 0, "& .MuiTab-root": { minHeight: 44, fontSize: 14.5, px: 2.5 } }}
                        >
                            <Tab value="all" label={t("all")} />
                            <Tab
                                value="favorite"
                                aria-label={t("starred")}
                                sx={{ minWidth: 56 }}
                                label={<StarRoundedIcon sx={{ fontSize: 22, color: "#f59e0b", fill: "currentColor" }} />}
                            />
                            {/* 라벨 탭 — 메일 목록의 라벨 탭과 같은 모양(꼬리표 · 이름). */}
                            {labels.map((label) => (
                                <Tab
                                    key={label.seq}
                                    value={`label:${label.seq}`}
                                    label={
                                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, maxWidth: 160 }}>
                                            <MailLabelDot color={labelColor(label)} />
                                            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {label.name}
                                            </Box>
                                        </Box>
                                    }
                                />
                            ))}
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
