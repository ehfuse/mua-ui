/**
 * 메일 작성 다이얼로그 컨트롤러 — 새 메일/답장/전체답장/전달/임시보관 열기, 발송, 임시저장.
 */
import type { MuaModalControl } from "../types/modal";
import type { ComposeForm, ComposeRequest } from "../models/types";
interface ComposeControllerOptions {
    onSent?: () => void;
    onDraftSaved?: () => void;
}
/** 폼 값을 요청 본문으로 변환한다. */
export declare function toComposeRequest(values: ComposeForm): ComposeRequest;
/** 메일 작성 컨트롤러 훅. */
export declare function useComposeController({ onSent, onDraftSaved }?: ComposeControllerOptions): {
    form: import("@ehfuse/forma").UseGlobalFormReturn<ComposeForm>;
    modal: MuaModalControl;
    sending: boolean;
    savingDraft: boolean;
    saveDraft: () => Promise<void>;
};
/** 컨트롤러 타입 */
export type ComposeController = ReturnType<typeof useComposeController>;
export {};
