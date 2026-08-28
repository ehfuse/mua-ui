/**
 * 메일(MUA) 레이아웃 — ListLayout(툴바 헤더 + 메시지 목록 + 오른쪽 상세 패널).
 *
 * 데이터는 로그인 토큰의 사용자(account_seq) 기준으로 AS 가 스코핑하므로 코드마켓/대시보드 어느 셸에 마운트해도 동작한다.
 * 목록 재조회는 필터(계정/폴더/검색/미읽음/중요) 변화를 effect 가 보고 호출하고, realtime(mua.mail.changed)은 조용히 갱신한다.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Fab, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { ListLayout } from "@ehfuse/mui-dashboard-layout";
import { ConfirmDialog } from "@ehfuse/alerts";
import { useModal } from "@ehfuse/forma";
import { useIsMobile } from "../internal/useIsMobile";
import { mfs } from "../internal/mobileFontScale";
import { useMobileSearchOverlay } from "../internal/mobileSearchOverlay";
import { getMuaSubPageBridge } from "../internal/subPageBridge";
import { DefaultMobileCardListLayout, DefaultMobileDetailDialog } from "../internal/mobileDefaults";
import { useMuaConfig, useMuaLogined } from "../MuaProvider";
import { MAIL_FOLDER_LABELS } from "../models/subPage";
import { useMailRealtime, type MailChangedData } from "../apis/useMailRealtime";
import { useComposeController } from "../controllers/composeController";
import { useMailAccountFormController } from "../controllers/mailAccountFormController";
import { useMailController } from "../controllers/mailController";
import type {
    MailAccount,
    MailFilters,
    MailFolderCounts,
    MailListFolder,
    MailMessageDetail,
    MailMessageListItem,
} from "../models/types";
import { useHeaderConfig } from "./Header";
import { MailHeaderActions } from "./components/MailHeaderActions";
import { MailMobileList } from "./components/MailMobileList";
import { MessageDetailPanel } from "./components/MessageDetailPanel";
import { getMailColumns } from "./configs/table";
import { ComposeDialog } from "./dialogs/ComposeDialog";
import { MailAccountFormDialog } from "./dialogs/MailAccountFormDialog";
import { MailAccountsManageDialog } from "./dialogs/MailAccountsManageDialog";
import { toRouteFolder } from "../utils/routeFolder";

interface MailLayoutProps {
    /**
     * 모바일 서브페이지(mfd 풀스크린 슬라이드) 안에 폴더 고정으로 마운트될 때의 설정.
     * 다이얼로그 본문에는 라우트 파라미터가 없으므로 폴더·계정을 props 로 받는다(MailSubPages).
     * 없으면 라우트(`mail` / `mail/account/:accountSeq` / `mail/:folder`)가 폴더를 정한다.
     */
    embedded?: {
        folder: MailListFolder; // 고정 폴더
        accountSeq?: number; // 받은편지함일 때 계정별(0/생략 = 전체 계정)
    };
}

/**
 * 메일 레이아웃 컴포넌트 — 폴더는 라우트(또는 embedded props)가 정한다(사이드바 메뉴와 1:1).
 *   `mail` = 받은편지함(전체 계정) · `mail/account/:accountSeq` = 계정별 받은편지함 · `mail/:folder` = 그 외 폴더(계정 선택 유지)
 * 데스크탑 = ListLayout 표 + 오른쪽 상세 패널, 모바일 = 카드 목록(MobileCardListLayout) + 상세/작성/계정 mfd 슬라이드.
 */
