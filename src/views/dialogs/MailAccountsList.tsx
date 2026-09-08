/**
 * 메일 계정 목록(메일 관리 다이얼로그의 "계정" 탭) — 내가 쓸 수 있는 계정(개인 + 공용)을 수정/삭제/지금 동기화.
 * 수정·삭제는 can_manage(개인=소유자, 공용=관리자·등록자)인 계정만 가능하다.
 */

import { useState } from "react";
import { Box, Chip, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import { Tooltip } from "../../internal/Tooltip";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import { MailProviderIcon } from "../components/MailProviderIcon";
import { TrashIcon } from "../../internal/icons";
import { useIsMobile } from "../../internal/useIsMobile";
import type { MailAccount } from "../../models/types";
import { formatMailFullDate } from "../../utils/format";

interface MailAccountsListProps {
    accounts: MailAccount[]; // 계정 목록
    syncingSeqs: number[]; // 동기화 중인 계정 seq 목록
    onEdit: (account: MailAccount) => void; // 수정
    onDelete: (account: MailAccount) => void; // 삭제
    onSync: (account: MailAccount) => void; // 지금 동기화
    /** 순서 바꾸기 — 드래그로 놓은 순간의 seq 배열(위에서부터). 주지 않으면 드래그가 꺼진다. */
    onReorder?: (seqs: number[]) => void;
}

/**
 * "기본 발신" 칩 — 한글 폰트의 디센더 때문에 flex 로 가운데 정렬해도 글자가 살짝 아래로 처져 보인다.
 * line-height 를 1 로 죄고 1px 끌어올려 눈에 맞춘다(2026-09-02).
 */
const DEFAULT_CHIP_SX = {
    fontSize: "13px",
    "& .MuiChip-label": { lineHeight: 1, position: "relative", top: "-1px" },
} as const;

/** 계정 한 줄 */
function AccountRow({
    account,
    syncing,
    onEdit,
    onDelete,
    onSync,
    dragProps,
    onDragEnter,
    dragging,
}: {
    account: MailAccount;
    syncing: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onSync: () => void;
    /** 손잡이(왼쪽 아이콘)에 걸 드래그 핸들러 — 없으면 순서 바꾸기가 꺼진 상태다. */
    dragProps?: { onDragStart: () => void; onDragEnd: () => void };
    onDragEnter?: () => void;
    dragging?: boolean;
}) {
    const isShared = account.scope === "shared";
    // 기업메일 사서함 — 외부 계정과 같은 행이지만 가져오기·수정이 없는 팀 주소다(관리는 팀 관리 › 기업메일).
    const isHosted = account.kind === "hosted";
    // 사서함 설정(주소·서버)은 못 고쳐도 보내는 사람 이름·서명은 쓰는 사람 것이라 연필이 열린다(2026-09-07).
    const canEditProfile = Boolean(account.can_edit_profile);
    const isMobile = useIsMobile();
    /**
     * 팀·갈래 칩 — 팀 것이면 팀명 아래 개인/공용을 두 줄로 쌓는다.
     * 기업메일 사서함은 개인이 담당해도 **팀의 주소**라 팀명이 함께 보여야 하고(2026-09-06),
     * 한 줄로 나란히 두면 팀명이 길 때 행 폭이 늘어난다.
     */
    const chipSx = (accent: boolean) => ({
        px: 1,
        py: 0.4,
        borderRadius: "4px",
        fontSize: "13px",
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textAlign: "center" as const,
        color: accent ? "#1d4ed8" : "#334155",
        bgcolor: accent ? "#eff6ff" : "#f1f5f9",
    });
    const teamName = account.team_name || "";
    const scopeChip = (
        <Stack spacing={0.5} sx={{ minWidth: 0, width: "100%" }}>
            {teamName ? (
                <Box component="span" sx={chipSx(true)}>
                    {teamName}
                </Box>
            ) : null}
            {/* 기업메일 사서함(kind=hosted)은 외부 계정이 아니라 팀 도메인 주소다 — 여기서는 못 고치므로
                "개인" 대신 정체를 적는다(관리는 팀 관리 › 기업메일). */}
            <Box component="span" sx={chipSx(!teamName && isShared)}>
                {account.kind === "hosted" ? "기업메일" : isShared ? "공용" : "개인"}
            </Box>
        </Stack>
    );
    return (
        <Box
            sx={{
                // [아이콘][이름·주소·칩 / 서버 / 마지막 동기화][개인·공용 칩 컬럼][액션] — 모바일은 액션을 아래 행에
                display: "grid",
                // 모바일은 개인/공용 칩을 하단 액션행으로 내리므로 칩 컬럼이 없다.
                // 칩 칸은 고정 폭이다(auto 면 행마다 글자 수만큼 넓어져 칩도 액션 아이콘도 줄이 안 맞았다 — 2026-09-07).
                // 액션 칸도 고정 폭이다 — 기업메일 사서함은 동기화 버튼이 없어(아이콘 2개) auto 로 두면
                // 그 줄만 좁아져 연필·휴지통이 다른 줄과 어긋났다(2026-09-07). 3개(40px×3) 기준으로 잡는다.
                gridTemplateColumns: isMobile ? "28px minmax(0, 1fr)" : "28px minmax(0, 1fr) 92px 120px",
                alignItems: "center",
                gap: 2,
                px: 2.25,
                py: 1.75,
                border: "1px solid #e2e8f0",
                borderRadius: 1.5,
                bgcolor: "#fff",
                // 끌고 있는 행은 흐리게 — 지금 어느 줄을 옮기는 중인지 보인다.
                opacity: dragging ? 0.4 : 1,
            }}
            onDragEnter={onDragEnter}
            onDragOver={(event) => {
                // 기본 동작(드롭 금지)을 막아야 이 행이 놓을 자리로 인식된다.
                if (onDragEnter) event.preventDefault();
            }}
        >
            {/* 왼쪽 provider 아이콘이 곧 손잡이다 — 행에 손잡이를 따로 놓을 자리가 없고,
                아이콘 위에서만 끌리게 해야 주소 글자 선택(드래그)과 부딪히지 않는다. */}
            <Box
                draggable={Boolean(dragProps)}
                onDragStart={dragProps?.onDragStart}
                onDragEnd={dragProps?.onDragEnd}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: dragProps ? "grab" : "default",
                    "&:active": dragProps ? { cursor: "grabbing" } : undefined,
                }}
            >
                <MailProviderIcon email={account.email} scope={account.scope} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                    <Typography noWrap sx={{ fontSize: "18px", fontWeight: 700, color: "#111" }}>
                        {account.name || account.email}
                    </Typography>
                    {account.name ? (
                        <Typography noWrap sx={{ fontSize: "18px", color: "#334155" }}>
                            {account.email}
                        </Typography>
                    ) : null}
                    {/* 기본 발신 칩 — 데스크톱은 이름 옆, 모바일은 하단 액션행 왼쪽(이름 줄이 좁아 줄바꿈되던 것). */}
                    {account.is_default && !isMobile ? (
                        <Chip size="small" label="기본 발신" color="primary" sx={DEFAULT_CHIP_SX} />
                    ) : null}
                </Stack>
                {/* 기업메일 사서함은 IMAP 으로 가져오지 않는다 — 우리 메일서버가 받는 즉시 넣어 준다.
                    수신 서버 표시는 폼 재사용을 위한 값일 뿐이라 그대로 적으면 거짓말이 된다(2026-09-06). */}
                <Typography noWrap sx={{ fontSize: "15px", color: "#475569", mt: 0.5 }}>
                    {isHosted
                        ? `기업메일 사서함 · ${account.email.split("@")[1] ?? ""}`
                        : `${account.incoming_protocol.toUpperCase()} · ${account.incoming_host}`}
                </Typography>
                {/* 마지막 동기화(또는 오류)는 아래 줄에 따로 — 가져오지 않는 사서함에는 동기화 개념이 없다. */}
                <Typography
                    noWrap
                    sx={{ fontSize: "15px", color: account.last_error ? "#b91c1c" : "#475569", mt: 0.25 }}
                >
                    {account.last_error
                        ? `오류: ${account.last_error}`
                        : isHosted
                          ? "받는 즉시 들어옵니다"
                          : account.last_sync_time
                            ? `마지막 동기화 ${formatMailFullDate(account.last_sync_time)}`
                            : "아직 동기화 전"}
                </Typography>
            </Box>
            {/* 개인/공용 — 사각 칩. 데스크톱은 별도 컬럼, 모바일은 하단 액션행 왼쪽 첫 번째. */}
            {isMobile ? null : scopeChip}
            <Stack
                direction="row"
                spacing={isMobile ? 1 : 0.25}
                alignItems="center"
                // 데스크톱도 오른쪽 정렬 — 아이콘 수가 다른 줄(기업메일=2개)이 오른쪽 끝을 기준으로 맞는다.
                justifyContent="flex-end"
                sx={isMobile ? { gridColumn: "1 / -1", borderTop: "1px solid #e2e8f0", pt: 1, mt: 0.5 } : undefined}
            >
                {/* 모바일 — [개인/공용][기본 발신] 칩을 액션행 왼쪽에, 아이콘들은 오른쪽으로 민다. */}
                {isMobile ? scopeChip : null}
                {isMobile && account.is_default ? (
                    <Chip size="small" label="기본 발신" color="primary" sx={DEFAULT_CHIP_SX} />
                ) : null}
                {isMobile ? <Box sx={{ flex: 1 }} /> : null}
                {/* 기업메일 사서함에는 가져올 서버가 없다 — 눌러도 할 일이 없는 버튼은 두지 않는다. */}
                {isHosted ? null : (
                    <Tooltip title="지금 동기화">
                        <span>
                            <IconButton size="small" onClick={onSync} disabled={syncing} aria-label="지금 동기화">
                                {syncing ? <CircularProgress size={16} /> : <SyncIcon fontSize="small" />}
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
                {/* 기업메일 사서함도 연필은 열린다 — 주소·수신 설정이 아니라 **내가 쓰는** 보내는 사람 이름·서명을 고친다
                    (can_edit_profile). 사서함 자체는 여전히 팀 관리 › 기업메일 소관이다(2026-09-07). */}
                <Tooltip title={
                        account.can_manage
                            ? "수정"
                            : canEditProfile
                              ? "보내는 사람 이름·서명 (주소·수신 설정은 팀 관리 › 기업메일)"
                              : isHosted
                                ? "기업메일 사서함은 팀 관리 › 기업메일에서 관리합니다"
                                : "공용 계정은 관리자 또는 등록자만 수정할 수 있습니다"
                    }>
                    <span>
                        <IconButton
                            size="small"
                            onClick={onEdit}
                            disabled={!account.can_manage && !canEditProfile}
                            aria-label="수정"
                        >
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={
                        account.can_manage
                            ? "삭제"
                            : isHosted
                              ? "기업메일 사서함은 팀 관리 › 기업메일에서 관리합니다"
                              : "공용 계정은 관리자 또는 등록자만 삭제할 수 있습니다"
                    }>
                    <span>
                        <IconButton size="small" onClick={onDelete} disabled={!account.can_manage} aria-label="삭제">
                            <TrashIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Stack>
        </Box>
    );
}

/** 계정 목록 */
export function MailAccountsList({ accounts, syncingSeqs, onEdit, onDelete, onSync, onReorder }: MailAccountsListProps) {
    // 끌고 있는 행(0=없음)과 놓기 전 미리보기 순서 — 놓거나 취소하면 비운다.
    const [dragSeq, setDragSeq] = useState(0);
    const [orderPreview, setOrderPreview] = useState<number[] | null>(null);

    const ordered =
        orderPreview === null
            ? accounts
            : orderPreview
                  .map((seq) => accounts.find((row) => row.seq === seq))
                  .filter((row): row is MailAccount => Boolean(row));

    /** 끌던 행이 다른 행 위를 지날 때 — 그 자리에서 즉시 바꿔 보여준다. */
    const handleDragEnter = (targetSeq: number) => {
        if (!dragSeq || dragSeq === targetSeq) return;
        const current = ordered.map((row) => row.seq);
        const from = current.indexOf(dragSeq);
        const to = current.indexOf(targetSeq);
        if (from < 0 || to < 0) return;
        const next = [...current];
        next.splice(to, 0, ...next.splice(from, 1));
        setOrderPreview(next);
    };

    /** 놓는 순간 — 지금 보이는 순서를 저장한다(바뀐 게 없으면 아무것도 하지 않는다). */
    const handleDragEnd = () => {
        const next = ordered.map((row) => row.seq);
        setDragSeq(0);
        setOrderPreview(null);
        if (next.some((seq, index) => accounts[index]?.seq !== seq)) onReorder?.(next);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            {accounts.length === 0 ? (
                <Typography sx={{ fontSize: "15px", color: "#111", py: 2, textAlign: "center" }}>
                    등록된 메일 계정이 없습니다. 아래 [계정 추가]로 등록하세요.
                </Typography>
            ) : (
                ordered.map((account) => (
                    <AccountRow
                        key={account.seq}
                        account={account}
                        syncing={syncingSeqs.includes(account.seq)}
                        onEdit={() => onEdit(account)}
                        onDelete={() => onDelete(account)}
                        onSync={() => onSync(account)}
                        dragProps={
                            onReorder
                                ? { onDragStart: () => setDragSeq(account.seq), onDragEnd: handleDragEnd }
                                : undefined
                        }
                        onDragEnter={onReorder ? () => handleDragEnter(account.seq) : undefined}
                        dragging={dragSeq === account.seq}
                    />
                ))
            )}
        </Box>
    );
}
