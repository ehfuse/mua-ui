/**
 * 라벨 묶음 고르기(2026-11-11 — 공용 메일함마다 공용 라벨 한 벌).
 * 개인 라벨(mail_account_seq 0)은 개인 메일함 · 전체 보기에서, 공용 라벨은 그 공용 메일함을 볼 때 탭 · 메뉴에 선다.
 * 메일 행의 칩은 묶음과 상관없이 모든 라벨에서 찾는다(전체 보기에도 공용 메일의 공용 라벨이 칩으로 보인다).
 */
import type { MailAccount, MailLabel } from "./types";

/** 이 메일 계정이 쓰는 라벨 묶음 — 공용 메일 계정이면 그 seq, 아니면(개인 · 전체) 0. */
export function labelScopeOf(accounts: MailAccount[], mailAccountSeq: number): number {
    if (!(mailAccountSeq > 0)) return 0;
    return accounts.some((account) => account.seq === mailAccountSeq && account.scope === "shared") ? mailAccountSeq : 0;
}

/**
 * 그 묶음의 라벨만(순서는 받은 그대로).
 * 서버가 옛 것(라벨에 mail_account_seq 가 없다 — 공용 라벨 전)이면 묶음이 하나뿐이라 전부 돌려준다 — 공용 메일함에서 탭이 사라지지 않게.
 */
export function labelsInScope(labels: MailLabel[], scope: number): MailLabel[] {
    if (labels.length > 0 && labels.every((label) => label.mail_account_seq === undefined)) return labels;
    return labels.filter((label) => (label.mail_account_seq ?? 0) === scope);
}
