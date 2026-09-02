/**
 * 사이드바용 메일 계정 로더 — 셸(코드마켓 Layout/Sidebar)에서 메일 계정 목록(+미읽음)을 전역 mail-state 에 채운다.
 *
 * 메일 화면 컨트롤러(useMailController)와 같은 stateId 를 쓰므로 메일 화면이 갱신하는 미읽음 수가
 * 사이드바 배지에 그대로 반영되고, 반대로 사이드바가 먼저 채운 계정 목록을 메일 화면이 이어받는다.
 * realtime(mua.mail.changed) 수신 시 조용히 다시 읽어 배지를 맞춘다.
 */

import { useCallback, useEffect, useRef } from "react";
import { useGlobalFormaState } from "@ehfuse/forma";
import { mailApi, unwrap } from "../apis/mailApi";
import { useMailRealtime } from "../apis/useMailRealtime";
import { subscribeMailTeamContext } from "../internal/teamContext";
import { MAIL_STATE_ID } from "../controllers/mailController";
import { defaultMailState } from "../models/defaults";
import type { MailAccount, MailState } from "../models/types";

/** 로그인 상태일 때 메일 계정 목록을 1회 로드하고 realtime 으로 갱신한다. */
export function useMailSidebarAccounts(enabled: boolean): MailAccount[] {
    const state = useGlobalFormaState<MailState>({
        stateId: MAIL_STATE_ID,
        initialValues: defaultMailState,
        autoCleanup: false,
    });
    const rows = (state.useValue("accounts") as MailAccount[] | undefined) ?? [];
    // 보기 범위(현재 팀, 전체 보기면 내 모든 팀) 것만 — 관리 다이얼로그용 전체 목록에서 거른다(2026-09-03).
    const accounts = rows.filter((a) => a.in_sidebar !== false);
    const loadedRef = useRef(false);

    /** 계정 목록을 읽어 전역 상태에 넣는다(실패는 조용히 — 배지는 보조 정보). */
    const load = useCallback(async () => {
        try {
            const data = unwrap(await mailApi.listAccounts(), "");
            state.setValue("accounts", Array.isArray(data.items) ? data.items : []);
        } catch {
            // 비로그인/네트워크 오류 — 다음 realtime 이나 메일 화면 진입 때 다시 읽는다.
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
    // 팀 전환/전체 보기 토글 — in_sidebar 가 조회 시점 기준이라 다시 읽어야 목록이 맞는다(2026-09-03).
    useEffect(() => {
        if (!enabled) return;
        return subscribeMailTeamContext(() => void load());
    }, [enabled, load]);

    return accounts;
}
