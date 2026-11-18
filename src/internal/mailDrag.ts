/**
 * 메일 목록 줄을 끌어 앱 사이드바의 메일함 줄에 놓기(0.4.92).
 *
 * 넓은 화면 목록 표의 줄 앞 손잡이(VDT rowDrag)로 끈다. 놓을 자리(사이드바)는 메일 화면 바깥(앱 셸)이 그리므로,
 * 끄는 동안의 대상 메일 · 받을 수 있는 자리 · 놓았을 때 할 일을 여기 한 벌 쥐고 사이드바는 mailDropHandlers 만 단다.
 * 받을 수 있는 자리는 우클릭 "이동 ▸" 메뉴와 같은 목록(moveTargets)이다 — 끌기 때문에 규칙이 갈리지 않게 목록 화면이 그 목록을 넘긴다.
 * 중요편지함은 폴더가 아니라 별표 모아보기라, 놓으면 별표를 단다(우클릭 "별표" 와 같은 동작 · 같은 감춤 규칙).
 */
import type { DragEvent } from "react";
import type { MailMoveTarget } from "../models/types";

/** 메일 줄을 끌 때 싣는 값의 이름 — 남의 드래그(파일 · 다른 목록 줄)는 받지 않는다. */
export const MAIL_DRAG_TYPE = "application/x-mua-mail";

/** 놓을 수 있는 사이드바 자리 — 이동 대상(받은편지함 · 스팸 · 휴지통 · 사용자 메일함) 또는 중요편지함(별표 달기). */
export type MailDropTarget = MailMoveTarget | { folder: "starred" };

/** 끄는 동안 사이드바 줄에 다는 표시 — 소비처가 이 속성에 테두리를 건다(`&[data-mail-drop-over]`). */
export const MAIL_DROP_OVER_ATTR = "data-mail-drop-over";

interface ActiveMailDrag {
    accepts: (target: MailDropTarget) => boolean;
    drop: (seqs: number[], target: MailDropTarget) => void;
}

let active: ActiveMailDrag | null = null;

/** 목록 화면이 끌기를 시작할 때(rowDrag.onStart) 부른다. */
export function beginMailDrag(drag: ActiveMailDrag): void {
    active = drag;
}

/** 끌기가 끝나면(rowDrag.onEnd — 놓았든 그만뒀든) 부른다. 남은 표시도 지운다. */
export function endMailDrag(): void {
    active = null;
    if (typeof document !== "undefined")
        document.querySelectorAll(`[${MAIL_DROP_OVER_ATTR}]`).forEach((el) => el.removeAttribute(MAIL_DROP_OVER_ATTR));
}

const sameTarget = (a: MailDropTarget, b: MailDropTarget) =>
    a.folder === b.folder && (a.folder !== "custom" || (b.folder === "custom" && a.mail_folder_seq === b.mail_folder_seq));

/** 이동 대상 목록으로 받을 자리를 정한다 — 목록에 있는 자리만, 중요편지함은 starAllowed 일 때만. */
export function mailDropAccepts(moveTargets: MailMoveTarget[], starAllowed: boolean): (target: MailDropTarget) => boolean {
    return (target) => (target.folder === "starred" ? starAllowed : moveTargets.some((item) => sameTarget(item, target)));
}

const acceptsEvent = (event: DragEvent<HTMLElement>, target: MailDropTarget) =>
    Boolean(active) && Array.from(event.dataTransfer.types).includes(MAIL_DRAG_TYPE) && Boolean(active?.accepts(target));

/**
 * 사이드바 줄에 다는 끌어 놓기 처리 — 받을 수 없는 끌기는 그냥 흘린다(브라우저 기본 = 놓기 금지).
 * 받는 동안 줄에 MAIL_DROP_OVER_ATTR 를 단다.
 */
export function mailDropHandlers(target: MailDropTarget) {
    return {
        onDragOver: (event: DragEvent<HTMLElement>) => {
            if (!acceptsEvent(event, target)) return;
            // dragover 에서 preventDefault 를 불러야 놓기가 열린다.
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            event.currentTarget.setAttribute(MAIL_DROP_OVER_ATTR, "");
        },
        onDragLeave: (event: DragEvent<HTMLElement>) => {
            // 줄 안의 아이콘 · 글자 사이를 오갈 때는 끄지 않는다(깜빡인다) — 줄 밖으로 나갔을 때만.
            // 크롬은 끌기 중 dragleave 의 relatedTarget 을 비워 보낼 때가 있어 포인터 자리로도 본다.
            const el = event.currentTarget;
            const next = event.relatedTarget as Node | null;
            if (next && el.contains(next)) return;
            const r = el.getBoundingClientRect();
            if (!next && event.clientX > r.left && event.clientX < r.right && event.clientY > r.top && event.clientY < r.bottom) return;
            el.removeAttribute(MAIL_DROP_OVER_ATTR);
        },
        onDrop: (event: DragEvent<HTMLElement>) => {
            event.currentTarget.removeAttribute(MAIL_DROP_OVER_ATTR);
            if (!acceptsEvent(event, target)) return;
            event.preventDefault();
            // 체크한 줄을 끌면 체크한 줄 모두 — 표가 "1,2,3" 으로 잇는다.
            const seqs = event.dataTransfer
                .getData(MAIL_DRAG_TYPE)
                .split(",")
                .map((value) => Number(value) || 0)
                .filter(Boolean);
            const drag = active;
            if (seqs.length && drag) drag.drop([...new Set(seqs)], target);
        },
    };
}
