/**
 * 메일 상세 패널 — 헤더(제목/주소/일시) · 액션(답장/전체답장/전달/휴지통/복원/삭제) · 첨부 · 본문.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Link,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { ForwardArrowIcon, ReplyArrowIcon } from "./MailActionIcons";
import RestoreFromTrashOutlinedIcon from "@mui/icons-material/RestoreFromTrashOutlined";
import { StarRoundedIcon, TrashIcon } from "../../internal/icons";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import { ErrorAlert } from "@ehfuse/alerts";
import { useMuaSaveBlob } from "../../MuaProvider";
import { mailApi } from "../../apis/mailApi";
import type { MailAttachment, MailMessageDetail } from "../../models/types";
import { formatAddressList, formatBytes, formatMailFullDate } from "../../utils/format";
import { MailBodyFrame } from "./MailBodyFrame";

interface MessageDetailPanelProps {
    detail: MailMessageDetail | null; // 상세
    loading: boolean; // 로딩
    onClose: () => void; // 닫기
    onReply: (mode: "reply" | "replyAll" | "forward") => void; // 답장/전달
    onEditDraft: () => void; // 임시보관 이어쓰기
    onComposeTo: (address: string) => void; // 주소 클릭 → 그 주소로 새 메일 작성
    onToggleStar: () => void; // 중요 토글
    onMarkUnread: () => void; // 읽지 않음으로
    onTrash: () => void; // 휴지통
    onSpam: () => void; // 스팸함으로
    onRestore: () => void; // 복원(휴지통/스팸함 → 이전 폴더)
    onDeleteForever: () => void; // 영구 삭제
    /**
     * 모바일 mfd 상세 다이얼로그 본문으로 쓰일 때 true — 닫기 X 를 숨기고(제목바 ← 가 닫는다),
     * 자체 세로 스크롤러 대신 내용 높이만큼 늘어나 다이얼로그 스크롤에 맡긴다.
     */
    embedded?: boolean;
}

/** 첨부 칩 — 클릭 시 다운로드 */
function AttachmentChip({ attachment }: { attachment: MailAttachment }) {
    const [downloading, setDownloading] = useState(false);
    const saveBlob = useMuaSaveBlob();
    const handleClick = useCallback(async () => {
        setDownloading(true);
        try {
            const bytes = await mailApi.downloadAttachment(attachment.uuid);
            await saveBlob(new Blob([bytes], { type: attachment.mime || "application/octet-stream" }), attachment.name);
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "첨부를 내려받지 못했습니다." });
        } finally {
            setDownloading(false);
        }
    }, [attachment, saveBlob]);
    return (
        <Chip
            icon={downloading ? <CircularProgress size={14} /> : <AttachFileIcon />}
            label={`${attachment.name} (${formatBytes(attachment.size)})`}
            variant="outlined"
            onClick={() => void handleClick()}
            disabled={downloading}
            sx={{ fontSize: "13.5px", color: "#111", maxWidth: 360 }}
        />
    );
}

