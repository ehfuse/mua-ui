import type { MuaModalControl } from "../types/modal";
import type { MailAccountForm, MailAccountRequest, MailConnectionTestResult } from "../models/types";
interface MailAccountFormControllerOptions {
    onSaved?: () => void;
}
/** 폼 값을 요청 본문으로 변환한다. shareScopeEnabled — 앱이 공개 범위 칸(renderShareScope)을 줬는가. */
export declare function toRequest(values: MailAccountForm, shareScopeEnabled?: boolean): MailAccountRequest;
/** 메일 계정 폼 컨트롤러 훅. */
export declare function useMailAccountFormController({ onSaved }?: MailAccountFormControllerOptions): {
    form: import("@ehfuse/forma").UseGlobalFormReturn<MailAccountForm>;
    modal: MuaModalControl;
    testing: boolean;
    testResult: MailConnectionTestResult | null;
    testConnection: () => Promise<void>;
    removeAccount: (seq: number) => Promise<void>;
    clearTestResult: () => void;
};
/** 컨트롤러 타입 */
export type MailAccountFormController = ReturnType<typeof useMailAccountFormController>;
export {};
