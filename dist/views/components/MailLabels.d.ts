/**
 * 색상 라벨 화면 조각(0.3.158) — 칩 · 색 점 · 고정 색 견본 · 라벨 고르기 메뉴.
 * config.labels 를 켠 앱에서만 그려진다(서버에 라벨 API 가 있어야 한다).
 */
import type { MailLabel } from "../../models/types";
/**
 * 고르는 색 9가지 — 사람마다 아무 색이나 고르게 두면 칩 글자가 안 읽히는 색(연노랑 바탕에 흰 글자 등)이 생긴다.
 * 칩은 색 바탕 + 흰 글자라 흰 글자가 읽히는 진한 쪽만 둔다(노랑도 갈색에 가까운 진한 노랑).
 */
export declare const LABEL_COLORS: {
    color: string;
    name: string;
}[];
/** 바탕색에 올릴 글자색 — 밝은 바탕(서버에 견본 밖 색이 들어온 경우)이면 진한 글자. */
export declare function labelTextColor(hex: string): string;
/** 라벨 색(빈 값이면 회색) */
export declare const labelColor: (label: Pick<MailLabel, "color">) => string;
/** 라벨 칩 — 목록 행의 제목 앞(지메일처럼 색 바탕 · 이름). 글자는 앱 규칙(14px 이상)에 맞춰 14px. */
export declare function MailLabelChip({ label, maxWidth }: {
    label: MailLabel;
    maxWidth?: number;
}): import("react").JSX.Element;
/** 메일 한 통의 라벨 칩들 — label_seqs 가운데 지금 있는 라벨만, 라벨 순서대로. */
export declare function MailLabelChips({ seqs, labels, maxWidth, }: {
    seqs: number[] | undefined;
    labels: MailLabel[];
    maxWidth?: number;
}): import("react").JSX.Element | null;
/** 라벨 색 점(탭 · 메뉴 · 관리 목록) */
export declare function MailLabelDot({ color, size }: {
    color: string;
    size?: number;
}): import("react").JSX.Element;
/** 고른 메일들이 그 라벨을 달고 있는 정도 — 모두 · 일부 · 없음 */
export type LabelCheckState = "all" | "some" | "none";
/** 고른 메일들(label_seqs)에서 라벨마다 체크 상태를 낸다. */
export declare function labelCheckStates(rows: {
    label_seqs?: number[];
}[], labels: MailLabel[]): Map<number, LabelCheckState>;
/** 체크 상태 아이콘(라벨 색으로 칠한다) */
export declare function LabelCheckIcon({ state, color }: {
    state: LabelCheckState;
    color: string;
}): import("react").JSX.Element;
/**
 * 라벨 고르기 메뉴(머리 툴바 [라벨]) — 내 라벨마다 체크(고른 메일이 모두 달았으면 체크, 일부면 반쯤).
 * 누르면 바로 달거나 뗀다(모두 달린 것 = 떼기, 그 밖 = 모두에게 달기). 메뉴는 열어 둔 채라 여러 개를 이어 고른다.
 * 맨 아래 "새 라벨 만들기"(만들면 고른 메일에 바로 단다) · "라벨 관리".
 * 애니메이션은 없다(transitionDuration 0) — 누른 자리에서 메뉴가 늦게 따라오는 것처럼 보인다(앱 공통 규칙).
 */
export declare function MailLabelMenu({ anchorEl, onClose, labels, states, onToggle, onCreate, onManage, }: {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    labels: MailLabel[];
    states: Map<number, LabelCheckState>;
    onToggle: (label: MailLabel, add: boolean) => void;
    onCreate: () => void;
    onManage?: () => void;
}): import("react").JSX.Element;
