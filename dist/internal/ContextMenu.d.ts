/**
 * 우클릭(contextmenu) 메뉴 (코드샵 www components/ui/ContextMenu 복사본) — 기본 브라우저 컨텍스트메뉴 대신 백드롭 없는 Portal div 메뉴를 우클릭 위치에 띄운다.
 * MUI Menu(Modal/백드롭)는 클릭을 가로채 "메뉴 이동/좌클릭 닫힘"이 어긋나므로, 클릭 차단이 없는 Portal div 로 그린다.
 * 닫힘/위치이동은 document 리스너(contextmenu/pointerdown)가 처리한다.
 *
 * 사용:
 *   const ctx = useContextMenu<Row>();
 *   <tr onContextMenu={ctx.openHandler(row)} ... />
 *   <ContextMenu state={ctx} items={[{ label: "이용신청서", onClick: (row) => ... }]} />
 */
import { type MouseEvent, type ReactNode } from "react";
/** 우클릭 메뉴 위치/대상 상태다. */
export interface ContextMenuState<T> {
    /** 메뉴 anchor 좌표. null이면 닫힘. */
    anchor: {
        top: number;
        left: number;
    } | null;
    /** 우클릭한 대상 데이터. */
    target: T | null;
    /** 특정 대상으로 메뉴를 여는 onContextMenu 핸들러를 만든다. */
    openHandler: (target: T) => (event: MouseEvent) => void;
    /** 메뉴를 닫는다. */
    close: () => void;
}
/** 우클릭 메뉴 상태 훅이다. */
export declare function useContextMenu<T>(): ContextMenuState<T>;
/** 우클릭 메뉴 항목 정의다. */
export interface ContextMenuItem<T> {
    /** 라벨. target 기반 동적 라벨도 가능(예: 상태에 따라 "좋아요"/"좋아요 취소"). */
    label: string | ((target: T) => string);
    icon?: ReactNode;
    /** 항목 클릭 핸들러. 우클릭한 대상이 인자로 전달된다. */
    onClick: (target: T) => void;
    /** true면 비활성. (target 기반 동적 비활성도 가능) */
    disabled?: boolean | ((target: T) => boolean);
    /** true면 항목 자체를 숨긴다. (target 기반 동적 숨김도 가능) */
    hidden?: boolean | ((target: T) => boolean);
    /** 항목 위에 구분선을 둔다. */
    dividerBefore?: boolean;
    /** 하위 메뉴(호버/클릭 시 오른쪽으로 펼침). 있으면 onClick 은 쓰지 않는다. */
    children?: ContextMenuItem<T>[] | ((target: T) => ContextMenuItem<T>[]);
}
interface ContextMenuProps<T> {
    state: ContextMenuState<T>;
    items: ContextMenuItem<T>[];
}
/** 우클릭 메뉴를 렌더링한다(백드롭 없는 Portal div). */
export declare function ContextMenu<T>({ state, items }: ContextMenuProps<T>): import("react").ReactPortal | null;
export {};
