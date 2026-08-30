/**
 * 다이얼로그를 기기(브라우저) 뒤로가기로 닫히게 해주는 훅(www hooks/useDialogBackClose 사본).
 *
 * mfd FormDialog 는 히스토리를 건드리지 않아, 열림 상태를 자체 state 로만 관리하는 다이얼로그는 뒤로가기가
 * 다이얼로그가 아니라 라우트를 되돌린다. forma useModal 은 열 때 히스토리를 한 칸 쌓고 popstate 를 가로채
 * 그 모달만 닫는다 — 이 훅은 그 장치를 "이미 있는 열림 상태"에 얹는다(표시 여부의 원본은 소비처가 계속 소유).
 *
 * ⚠️ modalId 는 동시에 마운트되는 인스턴스마다 달라야 한다. 인스턴스가 여러 개면 생략(자동 id)한다.
 */

import { useCallback, useEffect, useRef } from "react";
import { useModal } from "@ehfuse/forma";
import type { MuaModalControl } from "../types/modal";

/** 뒤로가기 닫기 훅 옵션 */
export interface DialogBackCloseOptions {
    open: boolean; // 현재 열림 여부
    onClose: () => void; // 닫아야 할 때(뒤로가기·requestClose 공통) — 열림 상태를 내리면 된다
    modalId?: string; // 모달 식별자(생략하면 인스턴스별 자동 생성)
}

/** 뒤로가기 닫기 훅 반환값 */
export interface DialogBackCloseControl {
    requestClose: () => void; // ← 버튼/취소/백드롭 닫기에 연결(쌓아둔 히스토리 칸을 back 으로 소비)
}

/** 다이얼로그를 기기 뒤로가기로 닫을 수 있게 forma 모달 히스토리에 등록한다. */
export function useDialogBackClose({ open, onClose, modalId }: DialogBackCloseOptions): DialogBackCloseControl {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    // 뒤로가기(popstate)로 모달이 닫히면 forma 가 onClose 를 불러준다 — 소비처의 열림 상태를 내린다.
    const modal: MuaModalControl = useModal({ modalId, onClose: () => onCloseRef.current() });
    const modalRef = useRef(modal);
    modalRef.current = modal;
    // 열림/닫힘 전이에서만 히스토리 칸을 맞춘다.
    const hadBackEntryRef = useRef(false);
    useEffect(() => {
        if (open && !hadBackEntryRef.current) {
            modalRef.current.open();
        } else if (!open && hadBackEntryRef.current && modalRef.current.isOpen) {
            // 뒤로가기가 아닌 경로(저장 등)로 닫혔으면 쌓아둔 칸도 되돌린다.
            modalRef.current.close();
        }
        hadBackEntryRef.current = open;
    }, [open]);
    const requestClose = useCallback(() => {
        if (modalRef.current.isOpen) {
            modalRef.current.close();
            return;
        }
        onCloseRef.current();
    }, []);
    return { requestClose };
}
