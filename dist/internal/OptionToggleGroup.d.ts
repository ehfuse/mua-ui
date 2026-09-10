import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";
/** (코드샵 www components/ui/OptionToggleGroup 복사본) 토글 옵션 한 개의 값 타입이다. */
export type ToggleOptionValue = string | number;
/** 토글 옵션 한 개 정의다. */
export interface ToggleOption<V extends ToggleOptionValue = string> {
    value: V;
    label: ReactNode;
    disabled?: boolean;
}
/** 단일 선택 모드 props다. */
interface SingleToggleProps<V extends ToggleOptionValue> {
    multiSelect?: false;
    value: V | null;
    onChange: (value: V | null) => void;
    allowDeselect?: boolean;
}
/** 다중 선택 모드 props다. */
interface MultiToggleProps<V extends ToggleOptionValue> {
    multiSelect: true;
    value: V[];
    onChange: (value: V[]) => void;
    allowDeselect?: never;
}
/** 공용 토글 그룹 props다. */
export type OptionToggleGroupProps<V extends ToggleOptionValue = string> = {
    options: ToggleOption<V>[];
    size?: "small" | "medium" | "large";
    disabled?: boolean;
    sx?: SxProps<Theme>;
} & (SingleToggleProps<V> | MultiToggleProps<V>);
/**
 * 선택 버튼은 테두리 없이 primary.main 배경, 미선택은 외곽선 + 단일 세로 구분선으로 표시하는 공용 토글 그룹이다.
 * 경계마다 구분선을 1줄(borderLeft)만 그려 인접선이 겹쳐 진하게 보이는 문제를 막는다.
 */
export declare function OptionToggleGroup<V extends ToggleOptionValue = string>(props: OptionToggleGroupProps<V>): import("react").JSX.Element;
export {};
