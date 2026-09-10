/**
 * 메일 목록 헤더 설정(useHeaderConfig) — 검색(300ms 디바운스) + 검색칸 오른쪽 "안 읽은 메일만" 스위치(filter custom — 계정은 사이드바 계정별 받은편지함이 고른다) + 좌/우 슬롯.
 */
import type { ReactElement, ReactNode } from "react";
import type { ListLayoutProps } from "@ehfuse/mui-dashboard-layout";
import type { MailController } from "../controllers/mailController";
interface HeaderConfigProps {
    controller: MailController;
    left?: ReactElement;
    right?: ReactElement;
    toolbar?: ReactNode;
    isMobile?: boolean;
}
/** 메일 헤더 설정을 반환한다. */
export declare function useHeaderConfig({ controller, left, right, toolbar, isMobile, }: HeaderConfigProps): NonNullable<ListLayoutProps["header"]>;
export {};
