/**
 * 창 열림 상태(0.4.81, 업무함 2026-11-14) — 폰만 브라우저 기록을 쌓아 기기 뒤로가기로 닫고(useModal), 넓은 화면은 기록 없는 열림 상태다.
 *
 * useModal 은 열 때 기록 한 칸을 쌓고 닫을 때 history.back() 으로 닫는다. 넓은 화면에서는 기록이 한 칸만 어긋나도(새 창을 띄움 · 주소가 바뀜)
 * 닫기가 먹지 않았다 — 새 메일을 [새 창으로 열기] 로 옮겨도 원래 쓰기 창이 남았다. 돌려주는 꼴은 useModal 과 같다(MuaModalControl).
 */
import { useCallback, useMemo, useState } from "react";
import { useModal } from "@ehfuse/forma";
import type { MuaModalControl } from "../types/modal";
import { useIsMobile } from "./useIsMobile";

export function useResponsiveMuaModal(modalId: string): MuaModalControl {
    const isMobile = useIsMobile();
    const byHistory: MuaModalControl = useModal({ modalId });
    const [isOpen, setIsOpen] = useState(false);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((value) => !value), []);
    const plain = useMemo<MuaModalControl>(() => ({ isOpen, open, close, toggle, modalId }), [isOpen, open, close, toggle, modalId]);
    return isMobile ? byHistory : plain;
}