/** 상세 패널 컴포넌트 */
export function MessageDetailPanel(props: MessageDetailPanelProps) {
    const {
        detail,
        loading,
        onClose,
        onReply,
        onEditDraft,
        onComposeTo,
        onToggleStar,
        onMarkUnread,
        onTrash,
        onSpam,
        onRestore,
        onDeleteForever,
        embedded = false,
    } = props;
    const [allowRemoteImages, setAllowRemoteImages] = useState(false);
    // ⋮ 더보기 메뉴
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const closeMenu = useCallback(() => setMenuAnchor(null), []);
    // 선택 메일이 바뀌면 상세 스크롤을 맨 위로
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const detailSeq = detail?.seq ?? 0;
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [detailSeq]);

    if (loading && !detail) {
        return (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={28} />
            </Box>
        );
    }
    if (!detail) return null;

    const isTrash = detail.folder === "trash";
    const isSpam = detail.folder === "spam";
    const isDraft = detail.folder === "draft";
    const hasRemoteImages = /<img\b[^>]*\ssrc\s*=\s*["'](https?:)?\/\//i.test(detail.body_html || "");

    return (
        <Box
            sx={{
                height: embedded ? "auto" : "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                bgcolor: "#fff",
            }}
        >
            {/* 액션 바 */}
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ px: 1.5, py: 1, borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", rowGap: 0.5 }}
            >
                {isDraft ? (
                    <Button size="small" variant="contained" onClick={onEditDraft} sx={{ fontSize: "13.5px" }}>
                        이어서 작성
                    </Button>
                ) : (
                    <>
                        <Tooltip title="답장">
                            <IconButton size="small" onClick={() => onReply("reply")}>
                                <ReplyArrowIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="전달">
                            <IconButton size="small" onClick={() => onReply("forward")}>
                                <ForwardArrowIcon />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
                {/* 읽지 않음 / 스팸 신고는 툴바에도 아이콘으로 노출(받은편지함), 스팸함에서는 "스팸 아님" */}
                {detail.folder === "inbox" ? (
                    <Tooltip title="읽지 않음으로 표시">
                        <IconButton size="small" onClick={onMarkUnread}>
                            <MarkEmailUnreadOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                ) : null}
                {isSpam ? (
                    <Tooltip title="스팸 아님 (받은편지함으로)">
                        <Button size="small" onClick={onRestore} sx={{ fontSize: "13.5px" }}>
                            스팸 아님
                        </Button>
                    </Tooltip>
                ) : detail.folder === "inbox" ? (
                    <Tooltip title="스팸 신고">
                        <IconButton size="small" onClick={onSpam}>
                            <ReportGmailerrorredOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                ) : null}
                {/* 삭제(휴지통으로) — 휴지통에서는 복원/영구 삭제 */}
                {isTrash ? (
                    <>
                        <Tooltip title="복원">
                            <IconButton size="small" onClick={onRestore}>
                                <RestoreFromTrashOutlinedIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="영구 삭제">
                            <IconButton size="small" onClick={onDeleteForever}>
                                <TrashIcon />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <Tooltip title="삭제">
                        <IconButton size="small" onClick={onTrash}>
                            <TrashIcon />
                        </IconButton>
                    </Tooltip>
                )}
                {/* ⋮ 더보기 — 삭제/읽지않음/스팸 등 전체 메뉴 */}
                <Tooltip title="더보기">
                    <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="더보기">
                        <MoreVertIcon />
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={closeMenu}
                    slotProps={{ paper: { sx: { minWidth: 220 } } }}
                >
                    {!isDraft
                        ? [
                              <MenuItem key="reply" onClick={() => (closeMenu(), onReply("reply"))}>
                                  <ListItemIcon>
                                      <ReplyArrowIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary="답장" />
                              </MenuItem>,
                              <MenuItem key="forward" onClick={() => (closeMenu(), onReply("forward"))}>
                                  <ListItemIcon>
                                      <ForwardArrowIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary="전달" />
                              </MenuItem>,
                              <Divider key="d1" />,
                          ]
                        : null}
                    {isTrash
                        ? [
                              <MenuItem key="restore" onClick={() => (closeMenu(), onRestore())}>
                                  <ListItemIcon>
                                      <RestoreFromTrashOutlinedIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary="복원" />
                              </MenuItem>,
                              <MenuItem key="forever" onClick={() => (closeMenu(), onDeleteForever())}>
                                  <ListItemIcon>
                                      <TrashIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary="영구 삭제" />
                              </MenuItem>,
                          ]
                        : [
                              <MenuItem key="trash" onClick={() => (closeMenu(), onTrash())}>
                                  <ListItemIcon>
                                      <TrashIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary="삭제" />
                              </MenuItem>,
                          ]}
                    {detail.folder === "inbox" ? (
                        <MenuItem onClick={() => (closeMenu(), onMarkUnread())}>
                            <ListItemIcon>
                                <MarkEmailUnreadOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="읽지 않음으로 표시" />
                        </MenuItem>
                    ) : null}
                    {isSpam || detail.folder === "inbox" ? <Divider /> : null}
                    {isSpam ? (
                        <MenuItem onClick={() => (closeMenu(), onRestore())}>
                            <ListItemIcon>
                                <ReportGmailerrorredOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="스팸 아님 (받은편지함으로)" />
                        </MenuItem>
                    ) : detail.folder === "inbox" ? (
                        <MenuItem onClick={() => (closeMenu(), onSpam())}>
                            <ListItemIcon>
                                <ReportGmailerrorredOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="스팸 신고" />
                        </MenuItem>
                    ) : null}
                </Menu>
                <Box sx={{ flex: 1 }} />
                {embedded ? null : (
                    <Tooltip title="닫기 (Esc)">
                        <IconButton size="small" onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>

            <Box ref={scrollRef} sx={embedded ? { minWidth: 0 } : { flex: 1, minHeight: 0, overflow: "auto" }}>
                {/* 헤더 */}
                {/* 외부 이미지 차단 박스가 보일 때는 하단 여백을 좌우 여백(16px)과 같게 */}
                <Box sx={{ px: 2, pt: 1.5, pb: hasRemoteImages && !allowRemoteImages ? 2 : 1 }}>
                    {/* [별표][제목] — 중요 토글은 제목 왼쪽. 버튼 높이를 제목 첫 줄 높이(27px)와 같게 두고 그 안에서
                        아이콘을 가운데 놓아, 제목이 여러 줄이어도 첫 줄 세로 중앙에 정확히 맞는다(오프셋 계산 불필요). */}
                    <Stack direction="row" alignItems="flex-start" spacing={0.75}>
                        <Tooltip title={detail.is_starred ? "중요 해제" : "중요 표시"}>
                            <IconButton
                                onClick={onToggleStar}
                                sx={{ p: 0, width: 27, height: 27, ml: "-2px", flexShrink: 0 }}
                            >
                                <StarRoundedIcon
                                    sx={{
                                        fontSize: 22,
                                        ...(detail.is_starred
                                            ? { color: "#f59e0b", fill: "currentColor" }
                                            : { color: "#64748b" }),
                                    }}
                                />
                            </IconButton>
                        </Tooltip>
                        <Typography
                            sx={{
                                fontSize: "18px",
                                lineHeight: "27px",
                                fontWeight: 700,
                                color: "#111",
                                wordBreak: "break-word",
                                minWidth: 0,
                            }}
                        >
                            {detail.subject || "(제목 없음)"}
                        </Typography>
                    </Stack>
                    <Box
                        sx={{
                            mt: 1,
                            display: "grid",
                            gridTemplateColumns: "72px 1fr",
                            rowGap: 0.4,
                            columnGap: 1,
                            fontSize: "13.5px",
                            color: "#111",
                        }}
                    >
                        <Typography sx={{ fontSize: "13.5px", color: "#475569" }}>보낸 사람</Typography>
                        <Typography sx={{ fontSize: "13.5px", wordBreak: "break-all" }}>
                            {detail.from ? (
                                <>
                                    {detail.from.name ? `${detail.from.name} <` : ""}
                                    {/* 주소 클릭 → 이 주소로 새 메일 작성 */}
                                    <Link
                                        component="button"
                                        type="button"
                                        underline="hover"
                                        onClick={() => onComposeTo(detail.from!.address)}
                                        sx={{ fontSize: "13.5px", verticalAlign: "baseline", wordBreak: "break-all" }}
                                    >
                                        {detail.from.address}
                                    </Link>
                                    {detail.from.name ? ">" : ""}
                                </>
                            ) : (
                                "-"
                            )}
                        </Typography>
                        <Typography sx={{ fontSize: "13.5px", color: "#475569" }}>받는 사람</Typography>
                        <Typography sx={{ fontSize: "13.5px", wordBreak: "break-all" }}>
                            {formatAddressList(detail.to) || "-"}
                        </Typography>
                        {detail.cc.length > 0 ? (
                            <>
                                <Typography sx={{ fontSize: "13.5px", color: "#475569" }}>참조</Typography>
                                <Typography sx={{ fontSize: "13.5px", wordBreak: "break-all" }}>
                                    {formatAddressList(detail.cc)}
                                </Typography>
                            </>
                        ) : null}
                        <Typography sx={{ fontSize: "13.5px", color: "#475569" }}>일시</Typography>
                        <Typography sx={{ fontSize: "13.5px" }}>{formatMailFullDate(detail.date_time)}</Typography>
                    </Box>
                    {detail.attachments.length > 0 ? (
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
                            {detail.attachments.map((att) => (
                                <AttachmentChip key={att.uuid} attachment={att} />
                            ))}
                        </Stack>
                    ) : null}
                    {hasRemoteImages && !allowRemoteImages ? (
                        <Box
                            sx={{
                                mt: 1.5,
                                py: 1,
                                pl: 2,
                                pr: 1,
                                // 차단 안내 — 테두리 없이 붉은 계열 배경
                                bgcolor: "#fef2f2",
                                borderRadius: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 2, // 차단 문구 바로 옆에 버튼(오른쪽 끝 정렬 아님)
                            }}
                        >
                            <Typography sx={{ fontSize: "13.5px", color: "#991b1b" }}>
                                외부 이미지를 차단했습니다.
                            </Typography>
                            <Button
                                size="small"
                                color="error"
                                onClick={() => setAllowRemoteImages(true)}
                                sx={{ fontSize: "13.5px" }}
                            >
                                이미지 표시
                            </Button>
                        </Box>
                    ) : null}
                </Box>
                <Divider />
                {/* 본문 */}
                <MailBodyFrame html={detail.body_html} text={detail.body_text} allowRemoteImages={allowRemoteImages} />
            </Box>
        </Box>
    );
}
