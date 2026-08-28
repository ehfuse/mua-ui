import type { ReactNode } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

/** (코드샵 www components/ui/OptionToggleGroup 복사본) 토글 옵션 한 개의 값 타입이다. */
export type ToggleOptionValue = string | number;

/** 토글 옵션 한 개 정의다. */
export interface ToggleOption<V extends ToggleOptionValue = string> {
    value: V; // 옵션 값
    label: ReactNode; // 화면 표시(텍스트 또는 ReactNode)
    disabled?: boolean; // 개별 옵션 비활성화 여부
}

/** 단일 선택 모드 props다. */
interface SingleToggleProps<V extends ToggleOptionValue> {
    multiSelect?: false; // 단일 선택
    value: V | null; // 선택 값
    onChange: (value: V | null) => void; // 선택 변경 콜백
    allowDeselect?: boolean; // 같은 버튼 재클릭 시 선택 해제 허용 여부 (기본 false)
}

/** 다중 선택 모드 props다. */
interface MultiToggleProps<V extends ToggleOptionValue> {
    multiSelect: true; // 다중 선택
    value: V[]; // 선택 값 배열
    onChange: (value: V[]) => void; // 선택 변경 콜백
    allowDeselect?: never; // 다중 모드에서는 사용하지 않음
}

/** 공용 토글 그룹 props다. */
export type OptionToggleGroupProps<V extends ToggleOptionValue = string> = {
    options: ToggleOption<V>[]; // 옵션 목록
    size?: "small" | "medium" | "large"; // 버튼 크기
    disabled?: boolean; // 전체 비활성화
    sx?: SxProps<Theme>; // 추가 스타일 (내장 스타일 위에 병합)
} & (SingleToggleProps<V> | MultiToggleProps<V>);

/**
 * 선택 버튼은 테두리 없이 primary.main 배경, 미선택은 외곽선 + 단일 세로 구분선으로 표시하는 공용 토글 그룹이다.
 * 경계마다 구분선을 1줄(borderLeft)만 그려 인접선이 겹쳐 진하게 보이는 문제를 막는다.
 */
export function OptionToggleGroup<V extends ToggleOptionValue = string>(props: OptionToggleGroupProps<V>) {
    const { options, size = "small", disabled, sx } = props;
    const multiSelect = props.multiSelect === true;
    const allowDeselect = !multiSelect && props.allowDeselect === true;

    /** ToggleButtonGroup 의 onChange 를 모드에 맞게 위임한다. */
    const handleChange = (_event: React.MouseEvent<HTMLElement>, nextValue: unknown) => {
        if (multiSelect) {
            (props.onChange as (value: V[]) => void)((nextValue as V[]) ?? []);
            return;
        }

        // 단일 모드: 같은 버튼 재클릭이면 nextValue 가 null 이 된다.
        if (nextValue === null && !allowDeselect) {
            return;
        }

        (props.onChange as (value: V | null) => void)(nextValue as V | null);
    };

    return (
        <ToggleButtonGroup
            size={size}
            exclusive={!multiSelect}
            disabled={disabled}
            value={props.value}
            onChange={handleChange}
            sx={[
                {
                    // 외곽선은 그룹에 한 번만 그린다. (버튼별 테두리는 없앤다)
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    "& .MuiToggleButtonGroup-grouped": {
                        px: 2.5,
                        border: "none",
                        borderRadius: 0,
                        margin: 0,
                    },
                    // 버튼 사이 세로 구분선은 borderLeft 하나로만 그린다. (경계당 1줄 → 겹침 없음)
                    "& .MuiToggleButtonGroup-grouped:not(:first-of-type)": {
                        borderLeft: "1px solid",
                        borderLeftColor: "divider",
                    },
                    // 선택 버튼: 배경 primary.main, 좌측 구분선은 투명 처리(1px 폭 유지 → 사이즈 흔들림 방지).
                    "& .MuiToggleButton-root.Mui-selected": {
                        borderLeftColor: "transparent",
                        backgroundColor: "primary.main",
                        color: "primary.contrastText",
                        "&:hover": {
                            backgroundColor: "primary.dark",
                        },
                    },
                    // 선택 버튼 오른쪽 인접 버튼의 좌측 구분선도 투명 처리(1px 폭 유지).
                    "& .Mui-selected + .MuiToggleButton-root": {
                        borderLeftColor: "transparent",
                    },
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            {options.map((option) => (
                <ToggleButton key={String(option.value)} value={option.value} disabled={option.disabled}>
                    {option.label}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}
