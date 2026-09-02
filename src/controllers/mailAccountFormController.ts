/**
 * 메일 계정 등록/수정 다이얼로그 컨트롤러 — useGlobalForm + useModal.
 */

import { useCallback, useState } from "react";
import { useGlobalForm, useModal, type ActionContext } from "@ehfuse/forma";
import { useMuaAccount } from "../MuaProvider";
import { ErrorAlert, SuccessAlert, WarningAlert } from "@ehfuse/alerts";
import { mailApi, unwrap } from "../apis/mailApi";
import type { MuaModalControl } from "../types/modal";
import { defaultMailAccountForm } from "../models/defaults";
import type { MailAccount, MailAccountForm, MailAccountRequest, MailConnectionTestResult } from "../models/types";

interface MailAccountFormControllerOptions {
    onSaved?: () => void; // 저장/삭제 후 콜백(목록 재조회)
}

/** 계정 행을 폼 값으로 변환한다(비밀번호는 openDialog 에서 secrets 조회로 채운다 — 빈값=유지). */
function toForm(account: MailAccount): MailAccountForm {
    return {
        ...defaultMailAccountForm,
        seq: account.seq,
        is_shared: account.scope === "shared",
        team_seq: Number(account.team_seq ?? 0) || 0,
        name: account.name ?? "",
        email: account.email ?? "",
        incoming_protocol: account.incoming_protocol,
        incoming_host: account.incoming_host ?? "",
        incoming_port: account.incoming_port || "",
        incoming_security: account.incoming_security,
        incoming_username: account.incoming_username ?? "",
        incoming_password: "",
        smtp_host: account.smtp_host ?? "",
        smtp_port: account.smtp_port || "",
        smtp_security: account.smtp_security,
        smtp_use_incoming_auth: account.smtp_use_incoming_auth !== false,
        smtp_username: account.smtp_username ?? "",
        smtp_password: "",
        enabled: account.enabled !== false,
        is_default: Boolean(account.is_default),
        pop3_delete_after_fetch: Boolean(account.pop3_delete_after_fetch),
        imap_mailbox: account.imap_mailbox || "INBOX",
        sync_interval_min: account.sync_interval_min || 5,
        signature: account.signature ?? "",
        has_incoming_password: Boolean(account.has_incoming_password),
        has_smtp_password: Boolean(account.has_smtp_password),
    };
}

/** 폼 값을 요청 본문으로 변환한다. */
export function toRequest(values: MailAccountForm): MailAccountRequest {
    // has_* 플래그는 화면 안내용이라 요청에 싣지 않는다.
    const {
        seq,
        is_shared,
        team_seq,
        has_incoming_password: _hasIncoming,
        has_smtp_password: _hasSmtp,
        incoming_port,
        smtp_port,
        ...rest
    } = values;
    return {
        ...rest,
        scope: is_shared ? "shared" : "personal",
        // 공용일 때만 팀을 싣는다(팀 선택 UI 는 팀 주입 앱에서만 그려진다 — 0 이면 서버가 현재 팀).
        ...(is_shared && team_seq > 0 ? { team_seq } : {}),
        ...(seq > 0 ? { seq } : {}),
        ...(incoming_port ? { incoming_port: Number(incoming_port) } : {}),
        ...(smtp_port ? { smtp_port: Number(smtp_port) } : {}),
    };
}

/** 필수값 검증 — 문제 있으면 메시지, 없으면 null. */
function validate(values: MailAccountForm): string | null {
    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
        return "메일 주소를 올바르게 입력하세요.";
    if (!values.incoming_host.trim()) return "수신 서버 호스트를 입력하세요.";
    if (!values.seq && !values.incoming_password) return "수신 서버 비밀번호를 입력하세요.";
    if (!values.smtp_host.trim()) return "SMTP 서버 호스트를 입력하세요.";
    if (!values.smtp_use_incoming_auth && !values.seq && !values.smtp_password) return "SMTP 비밀번호를 입력하세요.";
    return null;
}

