/**
 * 창 열림 상태(0.4.81, 업무함 2026-11-14) — 폰만 브라우저 기록을 쌓아 기기 뒤로가기로 닫고(useModal), 넓은 화면은 기록 없는 열림 상태다.
 *
 * useModal 은 열 때 기록 한 칸을 쌓고 닫을 때 history.back() 으로 닫는다. 넓은 화면에서는 기록이 한 칸만 어긋나도(새 창을 띄움 · 주소가 바뀜)
 * 닫기가 먹지 않았다 — 새 메일을 [새 창으로 열기] 로 옮겨도 원래 쓰기 창이 남았다. 돌려주는 꼴은 useModal 과 같다(MuaModalControl).
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useModal } from "@ehfuse/forma";
import type { MuaModalControl } from "../types/modal";
import { useIsMobile } from "./useIsMobile";

/**
 * 넓은 화면의 열림 상태는 창 이름(modalId)마다 한 벌을 모두가 함께 본다(0.4.89).
 * 0.4.81 에서 훅마다 따로 쥔 useState 로 바꿨더니, 메일 화면(Layout)의 컨트롤러가 연 쓰기 창을 실제로 그리는 MailManageHost 의
 * 컨트롤러는 몰라 목록 우클릭 · 머리 단추의 답장 · 전달 · 주소 눌러 새 메일이 아무 일도 안 했다(업무함 2026-11-18 사용자 지적).
 * useModal 은 modalId 로 상태를 나눠 썼던 것과 같은 동작이다.
 */
const openState = new Map<string, boolean>();
const listeners = new Map<string, Set<() => void>>();

function setOpenState(modalId: string, next: boolean | ((value: boolean) => boolean)): void {
    const prev = openState.get(modalId) ?? false;
    const value = typeof next === "function" ? next(prev) : next;
    if (value === prev) return;
    openState.set(modalId, value);
    listeners.get(modalId)?.forEach((listener) => listener());
}

export function useResponsiveMuaModal(modalId: string): MuaModalControl {
    const isMobile = useIsMobile();
    const byHistory: MuaModalControl = useModal({ modalId });
    const subscribe = useCallback(
        (listener: () => void) => {
            let set = listeners.get(modalId);
            if (!set) {
                set = new Set();
                listeners.set(modalId, set);
            }
            set.add(listener);
            return () => {
                set?.delete(listener);
            };
        },
        [modalId]
    );
    const isOpen = useSyncExternalStore(subscribe, () => openState.get(modalId) ?? false, () => false);
    const open = useCallback(() => setOpenState(modalId, true), [modalId]);
    const close = useCallback(() => setOpenState(modalId, false), [modalId]);
    const toggle = useCallback(() => setOpenState(modalId, (value) => !value), [modalId]);
    const plain = useMemo<MuaModalControl>(() => ({ isOpen, open, close, toggle, modalId }), [isOpen, open, close, toggle, modalId]);
    return isMobile ? byHistory : plain;
}
