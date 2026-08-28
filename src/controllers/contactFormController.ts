/**
 * 주소록 연락처 등록/수정 다이얼로그 컨트롤러 — useGlobalForm + useModal.
 */

import { useCallback } from "react";
import { useGlobalForm, useModal, type ActionContext } from "@ehfuse/forma";
import { ErrorAlert, SuccessAlert, WarningAlert } from "@ehfuse/alerts";
import { mailApi, unwrap } from "../apis/mailApi";
import { defaultMailContactForm } from "../models/defaults";
import type { MailContact, MailContactForm, MailContactRequest } from "../models/types";
import type { MuaModalControl } from "../types/modal";

interface ContactFormControllerOptions {
    onSaved?: (contact: MailContact) => void; // 저장 후(목록 재조회)
    onRemoved?: (seq: number) => void; // 삭제 후
}

/** 연락처 → 폼 값 */
function toForm(contact: MailContact): MailContactForm {
    return {
        seq: contact.seq,
        name: contact.name ?? "",
        email: contact.email ?? "",
        organization: contact.organization ?? "",
        phone: contact.phone ?? "",
        memo: contact.memo ?? "",
        is_favorite: Boolean(contact.is_favorite),
    };
}

/** 폼 값 → 요청 */
function toRequest(values: MailContactForm): MailContactRequest {
    return {
        name: values.name.trim(),
        email: values.email.trim(),
        organization: values.organization.trim(),
        phone: values.phone.trim(),
        memo: values.memo,
        is_favorite: Boolean(values.is_favorite),
    };
}

/** 다이얼로그를 연다(contact 지정 시 수정, prefill 은 신규 미리 채움). */
const openDialog =
    (modal: MuaModalControl) =>
    (
        context: ActionContext<MailContactForm>,
        contact?: MailContact | null,
        prefill?: Partial<MailContactForm>
    ): void => {
        context.reset();
        context.setValues(contact ? toForm(contact) : { ...defaultMailContactForm, ...(prefill ?? {}) });
        modal.open();
    };

/** 연락처 폼 컨트롤러 훅 */
export function useContactFormController({ onSaved, onRemoved }: ContactFormControllerOptions = {}) {
    const modal: MuaModalControl = useModal({ modalId: "mail-contact-form-dialog" });

    const form = useGlobalForm<MailContactForm>({
        formId: "mail-contact-form",
        initialValues: defaultMailContactForm,
        onSubmit: async (values) => {
            const email = values.email.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                WarningAlert({ message: "메일 주소를 올바르게 입력하세요." });
                return false;
            }
            try {
                const body = toRequest(values);
                const saved =
                    values.seq > 0
                        ? unwrap(await mailApi.updateContact(values.seq, body), "연락처를 저장하지 못했습니다.")
                        : unwrap(await mailApi.createContact(body), "연락처를 저장하지 못했습니다.");
                SuccessAlert("연락처를 저장했습니다.");
                modal.close();
                onSaved?.(saved);
                return true;
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "연락처를 저장하지 못했습니다." });
                return false;
            }
        },
        actions: { openDialog: openDialog(modal) },
    });

    /** 연락처를 삭제한다. */
    const removeContact = useCallback(
        async (seq: number) => {
            try {
                unwrap(await mailApi.deleteContact(seq), "연락처를 삭제하지 못했습니다.");
                SuccessAlert("연락처를 삭제했습니다.");
                modal.close();
                onRemoved?.(seq);
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "연락처를 삭제하지 못했습니다." });
            }
        },
        [modal, onRemoved]
    );

    return { form, modal, removeContact };
}

/** 컨트롤러 타입 */
export type ContactFormController = ReturnType<typeof useContactFormController>;