export default function MailLayout({ embedded }: MailLayoutProps = {}) {
    const controller = useMailController();
    const params = useParams<{ folder?: string; accountSeq?: string }>();
    // ⚠️ 아래 effect 의존성은 embedded 객체가 아니라 원시값으로 둔다 — 호출부(MailSubPages)가 렌더마다 새 객체를
    //    만들고, 서브페이지 제목/건수 스토어 갱신이 호스트를 다시 그리므로 객체 의존성이면 무한 갱신 루프가 된다.
    const isEmbedded = Boolean(embedded);
    const embeddedFolder = embedded?.folder;
    const embeddedAccountSeq = embedded?.accountSeq ?? 0;
    const routeFolder = embeddedFolder ?? toRouteFolder(params.folder);
    // 계정별 받은편지함의 계정 seq(-1 = 계정을 지정하지 않음 → 현재 선택 유지).
    //  - embedded 받은편지함: 지정 계정(0 = 전체) · embedded 다른 폴더: 유지 · 라우트: `mail/account/:accountSeq` 만 지정
    const routeAccountSeq = isEmbedded
        ? embeddedFolder === "inbox"
            ? embeddedAccountSeq
            : -1
        : params.accountSeq !== undefined
          ? Number(params.accountSeq) || 0
          : -1;
    const isInboxRoute = isEmbedded ? embeddedFolder === "inbox" : params.folder === undefined;
    const { state } = controller;
    const isMobile = useIsMobile();
    // 모바일: 서브페이지 제목바 돋보기 ↔ 검색/필터 오버레이(코드샵 목록 화면과 동일).
    const searchOverlay = useMobileSearchOverlay();
    const searchOverlayOpen = searchOverlay.useValue("open") as boolean;
    useEffect(() => {
        if (!isMobile) {
            return;
        }
        searchOverlay.setValue("active", true);
        return () => {
            searchOverlay.setValue("active", false);
            searchOverlay.setValue("open", false);
        };
    }, [isMobile, searchOverlay]);
    const logined = useMuaLogined();
    // 모바일 셸(카드 목록 래퍼·상세 다이얼로그)은 앱이 주입하면 그것을, 없으면 패키지 기본을 쓴다.
    const mobileConfig = useMuaConfig().mobile;
    const MobileCardListLayout = mobileConfig?.CardListLayout ?? DefaultMobileCardListLayout;
    const MobileDetailDialog = mobileConfig?.DetailDialog ?? DefaultMobileDetailDialog;

    const accounts = state.useValue("accounts") as MailAccount[];
    const messages = state.useValue("messages") as MailMessageListItem[];
    const total = state.useValue("total") as number;
    const loadingList = state.useValue("loadingList") as boolean;
    const filters = state.useValue("filters") as MailFilters;
    const selectedSeq = state.useValue("selectedSeq") as number;
    const detail = state.useValue("detail") as MailMessageDetail | null;
    const loadingDetail = state.useValue("loadingDetail") as boolean;
    const syncingSeqs = state.useValue("syncingSeqs") as number[];
    const syncing = syncingSeqs.length > 0;
    const error = state.useValue("error") as string;
    const counts = state.useValue("counts") as MailFolderCounts;

    // 서브페이지 제목바 — 건수 "(N)" 와, 계정별 받은편지함이면 폴더명 대신 계정 이름을 올린다.
    useEffect(() => {
        if (!isEmbedded) return;
        getMuaSubPageBridge()?.setCount?.(total);
        return () => getMuaSubPageBridge()?.setCount?.(null);
    }, [isEmbedded, total]);
    const embeddedAccountLabel = useMemo(() => {
        if (!isEmbedded || routeAccountSeq <= 0) return null;
        const account = accounts.find((a) => a.seq === routeAccountSeq);
        return account ? account.name || account.email : null;
    }, [isEmbedded, routeAccountSeq, accounts]);
    useEffect(() => {
        if (!isEmbedded) return;
        getMuaSubPageBridge()?.setTitle?.(embeddedAccountLabel);
        return () => getMuaSubPageBridge()?.setTitle?.(null);
    }, [isEmbedded, embeddedAccountLabel]);

    /** 계정·건수를 다시 읽는다(계정 저장/삭제/동기화 후). */
    const refreshAccounts = useCallback(() => {
        void state.actions.loadAccounts().then(() => state.actions.loadCounts());
    }, [state.actions]);

    /** 목록·건수를 다시 읽는다(발송/임시저장 후). */
    const refreshList = useCallback(() => {
        void state.actions.loadMessages({ silent: true });
        void state.actions.loadCounts();
    }, [state.actions]);

    const accountForm = useMailAccountFormController({ onSaved: refreshAccounts });
    const compose = useComposeController({ onSent: refreshList, onDraftSaved: refreshList });

    // 최초 1회: 계정 → 건수
    const initialLoadRef = useRef(false);
    useEffect(() => {
        if (initialLoadRef.current) return;
        initialLoadRef.current = true;
        refreshAccounts();
    }, [refreshAccounts]);

    // 라우트 → 필터(사이드바 메뉴 클릭/직접 진입). 필터 변화가 아래 effect 로 목록을 다시 읽는다.
    //  - 계정별 받은편지함: 폴더=받은편지함 + 그 계정
    //  - 받은편지함(전체): 폴더=받은편지함 + 전체 계정
    //  - 그 외 폴더: 폴더만 바꾸고 계정 선택은 유지(계정별 받은편지함에서 고른 계정이 다른 폴더에도 이어진다)
    useEffect(() => {
        if (routeAccountSeq >= 0) {
            state.actions.setFilters({ folder: "inbox", mailAccountSeq: routeAccountSeq });
        } else if (isInboxRoute) {
            state.actions.setFilters({ folder: "inbox", mailAccountSeq: 0 });
        } else {
            state.actions.setFilters({ folder: routeFolder });
        }
    }, [routeFolder, routeAccountSeq, isInboxRoute, state.actions]);

    // 필터가 바뀌면 목록·건수 재조회
    const filterKey = `${filters.mailAccountSeq}|${filters.folder}|${filters.search}|${filters.unreadOnly}|${filters.starredOnly}`;
    useEffect(() => {
        void state.actions.loadMessages();
        void state.actions.loadCounts();
        // filterKey 로만 트리거한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey]);

    // realtime — 새 메일/발송 변동 시 해당 폴더를 보고 있으면 조용히 갱신
    const handleRealtime = useCallback(
        (data: MailChangedData) => {
            const current = state.getValue("filters") as MailFilters;
            const sameAccount =
                current.mailAccountSeq === 0 || current.mailAccountSeq === Number(data.mail_account_seq ?? 0);
            if (sameAccount && (data.folder ?? "inbox") === current.folder) {
                void state.actions.loadMessages({ silent: true });
            }
            void state.actions.loadCounts();
        },
        [state]
    );
    useMailRealtime({ enabled: logined, onEvent: handleRealtime });

    /** 기본 발신 계정 — 현재 보고 있는 계정 > 기본 발신 개인 계정 > 첫 계정 */
    const defaultAccount = useMemo(
        () =>
            accounts.find((a) => a.seq === filters.mailAccountSeq) ?? accounts.find((a) => a.is_default) ?? accounts[0],
        [accounts, filters.mailAccountSeq]
    );
    /** 상세 메시지의 계정 */
    const detailAccount = useMemo(
        () => accounts.find((a) => a.seq === detail?.mail_account_seq) ?? defaultAccount,
        [accounts, detail, defaultAccount]
    );

    const handleCompose = useCallback(() => {
        if (!defaultAccount) {
            accountForm.form.actions.openDialog(null);
            return;
        }
        compose.form.actions.openNew(defaultAccount);
    }, [defaultAccount, compose.form.actions, accountForm.form.actions]);

    /** 상세의 주소 클릭 → 그 주소를 받는 사람으로 새 메일(발신 계정 = 상세 메시지의 계정). */
    const handleComposeTo = useCallback(
        (address: string) => {
            if (!detailAccount) {
                accountForm.form.actions.openDialog(null);
                return;
            }
            compose.form.actions.openNew(detailAccount, address);
        },
        [detailAccount, compose.form.actions, accountForm.form.actions]
    );

    // ⚙ = 계정 관리 다이얼로그(목록에서 추가/수정/삭제/동기화). 등록·수정 창은 그 위에 겹쳐 연다.
    const manageModal = useModal({ modalId: "mail-accounts-manage-dialog" });
    const handleManageAccounts = useCallback(() => manageModal.open(), [manageModal]);

    /** 관리 목록에서 계정 삭제(확인 후) — 삭제 성공 시 폼 컨트롤러가 목록을 재조회한다. */
    const handleDeleteAccount = useCallback(
        (account: MailAccount) => {
            ConfirmDialog({
                title: "메일 계정 삭제",
                message: `"${account.name || account.email}" 계정과 받은/보낸 메일이 모두 삭제됩니다. 삭제하시겠습니까?`,
                onConfirm: () => void accountForm.removeAccount(account.seq),
            });
        },
        [accountForm]
    );

    const handleToggleStar = useCallback(
        (row: MailMessageListItem) => {
            void state.actions.applyMessageAction([row.seq], row.is_starred ? "unstar" : "star");
        },
        [state.actions]
    );

    const handleDeleteForever = useCallback(
        (seq: number) => {
            ConfirmDialog({
                title: "영구 삭제",
                message: "이 메일을 영구 삭제합니다. 되돌릴 수 없습니다.",
                onConfirm: () =>
                    void state.actions.applyMessageAction([seq], "delete").then(() => state.actions.loadCounts()),
            });
        },
        [state.actions]
    );

    const handleTrash = useCallback(
        (seq: number) => {
            void state.actions.applyMessageAction([seq], "trash").then(() => state.actions.loadCounts());
        },
        [state.actions]
    );

    const headerActions = (
        <MailHeaderActions
            accounts={accounts}
            syncing={syncing}
            onSync={() => void state.actions.syncNow(filters.mailAccountSeq).then(() => refreshList())}
            onOpenSettings={handleManageAccounts}
        />
    );

    const headerConfig = useHeaderConfig({
        controller,
        isMobile,
        // 모바일은 헤더가 검색 오버레이라 새 메일은 우하단 FAB, 동기화/설정은 목록 위 툴바가 맡는다.
        left: isMobile ? undefined : (
            <Stack direction="row" spacing={2} alignItems="center">
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditOutlinedIcon />}
                    onClick={handleCompose}
                    disabled={accounts.length === 0}
                >
                    새 메일
                </Button>
            </Stack>
        ),
        right: isMobile ? undefined : headerActions,
    });

    const columns = useMemo(() => getMailColumns(handleToggleStar), [handleToggleStar]);
    const hasMore = messages.length < total;

    const detailPanel = (
        <MessageDetailPanel
            detail={detail}
            loading={loadingDetail}
            // 모바일은 mfd 상세 다이얼로그의 ← 가 닫기를 맡고, 본문 스크롤도 다이얼로그가 소유한다.
            embedded={isMobile}
            onClose={() => state.actions.clearSelection()}
            onReply={(mode) => detail && compose.form.actions.openFromMessage(detail, mode, detailAccount)}
            onEditDraft={() => detail && compose.form.actions.openDraft(detail)}
            onComposeTo={handleComposeTo}
            onToggleStar={() =>
                detail && void state.actions.applyMessageAction([detail.seq], detail.is_starred ? "unstar" : "star")
            }
            onMarkUnread={() =>
                detail &&
                void state.actions.applyMessageAction([detail.seq], "unread").then(() => {
                    state.actions.clearSelection();
                    void state.actions.loadCounts();
                })
            }
            onTrash={() => detail && handleTrash(detail.seq)}
            onSpam={() =>
                detail &&
                void state.actions.applyMessageAction([detail.seq], "spam").then(() => state.actions.loadCounts())
            }
            onRestore={() =>
                detail &&
                void state.actions.applyMessageAction([detail.seq], "restore").then(() => state.actions.loadCounts())
            }
            onDeleteForever={() => detail && handleDeleteForever(detail.seq)}
        />
    );

    const emptyMessage = error
        ? error
        : accounts.length === 0
          ? "등록된 메일 계정이 없습니다. 오른쪽 위 계정 관리에서 계정을 등록하세요."
          : "메일이 없습니다.";

    // 공용 다이얼로그(계정 관리/등록·작성) — 데스크탑·모바일 공통.
    const dialogs = (
        <>
            <MailAccountsManageDialog
                open={manageModal.isOpen}
                accounts={accounts}
                syncingSeqs={syncingSeqs}
                onClose={manageModal.close}
                onAdd={() => accountForm.form.actions.openDialog(null)}
                onEdit={(account) => accountForm.form.actions.openDialog(account)}
                onDelete={handleDeleteAccount}
                onSync={(account) => void state.actions.syncNow(account.seq).then(() => refreshList())}
            />
            <MailAccountFormDialog controller={accountForm} />
            <ComposeDialog controller={compose} accounts={accounts} />
        </>
    );

    // ── 모바일: 카드 목록 + 상세(mfd 슬라이드) + 새 메일 FAB ─────────────────────────────
    if (isMobile) {
        const scopeAccount = accounts.find((a) => a.seq === filters.mailAccountSeq);
        const scopeLabel = scopeAccount ? scopeAccount.name || scopeAccount.email : "전체 계정";
        const unreadLabel =
            filters.folder === "inbox" && counts.inbox_unread > 0 ? ` · 안 읽음 ${counts.inbox_unread}` : "";
        return (
            <>
                <MobileCardListLayout
                    header={headerConfig}
                    searchOverlayOpen={searchOverlayOpen}
                    storageKey="mail-mobile-list"
                    // 서브페이지 다이얼로그 안에서는 좌우 여백·폭을 다이얼로그가 이미 준다(두 번 들어가지 않게).
                    inDialog={isEmbedded}
                >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
                        {/* 툴바 — 현재 계정 범위(+받은편지함 미읽음) · 동기화 · 계정 관리 */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.5, minWidth: 0 }}>
                            <Typography
                                noWrap
                                sx={{ flex: 1, minWidth: 0, fontSize: mfs(15), color: "#475569", fontWeight: 600 }}
                            >
                                {scopeLabel}
                                {unreadLabel}
                            </Typography>
                            {headerActions}
                        </Box>
                        <MailMobileList
                            rows={messages}
                            loading={loadingList}
                            emptyMessage={emptyMessage}
                            onSelect={(row) => void state.actions.selectMessage(row.seq)}
                            onToggleStar={handleToggleStar}
                        />
                        {hasMore ? (
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => void state.actions.loadMessages({ append: true })}
                                disabled={loadingList}
                                sx={{ bgcolor: "#fff", fontSize: mfs(15), minHeight: 44 }}
                            >
                                더 보기 ({messages.length}/{total})
                            </Button>
                        ) : null}
                    </Box>
                </MobileCardListLayout>
                {/* 새 메일 — 업무함 새 업무 FAB 와 같은 자리(우·하단 24). 다이얼로그(portal) 안에서는 하단 바 변수가 0 이라
                    바가 있는 라우트 화면에서만 그 높이만큼 올라간다. 계정이 없으면 계정 등록 창이 열린다(handleCompose). */}
                <Fab
                    color="primary"
                    aria-label="새 메일"
                    onClick={handleCompose}
                    sx={{
                        position: "fixed",
                        right: 24,
                        bottom: "calc(24px + var(--mobile-bottom-nav, 0px))",
                        zIndex: 40,
                    }}
                >
                    <EditOutlinedIcon />
                </Fab>
                {/* 상세 — 서브페이지 위에 한 겹 더 뜨는 mfd 슬라이드(뒤로가기 한 번에 상세만 닫힌다). */}
                <MobileDetailDialog
                    modalId="mail-message-detail"
                    open={Boolean(detail) || loadingDetail}
                    title={MAIL_FOLDER_LABELS[(detail?.folder as MailListFolder | undefined) ?? filters.folder]}
                    onClose={() => state.actions.clearSelection()}
                >
                    <Box
                        sx={{
                            bgcolor: "#fff",
                            borderRadius: 2,
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(15,23,42,0.12)",
                        }}
                    >
                        {detailPanel}
                    </Box>
                </MobileDetailDialog>
                {dialogs}
            </>
        );
    }

    return (
        <Box sx={{ userSelect: "none", height: "100%", minHeight: 0 }}>
            <ListLayout
                storageKey="mail-list-layout"
                header={headerConfig}
                tableProps={{
                    columns,
                    data: messages,
                    totalCount: total,
                    getRowId: (row: MailMessageListItem) => row.seq,
                    rowHeight: 52,
                    loading: loadingList,
                    selectedRowId: selectedSeq || null,
                    selectedRowSx: { backgroundColor: "#dbeafe", boxShadow: "inset 3px 0 0 #3b82f6" },
                    onRowClick: (row: MailMessageListItem) => void state.actions.selectMessage(row.seq),
                    emptyMessage,
                    showFooter: hasMore,
                    footerHeight: 44,
                }}
                onEscape={() => state.actions.clearSelection()}
                rightConfig={{ visible: Boolean(detail) || loadingDetail, ratio: 0.5, minWidth: 420 }}
                rightPanel={detailPanel}
            />
            {hasMore ? (
                <Box
                    sx={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 8,
                        display: "flex",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => void state.actions.loadMessages({ append: true })}
                        disabled={loadingList}
                        sx={{ pointerEvents: "auto", bgcolor: "#fff", fontSize: "13.5px" }}
                    >
                        더 보기 ({messages.length}/{total})
                    </Button>
                </Box>
            ) : null}
            {dialogs}
        </Box>
    );
}
