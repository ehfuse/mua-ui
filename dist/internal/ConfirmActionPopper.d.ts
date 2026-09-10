/**
 * 공통 확인 UI 다 — 구현은 `@ehfuse/mui-confirm-action` 패키지가 갖는다.
 * 여기서는 mua-ui 의 모바일 판정(MuaConfig `isMobile` 우선)만 얹어 넘긴다.
 * (예전에는 www·taskbox·mua-ui 가 각자 사본을 들고 있어 수정이 한쪽에만 들어가는 일이 잦았다.)
 */
import type { ConfirmActionPopperProps } from "@ehfuse/mui-confirm-action";
export type { ConfirmActionPopperProps };
/** 확인 UI 를 mua-ui 의 모바일 판정으로 렌더링한다. */
export declare function ConfirmActionPopper(props: ConfirmActionPopperProps): import("react").JSX.Element;
