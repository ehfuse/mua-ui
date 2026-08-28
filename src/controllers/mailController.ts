/**
 * 메일 화면 컨트롤러 — 전역 상태 + 액션 조립.
 */

import { useGlobalFormaState } from "@ehfuse/forma";
import { defaultMailState } from "../models/defaults";
import type { MailState } from "../models/types";
import * as Actions from "./mailActions";

/** 메일 상태 id */
export const MAIL_STATE_ID = "mail-state";

/** 메일 화면 컨트롤러 훅. */
export function useMailController() {
    const state = useGlobalFormaState<MailState>({
        stateId: MAIL_STATE_ID,
        initialValues: defaultMailState,
        autoCleanup: false,
        actions: {
            loadAccounts: Actions.loadAccounts(),
            setFilters: Actions.setFilters(),
            loadMessages: Actions.loadMessages(),
            loadCounts: Actions.loadCounts(),
            selectMessage: Actions.selectMessage(),
            clearSelection: Actions.clearSelection(),
            applyMessageAction: Actions.applyMessageAction(),
            syncNow: Actions.syncNow(),
        },
    });
    return { state };
}

/** 컨트롤러 타입 */
export type MailController = ReturnType<typeof useMailController>;
