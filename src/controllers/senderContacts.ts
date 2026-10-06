/**
 * 보낸 사람 ↔ 주소록 — 편지 상세의 "주소록 추가" 아이콘과 외부 이미지 허용(신뢰 발신자)을 정하는 주소 집합이다.
 *
 * 왜 따로 뺐나: 메일 화면(Layout)만 이 집합을 쥐고 있어, 메일 화면 밖에서 편지를 여는 창(MailManageHost — 첨부 모아 보기 등)은
 * 추가 아이콘이 아예 안 나오고 주소록에 있는 사람의 메일도 외부 이미지가 막혔다(2026-10-06).
 * 두 곳이 같은 집합을 보게 모듈에 하나만 둔다 — 한쪽에서 추가하면 다른 쪽 아이콘도 함께 사라진다.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { ErrorAlert, SuccessAlert, WarningAlert } from "@ehfuse/alerts";
import { mailApi } from "../apis/mailApi";
import { useMuaLogined } from "../MuaProvider";
import type { MailAccount } from "../models/types";

/** 주소록에 있는 메일 주소(소문자) — 바뀔 때마다 새 Set 으로 갈아 끼운다(구독 스냅샷 비교용). */
let contactEmails: Set<string> = new Set();
const listeners = new Set<() => void>();

/** 집합을 갈아 끼우고 구독자에게 알린다. */
function setContactEmails(next: Set<string>): void {
    contactEmails = next;
    listeners.forEach((listener) => listener());
}

/** 집합 구독(useSyncExternalStore 용). */
function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** 보낸 사람 주소록 상태 — 편지의 보낸 주소와, 그 편지를 받은 계정(공용이면 공용 주소록에 추가)을 받는다. */
export function useSenderContacts(fromAddress: string | null | undefined, account: MailAccount | null | undefined) {
    const logined = useMuaLogined();
    const emails = useSyncExternalStore(subscribe, () => contactEmails);
    useEffect(() => {
        if (!logined) return;
        let cancelled = false;
        void mailApi
            .listContacts("")
            .then((res) => {
                if (cancelled || !res || res.ok === false) return;
                setContactEmails(new Set((res.data?.items ?? []).map((c) => c.email.toLowerCase())));
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [logined]);

    const address = String(fromAddress ?? "").toLowerCase();
    const known = Boolean(address) && emails.has(address);

    /** 보낸 사람 → 주소록 추가(같은 주소가 이미 있으면 안내만 하고 아이콘을 감춘다). */
    const addContact = useCallback(
        async (email: string, name: string) => {
            try {
                // 공용 메일 계정으로 받은 메일에서 추가하면 공용 주소록으로.
                const scope = account?.scope === "shared" ? "shared" : "personal";
                const res = await mailApi.createContact({ email, name, scope });
                if (res && res.ok === false) {
                    WarningAlert({ message: res.error || "이미 주소록에 있는 메일 주소입니다." });
                } else {
                    SuccessAlert("주소록에 추가했습니다.");
                }
                setContactEmails(new Set(contactEmails).add(email.toLowerCase()));
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "주소록에 추가하지 못했습니다." });
            }
        },
        [account]
    );

    return {
        canAddContact: Boolean(address) && !known, // 주소록에 없는 주소 — 추가 아이콘을 보인다
        trustedSender: known, // 주소록에 있는 보낸 사람 — 외부 이미지를 차단하지 않는다
        addContact,
    };
}
