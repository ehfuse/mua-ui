/**
 * 메일 계정 목록(메일 관리 다이얼로그의 "계정" 탭) — 내가 쓸 수 있는 계정(개인 + 공용)을 수정/삭제/지금 동기화.
 * 수정·삭제는 can_manage(개인=소유자, 공용=관리자·등록자)인 계정만 가능하다.
 */

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
}

/** 계정 한 줄 */
function AccountRow({
    account,
    syncing,
    onEdit,
    onDelete,
    onSync,
}: {
    account: MailAccount;
    syncing: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onSync: () => void;
}) {
    const isShared = account.scope === "shared";
    const isMobile = useIsMobile();
    /** 개인/공용 사각 칩 */
    const scopeChip = (
        <Box
            component="span"
            sx={{
                px: 1,
                py: 0.4,
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                color: isShared ? "#1d4ed8" : "#334155",
                bgcolor: isShared ? "#eff6ff" : "#f1f5f9",
            }}
        >
            {isShared ? "공용" : "개인"}
        </Box>
    );
    return (
        <Box
            sx={{
                // [아이콘][이름·주소·칩 / 서버 / 마지막 동기화][개인·공용 칩 컬럼][액션] — 모바일은 액션을 아래 행에
                display: "grid",
                // 모바일은 개인/공용 칩을 하단 액션행으로 내리므로 칩 컬럼이 없다.
                gridTemplateColumns: isMobile ? "28px minmax(0, 1fr)" : "28px minmax(0, 1fr) auto auto",
                alignItems: "center",
                gap: 2,
                px: 2.25,
                py: 1.75,
                border: "1px solid #e2e8f0",
                borderRadius: 1.5,
                bgcolor: "#fff",
            }}
        >
            <MailProviderIcon email={account.email} scope={account.scope} />
            <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                    <Typography noWrap sx={{ fontSize: "15px", fontWeight: 700, color: "#111" }}>
                        {account.name || account.email}
                    </Typography>
                    {account.name ? (
                        <Typography noWrap sx={{ fontSize: "14px", color: "#334155" }}>
                            {account.email}
                        </Typography>
                    ) : null}
                    {/* 기본 발신 칩 — 데스크톱은 이름 옆, 모바일은 하단 액션행 왼쪽(이름 줄이 좁아 줄바꿈되던 것). */}
                    {account.is_default && !isMobile ? (
                        <Chip size="small" label="기본 발신" color="primary" sx={{ fontSize: "13px" }} />
                    ) : null}
                </Stack>
                <Typography noWrap sx={{ fontSize: "13.5px", color: "#475569", mt: 0.5 }}>
                    {account.incoming_protocol.toUpperCase()} · {account.incoming_host}
                </Typography>
                {/* 마지막 동기화(또는 오류)는 아래 줄에 따로 */}
                <Typography
                    noWrap
                    sx={{ fontSize: "13.5px", color: account.last_error ? "#b91c1c" : "#475569", mt: 0.25 }}
                >
                    {account.last_error
                        ? `오류: ${account.last_error}`
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
                justifyContent={isMobile ? "flex-end" : "flex-start"}
                sx={isMobile ? { gridColumn: "1 / -1", borderTop: "1px solid #e2e8f0", pt: 1, mt: 0.5 } : undefined}
            >
                {/* 모바일 — [개인/공용][기본 발신] 칩을 액션행 왼쪽에, 아이콘들은 오른쪽으로 민다. */}
                {isMobile ? scopeChip : null}
                {isMobile && account.is_default ? (
                    <Chip size="small" label="기본 발신" color="primary" sx={{ fontSize: "13px" }} />
                ) : null}
                {isMobile ? <Box sx={{ flex: 1 }} /> : null}
                <Tooltip title="지금 동기화">
                    <span>
                        <IconButton size="small" onClick={onSync} disabled={syncing} aria-label="지금 동기화">
                            {syncing ? <CircularProgress size={16} /> : <SyncIcon fontSize="small" />}
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={account.can_manage ? "수정" : "공용 계정은 관리자 또는 등록자만 수정할 수 있습니다"}>
                    <span>
                        <IconButton size="small" onClick={onEdit} disabled={!account.can_manage} aria-label="수정">
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={account.can_manage ? "삭제" : "공용 계정은 관리자 또는 등록자만 삭제할 수 있습니다"}>
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
export function MailAccountsList({ accounts, syncingSeqs, onEdit, onDelete, onSync }: MailAccountsListProps) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            {accounts.length === 0 ? (
                <Typography sx={{ fontSize: "15px", color: "#111", py: 2, textAlign: "center" }}>
                    등록된 메일 계정이 없습니다. 아래 [계정 추가]로 등록하세요.
                </Typography>
            ) : (
                accounts.map((account) => (
                    <AccountRow
                        key={account.seq}
                        account={account}
                        syncing={syncingSeqs.includes(account.seq)}
                        onEdit={() => onEdit(account)}
                        onDelete={() => onDelete(account)}
                        onSync={() => onSync(account)}
                    />
                ))
            )}
        </Box>
    );
}