/** 다이얼로그를 연다(account 지정 시 수정). 신규는 "보내는 사람 이름"을 로그인 계정 이름으로 미리 채운다. */
const openDialog =
    (modal: ReturnType<typeof useModal>, defaultSenderName: () => string) =>
    (
        context: ActionContext<MailAccountForm>,
        account?: MailAccount | null,
        prefill?: Partial<MailAccountForm>
    ): void => {
        context.reset();
        context.setValues(
            account ? toForm(account) : { ...defaultMailAccountForm, name: defaultSenderName(), ...(prefill ?? {}) }
        );
        modal.open();
        // 수정: 저장된 비밀번호를 받아 채운다(관리 가능한 사용자만 조회됨; 실패해도 빈값=기존 유지라 저장에는 지장 없음).
        if (account && account.can_manage) {
            const seq = account.seq;
            void mailApi
                .getAccountSecrets(seq)
                .then((res) => {
                    const secrets = unwrap(res, "");
                    if (context.getValue("seq") !== seq) return; // 그새 다른 계정/신규로 바뀌었으면 무시
                    context.setValues({
                        incoming_password: secrets.incoming_password ?? "",
                        smtp_password: secrets.smtp_password ?? "",
                    });
                })
                .catch(() => undefined);
        }
    };

/** 메일 계정 폼 컨트롤러 훅. */
export function useMailAccountFormController({ onSaved }: MailAccountFormControllerOptions = {}) {
    const modal: MuaModalControl = useModal({ modalId: "mail-account-form-dialog" });
    // 신규 계정의 보내는 사람 이름 기본값 = 로그인 계정 이름.
    const account = useMuaAccount();
    const defaultSenderName = () => String(account?.name ?? "").trim();
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<MailConnectionTestResult | null>(null);

    const form = useGlobalForm<MailAccountForm>({
        formId: "mail-account-form",
        initialValues: defaultMailAccountForm,
        onSubmit: async (values) => {
            const problem = validate(values);
            if (problem) {
                WarningAlert({ message: problem });
                return false;
            }
            try {
                const body = toRequest(values);
                if (values.seq > 0) {
                    unwrap(await mailApi.updateAccount(values.seq, body), "계정을 저장하지 못했습니다.");
                } else {
                    unwrap(await mailApi.createAccount(body), "계정을 등록하지 못했습니다.");
                }
                SuccessAlert("메일 계정을 저장했습니다.");
                modal.close();
                onSaved?.();
                return true;
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "계정을 저장하지 못했습니다." });
                return false;
            }
        },
        actions: { openDialog: openDialog(modal, defaultSenderName) },
    });

    /** 현재 폼 값으로 접속 테스트를 한다. */
    const testConnection = useCallback(async () => {
        const values = form.getFormValues();
        const problem = validate({
            ...values,
            incoming_password: values.incoming_password || (values.has_incoming_password ? "•" : ""),
            smtp_password: values.smtp_password || (values.has_smtp_password ? "•" : ""),
        });
        if (problem) {
            WarningAlert({ message: problem });
            return;
        }
        setTesting(true);
        setTestResult(null);
        try {
            const result = unwrap(await mailApi.testAccount(toRequest(values)), "접속 테스트에 실패했습니다.");
            setTestResult(result);
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "접속 테스트에 실패했습니다." });
        } finally {
            setTesting(false);
        }
    }, [form]);

    /** 계정을 삭제한다. */
    const removeAccount = useCallback(
        async (seq: number) => {
            try {
                unwrap(await mailApi.deleteAccount(seq), "계정을 삭제하지 못했습니다.");
                SuccessAlert("메일 계정을 삭제했습니다.");
                modal.close();
                onSaved?.();
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "계정을 삭제하지 못했습니다." });
            }
        },
        [modal, onSaved]
    );

    /** 테스트 결과를 지운다(닫을 때). */
    const clearTestResult = useCallback(() => setTestResult(null), []);

    return { form, modal, testing, testResult, testConnection, removeAccount, clearTestResult };
}

/** 컨트롤러 타입 */
export type MailAccountFormController = ReturnType<typeof useMailAccountFormController>;
