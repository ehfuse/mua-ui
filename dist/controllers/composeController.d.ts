import type { MuaModalControl } from "../types/modal";
import type { ComposeForm, ComposeRequest } from "../models/types";
interface ComposeControllerOptions {
    onSent?: () => void;
    onDraftSaved?: () => void;
}
/**
 * 본문에서 서명을 꺼낸다(config.signatureBelowEditor) — 서명 칸에 따로 두고 보낼 때 다시 넣으려고.
 * 서명 뒤에 인용문(blockquote)이 있으면 답장 · 전달이라 그 앞에 다시 넣을 자리로 기억한다. 서명이 없으면 끝에 넣을 빈 서명.
 */
export declare function extractSignature(bodyHtml: string): {
    body: string;
    signature: string;
    place: "end" | "before_quote";
};
/** 폼 값을 요청 본문으로 변환한다. 수신확인·보안메일은 보낼 때만 싣는다(임시저장은 내용만 둔다). */
export declare function toComposeRequest(values: ComposeForm, forSend?: boolean): ComposeRequest;
/** 메일 작성 컨트롤러 훅. */
export declare function useComposeController({ onSent, onDraftSaved }?: ComposeControllerOptions): {
    form: import("@ehfuse/forma").UseGlobalFormReturn<ComposeForm>;
    modal: MuaModalControl;
    sending: boolean;
    savingDraft: boolean;
    saveDraft: (options?: {
        silent?: boolean;
    }) => Promise<boolean>;
    sentRef: import("react").RefObject<boolean>;
};
/** 컨트롤러 타입 */
export type ComposeController = ReturnType<typeof useComposeController>;
export {};
