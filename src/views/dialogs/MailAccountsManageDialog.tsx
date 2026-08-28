/**
 * 메일 계정 관리 다이얼로그 — 내가 쓸 수 있는 계정(개인 + 공용) 목록에서 추가/수정/삭제/지금 동기화.
 * 수정·삭제는 can_manage(개인=소유자, 공용=관리자·등록자)인 계정만 가능하다.
 */

import { Box, Button, Chip, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import { Tooltip } from "../../internal/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import { MailProviderIcon } from "../components/MailProviderIcon";
import { TrashIcon } from "../../internal/icons";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaFormDialog } from "../../MuaProvider";
import type { MailAccount } from "../../models/types";
import { formatMailFullDate } from "../../utils/format";

interface MailAccountsManageDialogProps {
    open: boolean; // 열림
    accounts: MailAccount[]; // 계정 목록
    syncingSeqs: number[]; // 동기화 중인 계정 seq 목록
    onClose: () => void; // 닫기
    onAdd: () => void; // 계정 추가
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
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "28px minmax(0, 1fr) auto",
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                py: 1.25,
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
                    <Chip
                        size="small"
                        label={isShared ? "공용" : "개인"}
                        variant="outlined"
                        sx={{ fontSize: "13px", color: "#111" }}
                    />
                    {account.is_default ? (
                        <Chip size="small" label="기본 발신" color="primary" sx={{ fontSize: "13px" }} />
                    ) : null}
                    {account.unread_count ? (
                        <Chip
                            size="small"
                            label={`안 읽음 ${account.unread_count}`}
                            sx={{ fontSize: "13px", color: "#111" }}
                        />
                    ) : null}
                </Stack>
                <Typography
                    noWrap
                    sx={{ fontSize: "13.5px", color: account.last_error ? "#b91c1c" : "#475569", mt: 0.25 }}
                >
                    {account.incoming_protocol.toUpperCase()} · {account.incoming_host} ·{" "}
                    {account.last_error
                        ? `오류: ${account.last_error}`
                        : account.last_sync_time
                          ? `마지막 동기화 ${formatMailFullDate(account.last_sync_time)}`
                          : "아직 동기화 전"}
                </Typography>
            </Box>
            <Stack direction="row" spacing={0.25} alignItems="center">
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

/** 계정 관리 다이얼로그 컴포넌트 */
export function MailAccountsManageDialog({
    open,
    accounts,
    syncingSeqs,
    onClose,
    onAdd,
    onEdit,
    onDelete,
    onSync,
}: MailAccountsManageDialogProps) {
    // 모바일은 풀스크린 우→좌 슬라이드(서브페이지 위에 한 겹 더 뜬다).
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    return (
        <FormDialog
            fontScaleKey="MailAccountsManageDialog"
            fullScreen={isMobile}
            mobilePresentation={isMobile ? "slide" : "dialog"}
            open={open}
            onClose={onClose}
            title={{ text: "메일 계정 관리" }}
            titleIcons={{ delete: { visible: false } }}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="sm"
            scrollPastLastSection={false}
            contentBottomPadding={24}
            sections={[
                {
                    id: "mail-accounts-list",
                    showTitle: false,
                    children: (
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
                    ),
                },
            ]}
            actions={{
                visible: true,
                showCancelButton: false,
                left: (
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={onAdd}>
                        계정 추가
                    </Button>
                ),
                right: (
                    <Button variant="outlined" onClick={onClose} sx={{ minWidth: 80 }}>
                        닫기
                    </Button>
                ),
            }}
        />
    );
}
