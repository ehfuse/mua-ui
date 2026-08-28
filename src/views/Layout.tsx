/**
 * 메일(MUA) 레이아웃 — ListLayout(툴바 헤더 + 메시지 목록 + 오른쪽 상세 패널).
 *
 * 데이터는 로그인 토큰의 사용자(account_seq) 기준으로 AS 가 스코핑하므로 코드마켓/대시보드 어느 셸에 마운트해도 동작한다.
 * 목록 재조회는 필터(계정/폴더/검색/미읽음/중요) 변화를 effect 가 보고 호출하고, realtime(mua.mail.changed)은 조용히 갱신한다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Drawer, Fab, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { ListLayout } from "@ehfuse/mui-dashboard-layout";
import { ConfirmDialog, ErrorAlert, SuccessAlert, WarningAlert } from "@ehfuse/alerts";
import type { BulkMessageAction } from "../apis/mailApi";
import { useModal } from "@ehfuse/forma";
import { useIsMobile } from "../internal/useIsMobile";
import { mfs } from "../internal/mobileFontScale";
import { useMobileSearchOverlay } from "../internal/mobileSearchOverlay";
import { getMuaSubPageBridge } from "../internal/subPageBridge";
import { DefaultMobileCardListLayout, DefaultMobileDetailDialog } from "../internal/mobileDefaults";
import { MobileListLoadingMoreSpinner, findScrollParent } from "../internal/mobileParts";
import { useMuaConfig, useMuaLogined } from "../MuaProvider";
import { MAIL_FOLDER_LABELS } from "../models/subPage";
import { mailApi, unwrap } from "../apis/mailApi";
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
import { MailBulkActionBar } from "./components/MailBulkActionBar";
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

    // 주소록에 있는 메일 주소 집합 — 상세의 "주소록 추가" 아이콘은 없는 주소에만 보인다(추가하면 즉시 사라진다).
    const [contactEmails, setContactEmails] = useState<Set<string>>(() => new Set());
    useEffect(() => {
        if (!logined) return;
        let cancelled = false;
        void mailApi
            .listContacts("")
            .then((res) => {
                if (cancelled || !res || res.ok === false) return;
                setContactEmails(new Set((res.data?.items ?? []).map((c) => c.email.toLowerCase())));
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [logined]);
    const detailFromAddress = String(detail?.from?.address ?? "").toLowerCase();
    const canAddContact = Boolean(detailFromAddress) && !contactEmails.has(detailFromAddress);
    // 주소록에 있는 보낸 사람의 메일은 외부 이미지를 차단하지 않는다(신뢰 발신자).
    const trustedSender = Boolean(detailFromAddress) && contactEmails.has(detailFromAddress);

    /** 상세의 보낸 사람 → 주소록 추가(같은 주소가 이미 있으면 안내만 하고 아이콘을 감춘다). */
    const handleAddContact = useCallback(async (address: string, name: string) => {
        const key = address.toLowerCase();
        try {
            const res = await mailApi.createContact({ email: address, name });
            if (res && res.ok === false) {
                WarningAlert({ message: res.error || "이미 주소록에 있는 메일 주소입니다." });
            } else {
                SuccessAlert("주소록에 추가했습니다.");
            }
            setContactEmails((prev) => new Set(prev).add(key));
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "주소록에 추가하지 못했습니다." });
        }
    }, []);

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

    const handleTrash = useCallback(
        (seq: number) => {
            void state.actions.applyMessageAction([seq], "trash").then(() => state.actions.loadCounts());
        },
        [state.actions]
    );

    // 복수 선택(체크박스) — 폴더/검색이 바뀌면 비운다.
    const [checkedSeqs, setCheckedSeqs] = useState<Set<number>>(() => new Set());
    const toggleChecked = useCallback((seq: number) => {
        setCheckedSeqs((prev) => {
            const next = new Set(prev);
            if (next.has(seq)) next.delete(seq);
            else next.add(seq);
            return next;
        });
    }, []);
    const allChecked = messages.length > 0 && messages.every((row) => checkedSeqs.has(row.seq));
    const someChecked = messages.some((row) => checkedSeqs.has(row.seq));
    const toggleAllChecked = useCallback(() => {
        setCheckedSeqs(allChecked ? new Set() : new Set(messages.map((row) => row.seq)));
    }, [allChecked, messages]);
    useEffect(() => {
        setCheckedSeqs(new Set());
    }, [filterKey]);
    /** 선택 건 일괄 처리(영구 삭제는 확인). */
    const runBulkAction = useCallback(
        (action: BulkMessageAction) => {
            const seqs = messages.filter((row) => checkedSeqs.has(row.seq)).map((row) => row.seq);
            if (seqs.length === 0) return;
            const run = () =>
                void state.actions.applyMessageAction(seqs, action).then((ok: boolean) => {
                    if (!ok) return;
                    setCheckedSeqs(new Set());
                    if (
                        seqs.includes(state.getValue("selectedSeq") as number) &&
                        action !== "read" &&
                        action !== "unread"
                    )
                        state.actions.clearSelection();
                    void state.actions.loadCounts();
                });
            if (action === "delete") {
                ConfirmDialog({
                    title: "영구 삭제",
                    message: `선택한 ${seqs.length}건을 영구 삭제합니다. 되돌릴 수 없습니다.`,
                    onConfirm: run,
                });
                return;
            }
            run();
        },
        [messages, checkedSeqs, state]
    );
    const checkedRows = messages.filter((row) => checkedSeqs.has(row.seq));
    const checkedCount = checkedRows.length;
    /** 답장/전달 대상 — 체크 1건이면 그 메일, 체크가 없으면 열려 있는 상세. */
    const replyTargetSeq =
        checkedCount === 1
            ? (messages.find((row) => checkedSeqs.has(row.seq))?.seq ?? 0)
            : checkedCount === 0
              ? (detail?.seq ?? 0)
              : 0;
    /** 전달 대상 — 체크된 메일 전부(없으면 열려 있는 상세). */
    const forwardTargetSeqs = checkedCount > 0 ? checkedRows.map((row) => row.seq) : detail ? [detail.seq] : [];
    const handleToolbarReply = useCallback(
        async (mode: "reply" | "replyAll" | "forward") => {
            const seqs = mode === "forward" ? forwardTargetSeqs : replyTargetSeq > 0 ? [replyTargetSeq] : [];
            if (seqs.length === 0) return;
            if (seqs.length > 20) {
                WarningAlert({ message: "한 번에 전달할 수 있는 메일은 20통까지입니다." });
                return;
            }
            try {
                const details = await Promise.all(
                    seqs.map(async (seq) =>
                        detail && detail.seq === seq
                            ? detail
                            : unwrap(await mailApi.getMessage(seq, false), "메일을 불러오지 못했습니다.")
                    )
                );
                const account = accounts.find((a) => a.seq === details[0].mail_account_seq) ?? defaultAccount;
                if (mode === "replyAll" && details[0].cc.length === 0) {
                    WarningAlert({ message: "참조가 없는 메일은 전체 답장할 수 없습니다. 답장을 사용하세요." });
                    return;
                }
                if (mode === "forward") compose.form.actions.openForwardMany(details, account);
                else compose.form.actions.openFromMessage(details[0], mode, account);
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "메일을 불러오지 못했습니다." });
            }
        },
        [forwardTargetSeqs, replyTargetSeq, detail, accounts, defaultAccount, compose.form.actions]
    );
    // 데스크탑: 항상 보이는 툴바(선택 없으면 비활성) — 헤더 필터 영역. 모바일: 선택 중일 때만 아이콘 바.
    const bulkBar =
        !isMobile || checkedSeqs.size > 0 ? (
            <MailBulkActionBar
                count={checkedCount}
                folder={filters.folder}
                compact={isMobile}
                onAction={runBulkAction}
                replyEnabled={replyTargetSeq > 0 && filters.folder !== "draft"}
                // 상세가 열린 대상은 참조 유무를 바로 알고, 체크만 한 행은 상세를 받은 뒤 검증한다.
                replyAllEnabled={
                    replyTargetSeq > 0 &&
                    filters.folder !== "draft" &&
                    (detail?.seq === replyTargetSeq ? detail.cc.length > 0 : true)
                }
                forwardEnabled={forwardTargetSeqs.length > 0 && filters.folder !== "draft"}
                canMarkRead={checkedRows.some((row) => !row.is_read)}
                canMarkUnread={checkedRows.some((row) => row.is_read)}
                onReply={(mode) => void handleToolbarReply(mode)}
            />
        ) : null;

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
        toolbar: isMobile ? undefined : bulkBar,
        right: isMobile ? undefined : headerActions,
    });

    const columns = useMemo(
        () =>
            getMailColumns(handleToggleStar, {
                checked: checkedSeqs,
                allChecked,
                someChecked,
                onToggle: toggleChecked,
                onToggleAll: toggleAllChecked,
            }),
        [handleToggleStar, checkedSeqs, allChecked, someChecked, toggleChecked, toggleAllChecked]
    );
    const hasMore = messages.length < total;

    // 무한 스크롤 — 데스크탑은 vdt onLoadMore, 모바일은 하단 sentinel. 진행 중 중복 호출을 막는다.
    const [loadingMore, setLoadingMore] = useState(false);
    const loadingMoreRef = useRef(false);
    const handleLoadMore = useCallback(() => {
        // 진단 로그(무한 스크롤이 안 이어질 때 원인 확인용) — 호출 자체가 없으면 끝 감지가 안 온 것이다.
        console.log("[mua:loadMore] requested", {
            hasMore,
            loadingList,
            inFlight: loadingMoreRef.current,
        });
        if (!hasMore || loadingList || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        void state.actions.loadMessages({ append: true, silent: true }).finally(() => {
            loadingMoreRef.current = false;
            setLoadingMore(false);
            console.log("[mua:loadMore] done", {
                messages: (state.getValue("messages") as MailMessageListItem[]).length,
                total: state.getValue("total"),
                page: state.getValue("page"),
            });
        });
    }, [hasMore, loadingList, state]);
    // 데스크탑 폴백 — vdt(react-virtuoso) 의 endReached 가 오지 않는 경우를 대비해 표 스크롤러의 scroll 이벤트로도 감지한다.
    const tableWrapRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (isMobile || !hasMore) return;
        const wrap = tableWrapRef.current;
        if (!wrap) return;
        const scroller =
            wrap.querySelector<HTMLElement>('[data-virtuoso-scroller="true"]') ??
            wrap.querySelector<HTMLElement>(".list-layout-left, .overlay-scrollbar-container");
        if (!scroller) {
            console.log("[mua:loadMore] scroller not found (fallback off)");
            return;
        }
        const onScroll = () => {
            const remain = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
            if (remain < 300) handleLoadMore();
        };
        scroller.addEventListener("scroll", onScroll, { passive: true });
        return () => scroller.removeEventListener("scroll", onScroll);
    }, [isMobile, hasMore, handleLoadMore, messages.length]);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !isMobile || !hasMore) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) handleLoadMore();
            },
            { root: findScrollParent(el), rootMargin: "320px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [isMobile, hasMore, handleLoadMore, messages.length]);

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
            trustedSender={trustedSender}
            onAddContact={canAddContact ? (address, name) => void handleAddContact(address, name) : undefined}
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
            // 확인은 상세 패널의 팝퍼가 맡는다(여기서 ConfirmDialog 를 또 띄우지 않는다).
            onDeleteForever={() =>
                detail &&
                void state.actions.applyMessageAction([detail.seq], "delete").then(() => state.actions.loadCounts())
            }
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
                            {bulkBar ? (
                                <Box sx={{ flex: 1, minWidth: 0 }}>{bulkBar}</Box>
                            ) : (
                                <>
                                    <Typography
                                        noWrap
                                        sx={{
                                            flex: 1,
                                            minWidth: 0,
                                            fontSize: mfs(15),
                                            color: "#475569",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {scopeLabel}
                                        {unreadLabel}
                                    </Typography>
                                    {headerActions}
                                </>
                            )}
                        </Box>
                        <MailMobileList
                            rows={messages}
                            loading={loadingList}
                            emptyMessage={emptyMessage}
                            onSelect={(row) => void state.actions.selectMessage(row.seq)}
                            onToggleStar={handleToggleStar}
                            checkedSeqs={checkedSeqs}
                            onToggleCheck={toggleChecked}
                        />
                        {/* 무한 스크롤 sentinel — 뷰포트(또는 다이얼로그 스크롤러)에 들어오면 다음 페이지 */}
                        {loadingMore ? <MobileListLoadingMoreSpinner /> : null}
                        {hasMore ? <Box ref={sentinelRef} sx={{ height: 1 }} /> : null}
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
        <Box ref={tableWrapRef} sx={{ userSelect: "none", height: "100%", minHeight: 0 }}>
            <ListLayout
                storageKey="mail-list-layout"
                header={headerConfig}
                tableProps={{
                    columns,
                    data: messages,
                    totalCount: total,
                    getRowId: (row: MailMessageListItem) => row.seq,
                    rowHeight: 44,
                    loading: loadingList,
                    selectedRowId: selectedSeq || null,
                    selectedRowSx: { backgroundColor: "#dbeafe", boxShadow: "inset 3px 0 0 #3b82f6" },
                    onRowClick: (row: MailMessageListItem) => void state.actions.selectMessage(row.seq),
                    emptyMessage,
                    // 스크롤이 끝에 가까워지면 다음 페이지를 이어 붙인다(더 보기 버튼 없음).
                    onLoadMore: hasMore
                        ? () => {
                              console.log("[mua:loadMore] vdt onLoadMore");
                              handleLoadMore();
                          }
                        : undefined,
                }}
                onEscape={() => state.actions.clearSelection()}
            />
            {/* 상세 — 오른쪽 드로어(목록을 분할하지 않는다). 닫기 = X · Esc · 바깥 클릭. */}
            <Drawer
                anchor="right"
                open={Boolean(detail) || loadingDetail}
                onClose={() => state.actions.clearSelection()}
                slotProps={{
                    paper: {
                        sx: { width: "min(850px, 50vw)", maxWidth: "50vw", display: "flex", flexDirection: "column" },
                    },
                }}
            >
                {detailPanel}
            </Drawer>
            {dialogs}
        </Box>
    );
}
