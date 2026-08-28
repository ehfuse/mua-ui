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

import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Box, Divider } from "@mui/material";

/** 우클릭 메뉴 위치/대상 상태다. */
export interface ContextMenuState<T> {
    /** 메뉴 anchor 좌표. null이면 닫힘. */
    anchor: { top: number; left: number } | null;
    /** 우클릭한 대상 데이터. */
    target: T | null;
    /** 특정 대상으로 메뉴를 여는 onContextMenu 핸들러를 만든다. */
    openHandler: (target: T) => (event: MouseEvent) => void;
    /** 메뉴를 닫는다. */
    close: () => void;
}

/** 우클릭 메뉴 상태 훅이다. */
export function useContextMenu<T>(): ContextMenuState<T> {
    const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
    const [target, setTarget] = useState<T | null>(null);

    const openHandler = useCallback(
        (item: T) => (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            setTarget(item);
            setAnchor({ top: event.clientY, left: event.clientX });
        },
        []
    );

    const close = useCallback(() => {
        setAnchor(null);
        setTarget(null);
    }, []);

    return { anchor, target, openHandler, close };
}

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
export function ContextMenu<T>({ state, items }: ContextMenuProps<T>) {
    const { anchor, target, close } = state;

    // 메뉴가 열린 동안: 빈 곳/메뉴 밖 우클릭/좌클릭이면 닫는다(메뉴 위 우클릭은 무시).
    useEffect(() => {
        if (!anchor) return;
        const onContext = (e: globalThis.MouseEvent) => {
            const onMenu = (e.target as HTMLElement | null)?.closest?.("[data-context-menu]");
            if (onMenu) return;
            // 우클릭한 곳에 행/카드가 있으면 그 onContextMenu 가 새 위치로 다시 연다(여기선 닫지 않음).
            // 위임 테이블/카드의 onContextMenu 가 처리하지 못하는 빈 곳만 닫는다.
        };
        const onPointerDown = (e: globalThis.MouseEvent) => {
            const onMenu = (e.target as HTMLElement | null)?.closest?.("[data-context-menu]");
            if (!onMenu) close();
        };
        const id = window.setTimeout(() => {
            document.addEventListener("contextmenu", onContext, true);
            document.addEventListener("pointerdown", onPointerDown, true);
        }, 0);
        return () => {
            window.clearTimeout(id);
            document.removeEventListener("contextmenu", onContext, true);
            document.removeEventListener("pointerdown", onPointerDown, true);
        };
    }, [anchor, close]);

    if (!anchor) return null;

    // hidden 항목(고정/동적)은 제외하고 렌더한다.
    const visibleItems = items.filter((item) =>
        typeof item.hidden === "function" ? !(target !== null && item.hidden(target)) : !item.hidden
    );

    // 메뉴 예상 높이(항목 + 구분선 + 여백)를 가늠해, 클릭 지점이 화면 아래쪽이면 위로 펼친다.
    const dividerCount = visibleItems.filter((item, index) => item.dividerBefore && index > 0).length;
    const estimatedHeight = visibleItems.length * 42 + dividerCount * 9 + 8;
    const estimatedWidth = 200;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : Number.POSITIVE_INFINITY;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : Number.POSITIVE_INFINITY;
    const openUpward = anchor.top + estimatedHeight > viewportHeight;
    const openLeftward = anchor.left + estimatedWidth > viewportWidth;
    const translateY = openUpward ? "-100%" : "0";
    const translateX = openLeftward ? "-100%" : "0";

    return createPortal(
        <Box
            data-context-menu
            sx={{
                position: "fixed",
                top: anchor.top,
                left: anchor.left,
                // 화면을 벗어나면 위/왼쪽으로 펼쳐 잘리지 않게 한다.
                transform: `translate(${translateX}, ${translateY})`,
                zIndex: 1400,
                minWidth: 160,
                py: 0.5,
                bgcolor: "#ffffff",
                borderRadius: 1,
                border: "1px solid #e5e7eb",
                boxShadow: "0 16px 34px rgba(15, 23, 42, 0.18)",
                // 우클릭 메뉴 항목 텍스트는 선택되지 않게 한다.
                userSelect: "none",
            }}
        >
            {visibleItems.map((item, index) => (
                <ContextMenuRow key={index} item={item} index={index} target={target} close={close} />
            ))}
        </Box>,
        document.body
    );
}

