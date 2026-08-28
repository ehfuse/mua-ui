/**
 * 메일 작성 다이얼로그 컨트롤러 — 새 메일/답장/전체답장/전달/임시보관 열기, 발송, 임시저장.
 */

import { useCallback, useState } from "react";
import { useGlobalForm, useModal, type ActionContext } from "@ehfuse/forma";
import { ErrorAlert, SuccessAlert, WarningAlert } from "@ehfuse/alerts";
import { mailApi, unwrap } from "../apis/mailApi";
import type { MuaModalControl } from "../types/modal";
import { defaultComposeForm } from "../models/defaults";
import type { ComposeForm, ComposeMode, ComposeRequest, MailAccount, MailMessageDetail } from "../models/types";
import { formatAddressLabel, splitAddressInput } from "../utils/format";
import { buildQuotedBody, prefixSubject } from "../utils/html";

interface ComposeControllerOptions {
    onSent?: () => void; // 발송 후(보낸편지함/임시보관 재조회)
    onDraftSaved?: () => void; // 임시저장 후
}

/** 서명 블록을 본문 끝에 붙일 HTML 로 만든다. */
function signatureBlock(account: MailAccount | undefined): string {
    const sig = String(account?.signature ?? "").trim();
    return sig ? `<p><br></p><div class="mail-signature">${sig}</div>` : "";
}

/** 폼 값을 요청 본문으로 변환한다. */
export function toComposeRequest(values: ComposeForm): ComposeRequest {
    return {
        mail_account_seq: values.mail_account_seq,
        ...(values.seq > 0 ? { seq: values.seq } : {}),
        to: splitAddressInput(values.to),
        cc: splitAddressInput(values.cc),
        bcc: splitAddressInput(values.bcc),
        subject: values.subject,
        body_html: values.body_html,
        attachments: values.attachments.map((a) => ({
            uuid: a.uuid,
            name: a.name,
            mime: a.mime,
            content_base64: a.content_base64,
        })),
        in_reply_to: values.in_reply_to || null,
        references: values.references,
    };
}

/** 새 메일 작성 열기 */
const openNew =
    (modal: ReturnType<typeof useModal>) =>
    (context: ActionContext<ComposeForm>, account: MailAccount | undefined, to = ""): void => {
        context.reset();
        context.setValues({
            ...defaultComposeForm,
            mode: "new",
            mail_account_seq: account?.seq ?? 0,
            to,
            body_html: `<p><br></p>${signatureBlock(account)}`,
        });
        modal.open();
    };

/** 답장/전체답장/전달 열기 */
const openFromMessage =
    (modal: ReturnType<typeof useModal>) =>
    (
        context: ActionContext<ComposeForm>,
        detail: MailMessageDetail,
        mode: Exclude<ComposeMode, "new" | "draft">,
        account: MailAccount | undefined
    ): void => {
        const replyTarget = detail.reply_to ?? detail.from;
        const myAddress = String(account?.email ?? "").toLowerCase();
        const others = [...detail.to, ...detail.cc].filter(
            (a) => a.address.toLowerCase() !== myAddress && a.address !== replyTarget?.address
        );
        const references = [...(detail.references ?? []), ...(detail.message_id ? [detail.message_id] : [])];
        context.reset();
        context.setValues({
            ...defaultComposeForm,
            mode,
            mail_account_seq: account?.seq ?? detail.mail_account_seq,
            to: mode === "forward" ? "" : formatAddressLabel(replyTarget),
            cc: mode === "replyAll" ? others.map(formatAddressLabel).join(", ") : "",
            showCcBcc: mode === "replyAll" && others.length > 0,
            subject: prefixSubject(detail.subject, mode === "forward" ? "Fwd" : "Re"),
            body_html: `${signatureBlock(account)}${buildQuotedBody(detail, mode === "forward" ? "forward" : "reply")}`,
            // 전달은 원문 첨부를 그대로 싣는다(uuid 참조 — 서버가 ES 에서 내려받아 첨부한다).
            attachments:
                mode === "forward"
                    ? detail.attachments.map((a) => ({ uuid: a.uuid, name: a.name, mime: a.mime, size: a.size }))
                    : [],
            in_reply_to: mode === "forward" ? "" : (detail.message_id ?? ""),
            references: mode === "forward" ? [] : references,
        });
        modal.open();
    };

