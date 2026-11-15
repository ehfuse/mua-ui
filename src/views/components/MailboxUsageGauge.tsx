import { t } from "../../i18n";
/**
 * 사서함 사용량 게이지(2026-10-27 사용자 지시 "받은편지함 목록 상단 탭 줄 오른쪽 끝에 사용량 게이지, 80% 넘으면 늘리라고, 스팸이 많으면 비우라고").
 * 기업메일 사서함(kind=hosted)을 보고 있을 때만 그린다 — 외부 계정은 한도를 모른다. 전체 계정 보기면 내 개인 사서함(없으면 첫 사서함).
 * 한도가 없는 사서함(무제한)은 막대 없이 쓴 양만 적는다. 값은 서버 GET /accounts/:seq/usage(스팸 수 · 크기 포함).
 */

import { useEffect, useState } from "react";
import { getMailboxUsage, loadMailboxUsage, subscribeMailboxUsage } from "../../internal/mailboxUsage";
import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import type { MailAccount } from "../../models/types";
import { formatBytes } from "../../utils/format";

/** 이만큼 차면 늘리라고 알린다 */
const WARN_RATE = 0.8;
/** 스팸이 이만큼 쌓이면 비우라고 알린다(통 수 또는 크기 — 한도의 5% 또는 50MB) */
const SPAM_WARN_COUNT = 100;
const SPAM_WARN_BYTES = 50 * 1024 * 1024;

interface Usage {
    quota_mb: number;
    used_bytes: number;
    spam_count: number;
    spam_bytes: number;
}

export function MailboxUsageGauge({
    accounts,
    mailAccountSeq,
    refreshKey,
    onOpenSpam,
}: {
    accounts: MailAccount[];
    mailAccountSeq: number; // 보고 있는 계정(0 = 전체)
    refreshKey: string; // 바뀌면 다시 읽는다(폴더 · 목록 건수 등)
    onOpenSpam: () => void;
}) {
    const hosted = accounts.filter((account) => account.kind === "hosted");
    // 계정 하나를 보면 그 계정(사서함일 때만). 전체 보기면 내 개인 사서함 → 첫 사서함(사서함이 여럿이어도 하나는 보인다 — 2026-10-27 지적).
    const target =
        mailAccountSeq > 0
            ? hosted.find((account) => account.seq === mailAccountSeq)
            : (hosted.find((account) => account.scope === "personal") ?? hosted[0]);
    const targetSeq = target?.seq ?? 0;
    const [usage, setUsage] = useState<Usage | null>(() => getMailboxUsage(targetSeq));

    // 값은 공용 저장소(0.4.84)에서 — 앱 사이드바 판 · 진입 묶음(GET /entry)과 같은 값을 쓰고 같은 요청을 이어받는다.
    useEffect(() => {
        setUsage(targetSeq ? getMailboxUsage(targetSeq) : null);
        return subscribeMailboxUsage((next) => {
            if (next.seq === targetSeq) setUsage(next);
        });
    }, [targetSeq]);

    useEffect(() => {
        if (!targetSeq) return;
        // 한 틱 미룬다 — 이 effect 는 부모(메일 화면)의 진입 묶음 effect 보다 먼저 돈다. 미루면 묶음이 이 사서함을 읽는 중으로 걸린 뒤라 그것을 이어받는다.
        // 방금(2초 안) 받은 값이 있으면 다시 읽지 않는다 — 첫 목록이 와 건수(refreshKey)가 0 → N 으로 바뀌는 것으로 또 읽어 진입마다 2번 나갔다.
        const timer = setTimeout(() => void loadMailboxUsage(targetSeq, 2000), 0);
        return () => clearTimeout(timer);
    }, [targetSeq, refreshKey]);

    if (!target || !usage) return null;
    const quotaBytes = usage.quota_mb * 1024 * 1024;
    const rate = quotaBytes > 0 ? Math.min(1, usage.used_bytes / quotaBytes) : 0;
    const full = quotaBytes > 0 && rate >= WARN_RATE;
    const spamHeavy =
        usage.spam_count >= SPAM_WARN_COUNT || usage.spam_bytes >= SPAM_WARN_BYTES || (quotaBytes > 0 && usage.spam_bytes >= quotaBytes * 0.05);
    const percent = Math.round(rate * 100);

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, flexShrink: 0, whiteSpace: "nowrap" }}>
            {spamHeavy ? (
                <Tooltip title={t("usageSpamHint", { count: usage.spam_count.toLocaleString(), size: formatBytes(usage.spam_bytes) })}>
                    <Box
                        component="button"
                        type="button"
                        onClick={onOpenSpam}
                        sx={{ border: 0, p: 0, bgcolor: "transparent", font: "inherit", fontSize: 13, color: "#b45309", cursor: "pointer", textDecoration: "underline" }}
                    >
                        {t("usageSpamAction", { count: usage.spam_count.toLocaleString() })}
                    </Box>
                </Tooltip>
            ) : null}
            {full ? (
                <Tooltip title={t("usageFullHint", { percent })}>
                    <Typography component="span" sx={{ fontSize: 13, color: "#b45309", fontWeight: 600 }}>
                        {t("usageFull")}
                    </Typography>
                </Tooltip>
            ) : null}
            <Tooltip title={`${target.email} · ${quotaBytes > 0 ? t("usageOf", { used: formatBytes(usage.used_bytes), quota: formatBytes(quotaBytes), percent }) : t("usageUnlimited", { used: formatBytes(usage.used_bytes) })}`}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {quotaBytes > 0 ? (
                        <LinearProgress
                            variant="determinate"
                            value={Math.max(2, percent)}
                            aria-label={t("usageLabel")}
                            sx={{
                                width: 96,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: "#e2e8f0",
                                "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: full ? "#d97706" : "primary.main" },
                            }}
                        />
                    ) : null}
                    <Typography component="span" sx={{ fontSize: 13, color: "#475569" }}>
                        {quotaBytes > 0 ? `${formatBytes(usage.used_bytes)} / ${formatBytes(quotaBytes)}` : t("usageUnlimited", { used: formatBytes(usage.used_bytes) })}
                    </Typography>
                </Box>
            </Tooltip>
        </Box>
    );
}
