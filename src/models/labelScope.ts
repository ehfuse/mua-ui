/**
 * 라벨 묶음(0.4.108 — 2026-11-27 사용자 지시 "조직 라벨로 합쳐서 진행해, 개인 라벨은 공용 메일에 못 달게").
 * 라벨은 조직 라벨(team_seq — 조직 사람 모두가 쓴다)과 개인 라벨 두 가지이고, 이름은 둘을 통틀어 하나다(서버가 막는다).
 * 공용 메일함 메일에는 조직 라벨만 단다 — 그 메일함을 볼 때 탭 · 달기 메뉴에는 조직 라벨만 선다. 개인 메일함 · 전체 보기는 모두.
 * 예전(공용 메일함마다 한 벌)의 이름 묶기 함수(labelGroupOf · mergeLabelsByName · asMenuRows)는 이름이 겹치지 않으니 그대로 두어도 같은 결과다.
 */
import type { MailAccount, MailLabel } from "./types";

/** 조직 라벨인가 */
export function isOrgLabel(label: MailLabel): boolean {
    return label.scope === "org" || (label.team_seq ?? 0) > 0 || (label.mail_account_seq ?? 0) > 0;
}

/** 이 메일 계정이 공용 메일함이면 그 seq(조직 라벨만 단다), 아니면(개인 · 전체) 0. */
export function labelScopeOf(accounts: MailAccount[], mailAccountSeq: number): number {
    if (!(mailAccountSeq > 0)) return 0;
    return accounts.some((account) => account.seq === mailAccountSeq && account.scope === "shared") ? mailAccountSeq : 0;
}

/** 그 자리에서 쓸 라벨 — 공용 메일함(scope > 0)이면 조직 라벨만, 아니면 전부(조직 먼저 · 받은 순서). */
export function labelsInScope(labels: MailLabel[], scope: number): MailLabel[] {
    return scope > 0 ? labels.filter(isOrgLabel) : labels;
}

const nameKey = (label: MailLabel) => label.name.trim().toLowerCase();

/** 갈래 탭에 세울 라벨 — 공용 메일함을 보면 조직 라벨만, 아니면 전부. 같은 이름은 하나만(옛 데이터 대비). */
export function tabLabelsOf(labels: MailLabel[], accounts: MailAccount[], mailAccountSeq: number): MailLabel[] {
    return mergeLabelsByName(labelsInScope(labels, labelScopeOf(accounts, mailAccountSeq)));
}
/** 탭 하나(seq)가 함께 거르는 라벨 seq — 전체 보기에서 같은 이름의 개인 · 공용 라벨. 다른 보기면 그 하나. */
export function labelGroupOf(labels: MailLabel[], accounts: MailAccount[], mailAccountSeq: number, seq: number): number[] {
    if (!(seq > 0)) return [];
    if (mailAccountSeq > 0) return [seq];
    const picked = labels.find((label) => label.seq === seq);
    if (!picked) return [seq];
    const key = nameKey(picked);
    return labelsInScope(labels, labelScopeOf(accounts, mailAccountSeq))
        .filter((label) => nameKey(label) === key)
        .map((label) => label.seq);
}

/** 여러 라벨 목록을 이름으로 하나씩(앞 목록이 먼저) — 달기 메뉴(0.4.75). 서버가 이름을 메일 자리의 라벨로 바꿔 단다. */
export function mergeLabelsByName(...lists: MailLabel[][]): MailLabel[] {
    const seen = new Set<string>();
    const out: MailLabel[] = [];
    for (const label of lists.flat()) {
        const key = nameKey(label);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(label);
    }
    return out;
}

/**
 * 메뉴 체크용 — 메일에 달린 라벨을 이름으로 메뉴의 라벨 seq 로 옮긴다(0.4.75).
 * 공용 메일에 단 공용 "계약" 도, 예전에 단 개인 "계약" 도 메뉴의 "계약" 에 체크로 보인다.
 */
export function asMenuRows(rows: { label_seqs?: number[] }[], menu: MailLabel[], allLabels: MailLabel[]): { label_seqs: number[] }[] {
    const nameOf = new Map(allLabels.map((label) => [label.seq, nameKey(label)]));
    return rows.map((row) => {
        const names = new Set((row.label_seqs ?? []).map((seq) => nameOf.get(seq)).filter((name): name is string => Boolean(name)));
        return { label_seqs: menu.filter((label) => names.has(nameKey(label))).map((label) => label.seq) };
    });
}