/** 메뉴 한 줄(하위 메뉴가 있으면 호버 시 오른쪽에 펼친다). */
function ContextMenuRow<T>({
    item,
    index,
    target,
    close,
}: {
    item: ContextMenuItem<T>;
    index: number;
    target: T | null;
    close: () => void;
}) {
    const [open, setOpen] = useState(false);
    const disabled =
        typeof item.disabled === "function" ? target !== null && item.disabled(target) : Boolean(item.disabled);
    const label = typeof item.label === "function" ? (target !== null ? item.label(target) : "") : item.label;
    const children =
        typeof item.children === "function" ? (target !== null ? item.children(target) : []) : (item.children ?? null);
    const hasChildren = Array.isArray(children) && children.length > 0;
    const visibleChildren = hasChildren
        ? children.filter((c) => (typeof c.hidden === "function" ? !(target !== null && c.hidden(target)) : !c.hidden))
        : [];
    return (
        <Box
            onMouseEnter={() => hasChildren && setOpen(true)}
            onMouseLeave={() => hasChildren && setOpen(false)}
            sx={{ position: "relative" }}
        >
            {item.dividerBefore && index > 0 ? <Divider sx={{ my: 0.5 }} /> : null}
            <Box
                onClick={() => {
                    if (disabled) return;
                    if (hasChildren) {
                        setOpen((v) => !v);
                        return;
                    }
                    if (target !== null) item.onClick(target);
                    close();
                }}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1,
                    fontSize: 15,
                    color: disabled ? "text.disabled" : "#0f172a",
                    cursor: disabled ? "default" : "pointer",
                    "&:hover": disabled ? undefined : { bgcolor: "#f1f5f9" },
                    "& .MuiSvgIcon-root": { fontSize: 20 },
                }}
            >
                {item.icon}
                <Box component="span" sx={{ flex: 1, whiteSpace: "nowrap" }}>
                    {label}
                </Box>
                {hasChildren ? (
                    <Box component="span" sx={{ ml: 2, color: "#64748b", fontSize: 13 }}>
                        ▶
                    </Box>
                ) : null}
            </Box>
            {hasChildren && open ? (
                <Box
                    data-context-menu
                    sx={{
                        position: "absolute",
                        top: -4,
                        left: "100%",
                        minWidth: 180,
                        maxHeight: 320,
                        overflowY: "auto",
                        py: 0.5,
                        bgcolor: "#ffffff",
                        borderRadius: 1,
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 16px 34px rgba(15, 23, 42, 0.18)",
                        zIndex: 1401,
                    }}
                >
                    {visibleChildren.length === 0 ? (
                        <Box sx={{ px: 2, py: 1, fontSize: 15, color: "text.disabled" }}>없음</Box>
                    ) : (
                        visibleChildren.map((child, childIndex) => {
                            const childDisabled =
                                typeof child.disabled === "function"
                                    ? target !== null && child.disabled(target)
                                    : Boolean(child.disabled);
                            const childLabel =
                                typeof child.label === "function"
                                    ? target !== null
                                        ? child.label(target)
                                        : ""
                                    : child.label;
                            return (
                                <Box key={childIndex}>
                                    {child.dividerBefore && childIndex > 0 ? <Divider sx={{ my: 0.5 }} /> : null}
                                    <Box
                                        onClick={() => {
                                            if (childDisabled) return;
                                            if (target !== null) child.onClick(target);
                                            close();
                                        }}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            px: 2,
                                            py: 1,
                                            fontSize: 15,
                                            whiteSpace: "nowrap",
                                            color: childDisabled ? "text.disabled" : "#0f172a",
                                            cursor: childDisabled ? "default" : "pointer",
                                            "&:hover": childDisabled ? undefined : { bgcolor: "#f1f5f9" },
                                            "& .MuiSvgIcon-root": { fontSize: 20 },
                                        }}
                                    >
                                        {child.icon}
                                        {childLabel}
                                    </Box>
                                </Box>
                            );
                        })
                    )}
                </Box>
            ) : null}
        </Box>
    );
}
