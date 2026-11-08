import type { MailAccount } from "../models/types";
/** 다음에 편지를 열 때 주소록을 새로 읽게 한다 — 메일 화면에 들어올 때 부른다(그 사이 주소록 화면에서 더하거나 지웠을 수 있다). */
export declare function invalidateSenderContacts(): void;
/** 보낸 사람 주소록 상태 — 편지의 보낸 주소와, 그 편지를 받은 계정(공용이면 공용 주소록에 추가)을 받는다. */
export declare function useSenderContacts(fromAddress: string | null | undefined, account: MailAccount | null | undefined): {
    canAddContact: boolean;
    trustedSender: boolean;
    addContact: (email: string, name: string) => Promise<void>;
};
