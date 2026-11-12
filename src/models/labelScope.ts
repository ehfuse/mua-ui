/**
 * 라벨 묶음 고르기(2026-11-11 — 공용 메일함마다 공용 라벨 한 벌).
 * 개인 라벨(mail_account_seq 0)은 개인 메일함 · 전체 보기에서, 공용 라벨은 그 공용 메일함을 볼 때 메뉴(달기)에 선다.
 * 탭(거르기)은 전체 보기에서 개인 라벨과 내가 쓰는 공용 메일함들의 공용 라벨을 함께 세운다(0.4.74 — 조직 사람들이 공용 라벨로 거를 수 있게). 같은 이름은 탭 하나다.
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

const nameKey = (label: MailLabel) => label.name.trim().toLowerCase();

/**
 * 갈래 탭에 세울 라벨(0.4.74) — 공용 메일함을 보면 그 묶음, 개인 메일함이면 개인 라벨,
 * 전체 보기(mailAccountSeq 0)면 개인 라벨 + 내가 쓰는 공용 메일함들의 공용 라벨이다. 같은 이름은 하나만(개인 것이 앞).
 */
export function tabLabelsOf(labels: MailLabel[], accounts: MailAccount[], mailAccountSeq: number): MailLabel[] {
    if (mailAccountSeq > 0) return labelsInScope(labels, labelScopeOf(accounts, mailAccountSeq));
    const candidates = viewCandidates(labels, accounts);
    const seen = new Set<string>();
    return candidates.filter((label) => {
        const key = nameKey(label);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** 전체 보기의 탭 후보 — 개인 라벨 먼저, 그다음 공용 메일함 라벨(받은 순서). 옛 서버(묶음 없음)는 전부. */
function viewCandidates(labels: MailLabel[], accounts: MailAccount[]): MailLabel[] {
    if (labels.length > 0 && labels.every((label) => label.mail_account_seq === undefined)) return labels;
    const sharedSeqs = new Set(accounts.filter((account) => account.scope === "shared").map((account) => account.seq));
    const personal = labels.filter((label) => !((label.mail_account_seq ?? 0) > 0));
    const shared = labels.filter((label) => sharedSeqs.has(label.mail_account_seq ?? 0));
    return [...personal, ...shared];
}

/** 탭 하나(seq)가 함께 거르는 라벨 seq — 전체 보기에서 같은 이름의 개인 · 공용 라벨. 다른 보기면 그 하나. */
export function labelGroupOf(labels: MailLabel[], accounts: MailAccount[], mailAccountSeq: number, seq: number): number[] {
    if (!(seq > 0)) return [];
    if (mailAccountSeq > 0) return [seq];
    const picked = labels.find((label) => label.seq === seq);
    if (!picked) return [seq];
    const key = nameKey(picked);
    return viewCandidates(labels, accounts)
        .filter((label) => nameKey(label) === key)
        .map((label) => label.seq);
}
