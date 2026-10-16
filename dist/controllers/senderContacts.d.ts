import type { MailAccount } from "../models/types";
/** 보낸 사람 주소록 상태 — 편지의 보낸 주소와, 그 편지를 받은 계정(공용이면 공용 주소록에 추가)을 받는다. */
export declare function useSenderContacts(fromAddress: string | null | undefined, account: MailAccount | null | undefined): {
    canAddContact: boolean;
    trustedSender: boolean;
    addContact: (email: string, name: string) => Promise<void>;
};
