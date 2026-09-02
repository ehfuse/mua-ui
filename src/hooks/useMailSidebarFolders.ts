/**
 * 사이드바용 사용자 메일함 로더 — 전역 mail-state 의 folders(+미읽음 수)를 채운다(메일 화면과 공유, 메일함 관리 후 갱신).
 * realtime(mua.mail.changed) 수신 시 다시 읽어 배지를 맞춘다.
 */

import { useCallback, useEffect, useRef } from "react";
import { useGlobalFormaState } from "@ehfuse/forma";
import { mailApi, unwrap } from "../apis/mailApi";
import { useMailRealtime } from "../apis/useMailRealtime";
import { MAIL_STATE_ID } from "../controllers/mailController";
import { defaultMailState } from "../models/defaults";
import type { MailState, MailUserFolder } from "../models/types";

/** 로그인 상태일 때 사용자 메일함 목록을 1회 로드한다(메일 화면이 갱신하면 그대로 반영된다). */
export function useMailSidebarFolders(enabled: boolean): MailUserFolder[] {
    const state = useGlobalFormaState<MailState>({
        stateId: MAIL_STATE_ID,
        initialValues: defaultMailState,
        autoCleanup: false,
    });
    const rows = (state.useValue("folders") as MailUserFolder[] | undefined) ?? [];
    // 보기 범위(현재 팀, 전체 보기면 내 모든 팀) 것만 — 관리 다이얼로그용 전체 목록에서 거른다(2026-09-03).
    const folders = rows.filter((f) => f.in_sidebar !== false);
    const loadedRef = useRef(false);
    const load = useCallback(async () => {
        try {
            const data = unwrap(await mailApi.listFolders(), "");
            state.setValue("folders", Array.isArray(data.items) ? data.items : []);
        } catch {
            // 보조 정보 — 조용히
        }
    }, [state]);
    useEffect(() => {
        if (!enabled) {
            loadedRef.current = false;
            return;
        }
        if (loadedRef.current) return;
        loadedRef.current = true;
        void load();
    }, [enabled, load]);
    useMailRealtime({ enabled, onEvent: () => void load() });

    return folders;
}
