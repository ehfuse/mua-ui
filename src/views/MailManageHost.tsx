/**
 * 메일 관리 UI 호스트 — 관리 다이얼로그(계정/메일함/규칙 탭)·계정 등록/수정 폼·규칙 폼·**새 메일 작성**을 한 곳에서 그린다.
 *
 * 왜 메일 화면(Layout)에서 떼어냈나: 사이드바 메일 그룹의 + 처럼 메일 화면 **밖**에서도 관리를 여는 자리가 있다.
 * 다이얼로그가 Layout 안에 있으면 그때는 요청만 쌓이고 메일 화면에 들어가야 열려 고장처럼 보였다(2026-09-06).
 * 앱이 대시보드 레이아웃에 이 호스트를 한 번 두면(MuaConfig.appHostsMailManage) 어느 화면에서든 그 자리에서 열린다.
 * 앱이 두지 않으면 Layout 이 스스로 하나 그린다 — 여는 쪽은 언제나 internal/manageRequest 로 요청만 한다.
 *
 * 데이터는 메일 화면·사이드바 훅과 같은 전역 상태(MAIL_STATE_ID)라 따로 읽지 않는다. 다만 규칙은 메일 화면만
 * 읽어 두므로 메일 밖에서 열 때 비어 있을 수 있어 그때만 한 번 읽는다. 목록(메시지) 새로고침은 메일 화면이
 * 떠 있을 때만 의미가 있어 requestMailRefresh 로 넘긴다(구독자가 없으면 아무 일도 없다).
 *
 * ⚠️ MuaProvider 안에서 써야 한다(앱 FormDialog·로그인 계정을 거기서 받는다).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@ehfuse/alerts";
import { useModal } from "@ehfuse/forma";
import { mailApi, unwrap } from "../apis/mailApi";
import { useMailController } from "../controllers/mailController";
import { useMailAccountFormController } from "../controllers/mailAccountFormController";
import type { MailAccount, MailRule, MailRuleFormPrefill, MailUserFolder } from "../models/types";
import { consumeMailManageRequest, subscribeMailManage, type MailManageTab } from "../internal/manageRequest";
import { requestMailRefresh } from "../internal/refreshRequest";
import { MailManageDialog } from "./dialogs/MailManageDialog";
import { MailAccountFormDialog } from "./dialogs/MailAccountFormDialog";
import { MailHostedProfileDialog } from "./dialogs/MailHostedProfileDialog";
import { MailRuleFormDialog } from "./dialogs/MailRuleFormDialog";
import { ComposeDialog } from "./dialogs/ComposeDialog";
import { useComposeController } from "../controllers/composeController";

/** 메일 관리 다이얼로그·폼을 그리는 호스트. 앱 레이아웃 또는 메일 화면 어느 한 곳에만 둔다. */
export function MailManageHost() {
    const { state } = useMailController();
    // 관리 다이얼로그는 현재 팀과 무관하게 내 모든 팀 공용을 보여준다(팀명 칩으로 구분) — in_sidebar 로 거르지 않는다.
    const allAccounts = state.useValue("accounts") as MailAccount[];
    const allFolders = state.useValue("folders") as MailUserFolder[];
    const rules = state.useValue("rules") as MailRule[];
    const syncingSeqs = state.useValue("syncingSeqs") as number[];
    // 규칙 폼의 이동 대상은 보기 범위 메일함만(메일 화면과 같다).
    const folders = useMemo(() => allFolders.filter((f) => f.in_sidebar !== false), [allFolders]);

    /** 계정·건수를 다시 읽는다(계정 저장/삭제/동기화 후). */
    const refreshAccounts = useCallback(() => {
        void state.actions.loadAccounts().then(() => state.actions.loadCounts());
    }, [state.actions]);
    /** 메일함 변경 후 — 메일함·건수를 다시 읽고, 메일 화면이 떠 있으면 목록도. */
    const refreshFolders = useCallback(() => {
        void state.actions.loadFolders().then(() => state.actions.loadCounts());
        void requestMailRefresh();
    }, [state.actions]);
    /** 규칙 변경 후 — 규칙을 다시 읽고, 메일 화면이 떠 있으면 목록도(규칙 적용 결과). */
    const refreshRules = useCallback(() => {
        void state.actions.loadRules();
        void requestMailRefresh();
    }, [state.actions]);

    /** 계정 순서 저장 — 서버가 새 목록을 돌려주므로 다시 조회하지 않는다(사이드바도 같은 목록을 쓴다). */
    const handleReorderAccounts = useCallback(
        (seqs: number[]) => {
            void mailApi
                .reorderAccounts(seqs)
                .then((res) => {
                    const items = unwrap(res, "").items;
                    if (Array.isArray(items)) state.setValue("accounts", items);
                })
                .catch(() => refreshAccounts()); // 실패하면 서버 순서로 되돌린다.
        },
        [state, refreshAccounts]
    );

    const accountForm = useMailAccountFormController({ onSaved: refreshAccounts });
    // 기업메일 사서함은 외부 계정 폼이 아니라 프로필(이름·서명·기본 발신) 창으로 연다 — 고칠 수 있는 것이 다르다.
    const [hostedEditing, setHostedEditing] = useState<MailAccount | null>(null);

    /** 계정 목록의 연필 — 기업메일 사서함이면 프로필 창, 그 외에는 외부 계정 폼. */
    const handleEditAccount = useCallback(
        (account: MailAccount) => {
            if (account.kind === "hosted") setHostedEditing(account);
            else accountForm.form.actions.openDialog(account);
        },
        [accountForm.form.actions]
    );

    /**
     * 새 메일 작성 — 메일 화면이 아니라 이 호스트가 그린다(2026-09-06).
     * 사이드바 "새 메일" 은 업무함·결재 어디서든 눌리므로, 다이얼로그가 메일 화면 안에 있으면
     * 받은편지함까지 가야 열려 고장처럼 보인다(관리 다이얼로그를 여기로 옮긴 것과 같은 이유).
     * 보낸 뒤·임시저장 뒤에는 메일 화면이 떠 있을 때만 목록을 새로 읽는다(구독자가 없으면 아무 일도 없다).
     */
    const compose = useComposeController({
        onSent: () => void requestMailRefresh(),
        onDraftSaved: () => void requestMailRefresh(),
    });
    // 새 메일의 보내는 계정 — 마지막에 고른 것 > 기본 발신 > 첫 계정(메일 화면과 같은 규칙).
    const lastAccountSeq = state.useValue("lastAccountSeq") as number;
    const sidebarAccounts = useMemo(() => allAccounts.filter((a) => a.in_sidebar !== false), [allAccounts]);
    const openCompose = useCallback(() => {
        const account =
            sidebarAccounts.find((a) => a.seq === lastAccountSeq) ??
            sidebarAccounts.find((a) => a.is_default) ??
            sidebarAccounts[0];
        // 계정이 하나도 없으면 등록부터 — 빈 작성 창을 열어 봐야 보낼 수 없다.
        if (!account) {
            accountForm.form.actions.openDialog(null);
            return;
        }
        compose.form.actions.openNew(account);
    }, [sidebarAccounts, lastAccountSeq, compose.form.actions, accountForm.form.actions]);

    // 관리 다이얼로그(계정/메일함/규칙 탭). 계정 등록·수정 창은 그 위에 겹쳐 연다.
    const manageModal = useModal({ modalId: "mail-manage-dialog" });
    const [manageTab, setManageTab] = useState<MailManageTab>("accounts");
    const openManage = useCallback(
        (tab: MailManageTab) => {
            setManageTab(tab);
            manageModal.open();
            // 규칙은 메일 화면만 읽어 둔다 — 메일 밖에서 열었으면 비어 있으므로 여기서 한 번 읽는다.
            if (((state.getValue("rules") as MailRule[] | undefined) ?? []).length === 0) {
                void state.actions.loadRules();
            }
        },
        [manageModal, state]
    );

    // 규칙 폼(관리 다이얼로그의 [규칙 추가]/수정, 메일 우클릭 "규칙 만들기")
    const [ruleEditing, setRuleEditing] = useState<{
        rule: MailRule | null;
        prefill: MailRuleFormPrefill | null;
    } | null>(null);

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

    // 열기 요청 소비 — 마운트 때 대기 중인 것 + 이후 들어오는 것.
    useEffect(() => {
        const check = () => {
            const request = consumeMailManageRequest();
            if (!request) return;
            if (request.kind === "compose") openCompose();
            else if (request.kind === "manage") openManage(request.tab);
            else if (request.kind === "account") accountForm.form.actions.openDialog(request.account);
            else setRuleEditing({ rule: request.rule, prefill: request.prefill });
        };
        check();
        return subscribeMailManage(check);
    }, [openManage, openCompose, accountForm.form.actions]);

    return (
        <>
            <ComposeDialog controller={compose} accounts={sidebarAccounts} />
            <MailManageDialog
                open={manageModal.isOpen}
                tab={manageTab}
                onTabChange={setManageTab}
                onClose={manageModal.close}
                accounts={allAccounts}
                syncingSeqs={syncingSeqs}
                folders={allFolders}
                rules={rules}
                onAddAccount={() => accountForm.form.actions.openDialog(null)}
                onEditAccount={handleEditAccount}
                onDeleteAccount={handleDeleteAccount}
                onSyncAccount={(account) => void state.actions.syncNow(account.seq).then(() => requestMailRefresh())}
                onReorderAccounts={handleReorderAccounts}
                onFoldersChanged={refreshFolders}
                onAddRule={() => setRuleEditing({ rule: null, prefill: null })}
                onEditRule={(rule) => setRuleEditing({ rule, prefill: null })}
                onRulesChanged={refreshRules}
            />
            <MailAccountFormDialog controller={accountForm} />
            <MailHostedProfileDialog
                open={Boolean(hostedEditing)}
                account={hostedEditing}
                onClose={() => setHostedEditing(null)}
                onSaved={refreshAccounts}
            />
            <MailRuleFormDialog
                open={Boolean(ruleEditing)}
                rule={ruleEditing?.rule ?? null}
                prefill={ruleEditing?.prefill ?? null}
                folders={folders}
                onClose={() => setRuleEditing(null)}
                onSaved={refreshRules}
            />
        </>
    );
}