/** 임시보관 메일 이어쓰기 열기 */
const openDraft =
    (modal: ReturnType<typeof useModal>) =>
    (context: ActionContext<ComposeForm>, detail: MailMessageDetail): void => {
        context.reset();
        context.setValues({
            ...defaultComposeForm,
            seq: detail.seq,
            mode: "draft",
            mail_account_seq: detail.mail_account_seq,
            to: detail.to.map(formatAddressLabel).join(", "),
            cc: detail.cc.map(formatAddressLabel).join(", "),
            bcc: detail.bcc.map(formatAddressLabel).join(", "),
            showCcBcc: detail.cc.length + detail.bcc.length > 0,
            subject: detail.subject ?? "",
            body_html: detail.body_html || "",
            attachments: detail.attachments.map((a) => ({ uuid: a.uuid, name: a.name, mime: a.mime, size: a.size })),
            in_reply_to: detail.in_reply_to ?? "",
            references: detail.references ?? [],
        });
        modal.open();
    };

/** 메일 작성 컨트롤러 훅. */
export function useComposeController({ onSent, onDraftSaved }: ComposeControllerOptions = {}) {
    const modal: MuaModalControl = useModal({ modalId: "mail-compose-dialog" });
    const [sending, setSending] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);

    const form = useGlobalForm<ComposeForm>({
        formId: "mail-compose-form",
        initialValues: defaultComposeForm,
        onSubmit: async (values) => {
            if (!(values.mail_account_seq > 0)) {
                WarningAlert({ message: "보내는 계정을 선택하세요." });
                return false;
            }
            const request = toComposeRequest(values);
            if (request.to.length + request.cc.length + request.bcc.length === 0) {
                WarningAlert({ message: "받는 사람을 입력하세요." });
                return false;
            }
            setSending(true);
            try {
                unwrap(await mailApi.send(request), "메일을 보내지 못했습니다.");
                SuccessAlert("메일을 보냈습니다.");
                modal.close();
                onSent?.();
                return true;
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "메일을 보내지 못했습니다." });
                return false;
            } finally {
                setSending(false);
            }
        },
        actions: { openNew: openNew(modal), openFromMessage: openFromMessage(modal), openDraft: openDraft(modal) },
    });

    /** 임시보관함에 저장한다(성공 시 seq 를 폼에 반영해 이후 저장은 갱신이 된다). */
    const saveDraft = useCallback(async () => {
        const values = form.getFormValues();
        if (!(values.mail_account_seq > 0)) {
            WarningAlert({ message: "보내는 계정을 선택하세요." });
            return;
        }
        setSavingDraft(true);
        try {
            const saved = unwrap(await mailApi.saveDraft(toComposeRequest(values)), "임시저장하지 못했습니다.");
            form.setFormValue("seq", saved.seq);
            form.setFormValue("mode", "draft");
            // 새로 올린 첨부는 서버 uuid 로 바뀌었으므로 base64 를 버리고 서버 메타로 교체한다.
            form.setFormValue(
                "attachments",
                (saved.attachments ?? []).map((a) => ({ uuid: a.uuid, name: a.name, mime: a.mime, size: a.size }))
            );
            SuccessAlert("임시보관함에 저장했습니다.");
            onDraftSaved?.();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "임시저장하지 못했습니다." });
        } finally {
            setSavingDraft(false);
        }
    }, [form, onDraftSaved]);

    return { form, modal, sending, savingDraft, saveDraft };
}

/** 컨트롤러 타입 */
export type ComposeController = ReturnType<typeof useComposeController>;
