/**
 * 메일 상세 패널 — 헤더(제목/주소/일시) · 액션(답장/전체답장/전달/휴지통/복원/삭제) · 첨부 · 본문.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    ButtonBase,
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
    Typography,
} from "@mui/material";
import { Tooltip } from "../../internal/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TranslateIcon from "@mui/icons-material/Translate";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import { MailSourceDialog } from "../dialogs/MailSourceDialog";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { FolderIcon } from "../../internal/FolderIcon";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import CheckIcon from "@mui/icons-material/Check";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import { ForwardArrowIcon, ReplyAllArrowIcon, ReplyArrowIcon } from "./MailActionIcons";
import { FileTypeIcon } from "../../internal/FileTypeIcon";
import { ConfirmActionPopper } from "@ehfuse/mui-confirm-action";
import RestoreFromTrashOutlinedIcon from "@mui/icons-material/RestoreFromTrashOutlined";
import { StarRoundedIcon, TrashIcon } from "../../internal/icons";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import { ErrorAlert } from "@ehfuse/alerts";
import { useMuaConfig, useMuaSaveBlob } from "../../MuaProvider";
import { mailApi, unwrap } from "../../apis/mailApi";
import type {
    MailAttachment,
    MailMessageDetail,
    MailMoveTarget,
    MailMoveTargetOption,
    MailTranslation,
    MailReceipt,
    MailLabel,
    MailThreadEntry,
} from "../../models/types";
import { formatAddressList, formatBytes, formatMailFullDate, formatMailListDate, sendStateColor, sendStateLabel } from "../../utils/format";
import { MailBodyFrame } from "./MailBodyFrame";
import { MailLabelChips, labelColor } from "./MailLabels";
import LabelIcon from "@mui/icons-material/Label";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";

interface MessageDetailPanelProps {
    detail: MailMessageDetail | null; // 상세
    loading: boolean; // 로딩
    onClose: () => void; // 닫기
    onReply: (mode: "reply" | "replyAll" | "forward") => void; // 답장/전달
    onEditDraft: () => void; // 임시보관 이어쓰기
    onComposeTo: (address: string) => void; // 주소 클릭 → 그 주소로 새 메일 작성
    onAddContact?: (address: string, name: string) => void; // 보낸 사람을 주소록에 추가
    trustedSender?: boolean; // 보낸 사람이 주소록에 있음 — 외부 이미지를 차단하지 않고 바로 보여준다
    onToggleStar: () => void; // 중요 토글
    onMarkUnread: () => void; // 읽지 않음으로
    onTrash: () => void; // 휴지통
    onSpam: () => void; // 스팸함으로
    onRestore: () => void; // 복원(휴지통/스팸함 → 이전 폴더)
    onDeleteForever: () => void; // 영구 삭제
    moveTargets?: MailMoveTargetOption[]; // ⋮ "이동 ▸" 대상(메일함/받은편지함/스팸함/휴지통 — 우클릭 메뉴와 같다)
    onMove?: (target: MailMoveTarget) => void; // 이동 실행
    onCreateRule?: () => void; // 이 메일을 힌트로 규칙 만들기
    // 번역본 보기 상태가 바뀔 때(번역 완료/원문 보기) — 목록 행 제목을 번역 제목으로 바꾸거나 되돌린다.
    onTranslationShownChange?: (shown: boolean, translatedSubject: string | null) => void;
    /**
     * 모바일 mfd 상세 다이얼로그 본문으로 쓰일 때 true — 닫기 X 를 숨기고(제목바 ← 가 닫는다),
     * 자체 세로 스크롤러 대신 내용 높이만큼 늘어나 다이얼로그 스크롤에 맡긴다.
     */
    embedded?: boolean;
    /** 이 메일이 든 대화(2026-10-20) — 두 통 이상이면 제목 아래에 띠로 보이고, 누르면 그 메일로 바꾼다. */
    thread?: MailThreadEntry[];
    onSelectThreadMessage?: (seq: number) => void;
    /** 내 라벨 — 주면 단추줄에 라벨 단추가 생기고 제목 아래에 단 라벨이 칩으로 보인다(라벨을 켠 앱만, 2026-10-16). */
    labels?: MailLabel[];
    /** 라벨 단추 — 누른 단추 아래 좌표를 넘긴다(메뉴는 목록 화면이 띄운다: 달기·떼기·새 라벨·관리가 목록과 같은 메뉴다). */
    onOpenLabelMenu?: (position: { top: number; left: number }) => void;
}

/** "YYYY-MM-DD HH:mm:ss"(한국 시간) → "10월 11일 12:16" */
function formatOpenTime(value: string): string {
    const m = /^\d{4}-(\d{2})-(\d{2}) (\d{2}:\d{2})/.exec(value);
    return m ? `${Number(m[1])}월 ${Number(m[2])}일 ${m[3]}` : value;
}

/** 받는 사람 한 명의 수신확인 한 줄 — 주소 뒤에 읽은 때(또는 읽지 않음 · 발송 실패). */
function ReceiptLine({ receipt }: { receipt: MailReceipt }) {
    const failed = receipt.status === "failed";
    const opened = receipt.open_count > 0;
    return (
        <Typography sx={{ fontSize: "15px", lineHeight: "26px", wordBreak: "break-all" }}>
            {receipt.recipient}{" "}
            <Box component="span" sx={{ color: failed ? "#dc2626" : opened ? "#2563eb" : "#475569", whiteSpace: "nowrap" }}>
                {failed
                    ? "발송 실패"
                    : opened
                      ? `읽음 ${formatOpenTime(receipt.first_open_at)}${receipt.open_count > 1 ? ` (${receipt.open_count}회)` : ""}`
                      : "읽지 않음"}
            </Box>
        </Typography>
    );
}

/** 답장을 받지 않는 발신 전용 주소인지(noreply / no-reply / do-not-reply / donotreply). */
function isNoReplyAddress(address: string): boolean {
    return /no[-_.]?reply|do[-_.]?not[-_.]?reply/i.test(address);
}

/** 첨부 칩 — 클릭 시 앱이 미리 보기(파일 뷰어)를 주면 뷰어로, 아니면 다운로드 */
function AttachmentChip({ attachment }: { attachment: MailAttachment }) {
    const [downloading, setDownloading] = useState(false);
    const saveBlob = useMuaSaveBlob();
    // 앱의 파일 뷰어(0.3.170, 2026-10-19 사용자 지적 "PDF 인데도 뷰어로 안 열리고 바로 다운로드") — 받은 뒤 뷰어로 연다
    const previewAttachment = useMuaConfig().previewAttachment;
    const handleClick = useCallback(async () => {
        setDownloading(true);
        try {
            const bytes = await mailApi.downloadAttachment(attachment.uuid);
            const blob = new Blob([bytes], { type: attachment.mime || "application/octet-stream" });
            if (previewAttachment) {
                previewAttachment({ name: attachment.name, mime: attachment.mime || "", size: attachment.size, blob });
                return;
            }
            await saveBlob(blob, attachment.name);
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "첨부를 내려받지 못했습니다." });
        } finally {
            setDownloading(false);
        }
    }, [attachment, saveBlob, previewAttachment]);
    return (
        <Chip
            icon={
                downloading ? (
                    <CircularProgress size={14} />
                ) : (
                    <FileTypeIcon name={attachment.name} mime={attachment.mime} size={20} />
                )
            }
            label={`${attachment.name} (${formatBytes(attachment.size)})`}
            variant="outlined"
            onClick={() => void handleClick()}
            disabled={downloading}
            // 최대 폭은 줄 폭까지(100%) — 360px 로 박혀 있어 폰(남는 폭 약 343px)에서 긴 파일명이 화면을 밀어냈다(0.3.170). 넘치면 말줄임
            sx={{ fontSize: "13.5px", color: "#111", maxWidth: "min(360px, 100%)", pl: 0.75, "& .MuiChip-icon": { ml: 0.5 } }}
        />
    );
}

/** 메시지별 AI 번역 캐시(세션 메모리) — 같은 메일을 다시 열어도 LLM 을 또 부르지 않는다. */
const translationCache = new Map<number, MailTranslation>();


/**
 * 본문이 주로 한국어인지 — 태그·data: 주소를 걷어낸 앞부분 4천 자에서 한글 음절이 영문 글자 이상이면 한국어로 본다.
 * 한국어 메일에도 영문 제품명·주소가 섞이므로 "영문이 하나라도 있으면" 이 아니라 수를 견준다.
 */
function isMostlyKorean(raw: string): boolean {
    const text = raw
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
        .replace(/data:[^"')\s]+/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/https?:\/\/\S+/gi, "")
        .slice(0, 4000);
    const hangul = (text.match(/[\uac00-\ud7a3]/g) ?? []).length;
    const latin = (text.match(/[A-Za-z]/g) ?? []).length;
    return hangul > 0 && hangul >= latin;
}

/** 상세 패널 컴포넌트 */
/** ⋮ 메뉴 줄 모양 — 목록 우클릭 메뉴(internal/ContextMenu)와 같은 글자 15px · 아이콘 20px · 위아래 8px. */
const MENU_COMPACT_SX = {
    "& .MuiMenuItem-root": { minHeight: 0, py: 1, px: 2 },
    "& .MuiListItemText-primary": { fontSize: 15 },
    "& .MuiListItemIcon-root": { minWidth: 30 },
    "& .MuiListItemIcon-root .MuiSvgIcon-root": { fontSize: 20 },
} as const;

export function MessageDetailPanel(props: MessageDetailPanelProps) {
    const {
        detail,
        loading,
        onClose,
        onReply,
        onEditDraft,
        onComposeTo,
        onAddContact,
        trustedSender = false,
        onToggleStar,
        onMarkUnread,
        onTrash,
        onSpam,
        onRestore,
        onDeleteForever,
        moveTargets = [],
        onMove,
        onCreateRule,
        onTranslationShownChange,
        embedded = false,
        thread = [],
        onSelectThreadMessage,
        labels,
        onOpenLabelMenu,
    } = props;
    // 다시 보내기를 누르면 서버가 답하는 대로 "보내는 중" 으로 바꿔 그린다 — 목록은 실시간 알림으로 따로 갱신된다.
    const [resentSeq, setResentSeq] = useState(0);
    const sendState = detail && resentSeq === detail.seq ? "sending" : (detail?.send_state ?? "");
    const handleResend = async () => {
        if (!detail) return;
        try {
            unwrap(await mailApi.resend(detail.seq), "다시 보내지 못했습니다.");
            setResentSeq(detail.seq);
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "다시 보내지 못했습니다." });
        }
    };
    const [allowRemoteImages, setAllowRemoteImages] = useState(false);
    // 스팸 신고/삭제/영구 삭제 확인 팝퍼(앵커 = 누른 아이콘 버튼)
    const [confirm, setConfirm] = useState<{
        anchorEl: HTMLElement | null;
        kind: "spam" | "trash" | "delete";
    } | null>(null);
    const askConfirm = (kind: "spam" | "trash" | "delete", anchorEl: HTMLElement | null) =>
        setConfirm({ anchorEl, kind });
    const runConfirmed = () => {
        const kind = confirm?.kind;
        setConfirm(null);
        if (kind === "spam") onSpam();
        else if (kind === "trash") onTrash();
        else if (kind === "delete") onDeleteForever();
    };
    // ⋮ 더보기 메뉴
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [sourceOpen, setSourceOpen] = useState(false);
    // "이동 ▸" 서브메뉴 앵커(⋮ 메뉴 항목 오른쪽에 붙는다)
    const [moveAnchor, setMoveAnchor] = useState<HTMLElement | null>(null);
    // AI 번역 — 결과(캐시 적재)·진행 중·번역본 표시 여부. 다른 메일로 바뀌면 원문 표시로 돌아간다.
    const [translation, setTranslation] = useState<MailTranslation | null>(null);
    const [translating, setTranslating] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    // 본문 복사 — 잠시 ✓ 로 복사됨을 알린다.
    const [bodyCopied, setBodyCopied] = useState(false);
    /** 본문(평문 우선, 없으면 HTML 태그 제거)을 클립보드에 복사한다. */
    const copyBody = useCallback(() => {
        if (!detail) return;
        const text =
            detail.body_text ||
            detail.body_html
                .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, "\n")
                .replace(/<[^>]+>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/\n{3,}/g, "\n\n")
                .trim();
        void navigator.clipboard.writeText(text).then(() => {
            setBodyCopied(true);
            window.setTimeout(() => setBodyCopied(false), 1500);
        });
    }, [detail]);
    const closeMenu = useCallback(() => setMenuAnchor(null), []);
    // 선택 메일이 바뀌면 상세 스크롤을 맨 위로
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const detailSeq = detail?.seq ?? 0;
    // 저장된 번역(서버 blob)이 있으면 그것으로 복원하고, 보기 상태도 저장값을 따른다(새로고침해도 번역본 유지).
    useEffect(() => {
        const stored = detail?.translation ?? null;
        if (stored) translationCache.set(detailSeq, stored);
        setTranslation(stored ?? translationCache.get(detailSeq) ?? null);
        setShowTranslation(Boolean(stored && detail?.translation_shown));
        setTranslating(false);
        // detail 객체 자체가 아니라 메일(seq)이 바뀔 때만 초기화한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailSeq]);
    const onTranslationShownChangeRef = useRef(onTranslationShownChange);
    onTranslationShownChangeRef.current = onTranslationShownChange;
    /** 번역본/원문 보기 상태를 바꾸고 서버에도 저장한다(실패는 조용히 — 화면 상태가 우선). 목록 제목도 함께 바꾼다. */
    const toggleShowTranslation = useCallback(
        (next: boolean) => {
            setShowTranslation(next);
            if (detailSeq) void mailApi.patchMessage(detailSeq, { translation_shown: next }).catch(() => undefined);
            onTranslationShownChangeRef.current?.(next, next ? (translation?.subject ?? null) : null);
        },
        [detailSeq, translation]
    );
    /** AI 번역 버튼 — 번역본이 있으면 원문/번역 토글, 없으면 서버(Gemini)에 요청한다. */
    const handleTranslate = useCallback(async () => {
        if (!detailSeq || translating) return;
        if (translation) {
            toggleShowTranslation(!showTranslation);
            return;
        }
        setTranslating(true);
        try {
            const res = await mailApi.translateMessage(detailSeq);
            const next = res.data;
            translationCache.set(detailSeq, next);
            setTranslation(next);
            setShowTranslation(true);
            // 목록 제목도 번역 제목으로(서버는 translate 시 translation_shown=true 로 저장한다).
            onTranslationShownChangeRef.current?.(true, next.subject ?? null);
        } catch (err) {
            ErrorAlert(err instanceof Error ? err.message : "AI 번역에 실패했습니다.");
        } finally {
            setTranslating(false);
        }
    }, [detailSeq, translating, translation, showTranslation, toggleShowTranslation]);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [detailSeq]);
    // 수신확인을 켜고 보낸 메일이면 받는 사람별 기록을 읽는다 — 메일을 열 때마다 새로 읽어 그사이 열어 본 것이 보인다.
    const hasReceipts = Boolean(detail?.read_receipt);
    const [receipts, setReceipts] = useState<MailReceipt[]>([]);
    useEffect(() => {
        setReceipts([]);
        if (!detailSeq || !hasReceipts) return;
        let alive = true;
        void mailApi
            .receipts(detailSeq)
            .then((res) => {
                if (alive) setReceipts(res?.data?.items ?? []);
            })
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, [detailSeq, hasReceipts]);

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
    // 이미 한국어인 메일은 번역할 것이 없다 — 번역본을 보는 중("원문 보기")이 아니면 단추를 숨긴다.
    const koreanMail = isMostlyKorean(`${detail.subject ?? ""}\n${detail.body_text || detail.body_html || ""}`);
    const canReplyAll = detail.cc.length > 0;
    const hasRemoteImages = /<img\b[^>]*\ssrc\s*=\s*["'](https?:)?\/\//i.test(detail.body_html || "");
    // 신뢰 발신자(주소록)면 차단 안내 없이 바로 표시한다.
    const showRemoteImages = allowRemoteImages || trustedSender;
    const hasAttachments = detail.attachments.length > 0;

    return (
        <Box
            sx={{
                height: embedded ? "auto" : "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                bgcolor: "#fff",
                // 목록 래퍼의 userSelect:none(행 드래그 선택 방지)을 상세에서는 풀어 제목/본문을 복사할 수 있게
                userSelect: "text",
            }}
        >
            {/* 액션 바 */}
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ px: 1.5, py: 1, borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", rowGap: 0.5 }}
            >
                {/* 모바일(embedded)은 아이콘 줄을 통째로 오른쪽에 붙인다(2026-10-12 사용자 지시) — 앞에 빈 칸을 두어 민다.
                    전에는 ⋮ 만 오른쪽 끝이고 나머지는 왼쪽이라, 한 손으로 쥔 폰에서 자주 누르는 답장·삭제가 엄지에서 멀었다.
                    데스크톱은 아이콘 줄이 왼쪽에서 이어지고 닫기 X 만 오른쪽이다. */}
                {embedded ? <Box sx={{ flex: 1 }} /> : null}
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
                        {/* 전체 답장 — 참조가 있을 때만 보인다(없으면 답장과 같다) */}
                        {canReplyAll ? (
                            <Tooltip title="전체 답장">
                                <IconButton size="small" onClick={() => onReply("replyAll")}>
                                    <ReplyAllArrowIcon />
                                </IconButton>
                            </Tooltip>
                        ) : null}
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
                        <IconButton size="small" onClick={(e) => askConfirm("spam", e.currentTarget)}>
                            <ReportGmailerrorredOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                ) : null}
                {/* 라벨 — 단 라벨이 있으면 첫 라벨 색으로 채운다(목록 행의 라벨 단추와 같은 모양). */}
                {labels && onOpenLabelMenu && !isDraft ? (
                    <Tooltip title="라벨">
                        <IconButton
                            size="small"
                            aria-label="라벨"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                onOpenLabelMenu({ top: rect.bottom, left: rect.left });
                            }}
                        >
                            {(() => {
                                const first = labels.find((label) => detail.label_seqs?.includes(label.seq));
                                return first ? <LabelIcon sx={{ color: labelColor(first) }} /> : <LabelOutlinedIcon />;
                            })()}
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
                            <IconButton size="small" onClick={(e) => askConfirm("delete", e.currentTarget)}>
                                <TrashIcon />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <Tooltip title="삭제">
                        <IconButton size="small" onClick={(e) => askConfirm("trash", e.currentTarget)}>
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
                    // 글자 · 아이콘 · 줄 높이는 목록 우클릭 메뉴(ContextMenu)와 같은 값 — MUI 기본(16px · 줄 48)은 커 보였다(2026-10-20 사용자 지적).
                    slotProps={{ paper: { sx: { minWidth: 220, ...MENU_COMPACT_SX } }, transition: { timeout: 0 } }}
                >
                    {!isDraft
                        ? [
                              <MenuItem key="reply" onClick={() => (closeMenu(), onReply("reply"))}>
                                  <ListItemIcon>
                                      <ReplyArrowIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary="답장" />
                              </MenuItem>,
                              ...(canReplyAll
                                  ? [
                                        <MenuItem key="replyAll" onClick={() => (closeMenu(), onReply("replyAll"))}>
                                            <ListItemIcon>
                                                <ReplyAllArrowIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="전체 답장" />
                                        </MenuItem>,
                                    ]
                                  : []),
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
                              <MenuItem key="forever" onClick={() => (closeMenu(), askConfirm("delete", menuAnchor))}>
                                  <ListItemIcon>
                                      <TrashIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary="영구 삭제" />
                              </MenuItem>,
                          ]
                        : [
                              <MenuItem key="trash" onClick={() => (closeMenu(), askConfirm("trash", menuAnchor))}>
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
                    {/* 이동 ▸ / 규칙 만들기 — 우클릭 메뉴와 같은 항목(임시보관은 제외) */}
                    {!isDraft
                        ? [
                              <Divider key="d-move" />,
                              ...(moveTargets.length > 0 && onMove
                                  ? [
                                        <MenuItem key="move" onClick={(e) => setMoveAnchor(e.currentTarget)}>
                                            <ListItemIcon>
                                                <DriveFileMoveOutlinedIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="이동" />
                                            <ArrowRightIcon fontSize="small" sx={{ color: "#64748b", ml: 1 }} />
                                        </MenuItem>,
                                    ]
                                  : []),
                              ...(onCreateRule
                                  ? [
                                        <MenuItem key="rule" onClick={() => (closeMenu(), onCreateRule())}>
                                            <ListItemIcon>
                                                <RuleOutlinedIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="규칙 만들기" />
                                        </MenuItem>,
                                    ]
                                  : []),
                              // 원문 보기 — 받은 경로 · 인증 헤더를 확인할 때(2026-10-20).
                              <MenuItem key="source" onClick={() => (closeMenu(), setSourceOpen(true))}>
                                  <ListItemIcon>
                                      <CodeOutlinedIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary="원문 보기" />
                              </MenuItem>,
                          ]
                        : null}
                    {isSpam || detail.folder === "inbox" ? <Divider /> : null}
                    {isSpam ? (
                        <MenuItem onClick={() => (closeMenu(), onRestore())}>
                            <ListItemIcon>
                                <ReportGmailerrorredOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="스팸 아님 (받은편지함으로)" />
                        </MenuItem>
                    ) : detail.folder === "inbox" ? (
                        <MenuItem onClick={() => (closeMenu(), askConfirm("spam", menuAnchor))}>
                            <ListItemIcon>
                                <ReportGmailerrorredOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="스팸 신고" />
                        </MenuItem>
                    ) : null}
                </Menu>
                <MailSourceDialog open={sourceOpen} seq={sourceOpen ? detail.seq : 0} onClose={() => setSourceOpen(false)} />
                {/* 이동 ▸ 서브메뉴 — 항목 오른쪽에 붙여 연다. 고르면 두 메뉴를 모두 닫고 이동한다. */}
                <Menu
                    anchorEl={moveAnchor}
                    open={Boolean(moveAnchor)}
                    onClose={() => setMoveAnchor(null)}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    slotProps={{ paper: { sx: { minWidth: 200, ...MENU_COMPACT_SX } }, transition: { timeout: 0 } }}
                >
                    {moveTargets.map((t) => (
                        <MenuItem
                            key={t.key}
                            onClick={() => {
                                setMoveAnchor(null);
                                closeMenu();
                                onMove?.(t.target);
                            }}
                        >
                            <ListItemIcon>
                                {t.target.folder === "custom" ? (
                                    <FolderIcon
                                        icon={t.folder?.icon}
                                        color={t.folder?.color}
                                        shared={t.folder?.scope === "shared"}
                                        fontSize={20}
                                    />
                                ) : t.target.folder === "spam" ? (
                                    <ReportGmailerrorredOutlinedIcon fontSize="small" />
                                ) : t.target.folder === "trash" ? (
                                    <TrashIcon fontSize="small" />
                                ) : (
                                    <InboxOutlinedIcon fontSize="small" />
                                )}
                            </ListItemIcon>
                            <ListItemText primary={t.label} />
                        </MenuItem>
                    ))}
                </Menu>
                {embedded ? null : <Box sx={{ flex: 1 }} />}
                {embedded ? null : (
                    <Tooltip title="닫기 (Esc)">
                        <IconButton size="small" onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>
            <ConfirmActionPopper
                open={Boolean(confirm)}
                anchorEl={confirm?.anchorEl ?? null}
                placement="bottom"
                zIndex={1400}
                title={
                    confirm?.kind === "spam"
                        ? "이 메일을 스팸으로 신고할까요?"
                        : confirm?.kind === "delete"
                          ? "이 메일을 영구 삭제할까요? 되돌릴 수 없습니다."
                          : "이 메일을 삭제할까요?"
                }
                confirmText={confirm?.kind === "spam" ? "스팸 신고" : confirm?.kind === "delete" ? "영구 삭제" : "삭제"}
                cancelText="취소"
                onCancel={() => setConfirm(null)}
                onConfirm={runConfirmed}
            />

            <Box ref={scrollRef} sx={embedded ? { minWidth: 0 } : { flex: 1, minHeight: 0, overflow: "auto" }}>
                {/* 헤더 */}
                {/* 첨부 칩이나 외부 이미지 차단 박스가 보일 때는 하단 여백을 좌우 여백(16px)과 같게.
                    분할·드로어(자체 스크롤)에서는 머리(제목·보낸 사람·첨부)를 위에 붙여 두고 본문만 스크롤한다(2026-10-16 —
                    긴 메일을 내리면 제목과 보낸 사람이 사라져 무슨 메일인지 잃었다). 모바일(embedded)은 화면이 좁아 머리째 스크롤한다. */}
                <Box
                    sx={{
                        px: 2,
                        pt: 1.5,
                        pb: hasAttachments || (hasRemoteImages && !showRemoteImages) ? 2 : 1,
                        ...(embedded ? {} : { position: "sticky", top: 0, zIndex: 1, bgcolor: "background.paper" }),
                    }}
                >
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
                            {/* 번역본 보기 상태면 제목도 번역 제목으로(원문 보기로 되돌리면 원문 제목). */}
                            {(showTranslation && translation?.subject) || detail.subject || "(제목 없음)"}
                        </Typography>
                    </Stack>
                    {/* 단 라벨 — 제목 글자 줄에 맞춰(별표 칸 27px + 간격 6px 만큼 들여) 둔다. */}
                    {labels && detail.label_seqs && detail.label_seqs.some((seq) => labels.some((l) => l.seq === seq)) ? (
                        <Box sx={{ mt: 0.75, pl: "31px", display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            <MailLabelChips seqs={detail.label_seqs} labels={labels} maxWidth={200} />
                        </Box>
                    ) : null}
                    <Box
                        sx={{
                            mt: 1,
                            display: "grid",
                            gridTemplateColumns: "72px 1fr",
                            rowGap: 0.4,
                            columnGap: 1,
                            fontSize: "15px",
                            lineHeight: "26px",
                            color: "#111",
                        }}
                    >
                        <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#475569" }}>
                            보낸 사람
                        </Typography>
                        {/* 보낸 사람 — 텍스트(flex 1) + 주소록 추가 아이콘을 별도 칸으로 둔다.
                            인라인으로 끼우면 긴 주소가 줄바꿈될 때 아이콘이 밀리거나 잘려 모바일에서 안 보였다(2026-08-30). */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", columnGap: 0.5, minWidth: 0 }}>
                            <Typography
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    fontSize: "15px",
                                    lineHeight: "26px",
                                    wordBreak: "break-all",
                                }}
                            >
                                {detail.from ? (
                                    <>
                                        {detail.from.name ? `${detail.from.name} <` : ""}
                                        {/* 주소 클릭 → 이 주소로 새 메일 작성 (noreply 류 발신 전용 주소는 링크 없이 표시) */}
                                        {isNoReplyAddress(detail.from.address) ? (
                                            <span style={{ wordBreak: "break-all" }}>{detail.from.address}</span>
                                        ) : (
                                            <Link
                                                component="button"
                                                type="button"
                                                underline="hover"
                                                onClick={() => onComposeTo(detail.from!.address)}
                                                sx={{
                                                    fontSize: "15px",
                                                    lineHeight: "26px",
                                                    verticalAlign: "baseline",
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                {detail.from.address}
                                            </Link>
                                        )}
                                        {detail.from.name ? ">" : ""}
                                    </>
                                ) : (
                                    "-"
                                )}
                            </Typography>
                            {/* 주소록 추가 — 주소록에 없는 보낸 사람에게만. 줄 높이(26px)에 맞춘 버튼, 모바일은 터치 크기. */}
                            {detail.from && onAddContact ? (
                                <Tooltip title="주소록에 추가">
                                    <IconButton
                                        size="small"
                                        aria-label="주소록에 추가"
                                        onClick={() => onAddContact(detail.from!.address, detail.from!.name ?? "")}
                                        sx={{
                                            p: 0,
                                            width: embedded ? 32 : 26,
                                            height: embedded ? 32 : 26,
                                            mt: embedded ? "-3px" : 0,
                                            flexShrink: 0,
                                            color: "#2563eb",
                                        }}
                                    >
                                        <PersonAddAlt1OutlinedIcon sx={{ fontSize: embedded ? 22 : 18 }} />
                                    </IconButton>
                                </Tooltip>
                            ) : null}
                        </Box>
                        <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#475569" }}>
                            받는 사람
                        </Typography>
                        <Typography sx={{ fontSize: "15px", lineHeight: "26px", wordBreak: "break-all" }}>
                            {formatAddressList(detail.to) || "-"}
                        </Typography>
                        {detail.cc.length > 0 ? (
                            <>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#475569" }}>
                                    참조
                                </Typography>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px", wordBreak: "break-all" }}>
                                    {formatAddressList(detail.cc)}
                                </Typography>
                            </>
                        ) : null}
                        <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#475569" }}>일시</Typography>
                        <Typography sx={{ fontSize: "15px", lineHeight: "26px" }}>
                            {formatMailFullDate(detail.date_time)}
                        </Typography>
                        {detail.send_at ? (
                            <>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#475569" }}>
                                    예약 발송
                                </Typography>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px" }}>
                                    {formatMailFullDate(detail.send_at)}
                                </Typography>
                            </>
                        ) : null}
                        {sendState === "sending" ? (
                            <>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#475569" }}>발송</Typography>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: sendStateColor(sendState) }}>
                                    {sendStateLabel(sendState)}
                                </Typography>
                            </>
                        ) : null}
                        {detail.send_error && sendState !== "sending" ? (
                            <>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#475569" }}>
                                    {sendStateLabel(sendState) || "예약 실패"}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap", minWidth: 0 }}>
                                    <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#dc2626", wordBreak: "break-all", minWidth: 0 }}>
                                        {detail.send_error}
                                    </Typography>
                                    {/* 일부만 실패한 메일은 다시 보내지 않는다 — 이미 받은 사람에게 또 간다. */}
                                    {sendState === "failed" ? (
                                        <Button variant="outlined" size="small" onClick={handleResend} sx={{ flexShrink: 0, fontSize: "14px" }}>
                                            다시 보내기
                                        </Button>
                                    ) : null}
                                </Box>
                            </>
                        ) : null}
                        {detail.secure ? (
                            <>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#475569" }}>
                                    보안메일
                                </Typography>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px", wordBreak: "break-all" }}>
                                    {`${formatOpenTime(detail.secure.expires_at)}까지 열람`}
                                    {detail.secure.hint ? ` · 힌트: ${detail.secure.hint}` : ""}
                                </Typography>
                            </>
                        ) : null}
                        {receipts.length > 0 ? (
                            <>
                                <Typography sx={{ fontSize: "15px", lineHeight: "26px", color: "#475569" }}>
                                    수신확인
                                </Typography>
                                <Box sx={{ minWidth: 0 }}>
                                    {receipts.map((receipt) => (
                                        <ReceiptLine key={`${receipt.kind}:${receipt.recipient}`} receipt={receipt} />
                                    ))}
                                </Box>
                            </>
                        ) : null}
                    </Box>
                    {detail.attachments.length > 0 ? (
                        <Stack direction="row" useFlexGap spacing={1.5} sx={{ mt: 1.5, flexWrap: "wrap", minWidth: 0 }}>
                            {detail.attachments.map((att) => (
                                <AttachmentChip key={att.uuid} attachment={att} />
                            ))}
                        </Stack>
                    ) : null}
                    {hasRemoteImages && !showRemoteImages ? (
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
                                gap: 2, // 데스크탑은 차단 문구 바로 옆에 버튼
                                // 모바일(md 미만)은 폭이 좁아 버튼을 오른쪽 끝으로 보낸다(2026-09-03 사용자 요청).
                                justifyContent: { xs: "space-between", md: "flex-start" },
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
                {/* 대화 띠(2026-10-20) — 같은 대화의 메일들(오래된 것부터). 보고 있는 메일을 칠하고, 다른 줄을 누르면 그 메일을 연다. */}
                {thread.length > 1 && (
                    <Box sx={{ mx: 2, mb: 1.5, border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden" }}>
                        <Typography sx={{ px: 1.5, py: 0.75, fontSize: 14, fontWeight: 600, color: "#475569", bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            이 대화 {thread.length}통
                        </Typography>
                        {thread.map((item) => {
                            const current = item.seq === detail.seq;
                            return (
                                <ButtonBase
                                    key={item.seq}
                                    onClick={() => !current && onSelectThreadMessage?.(item.seq)}
                                    aria-current={current ? "true" : undefined}
                                    sx={{
                                        display: "flex",
                                        width: "100%",
                                        alignItems: "baseline",
                                        gap: 1.5,
                                        px: 1.5,
                                        py: 1,
                                        textAlign: "left",
                                        fontSize: 14,
                                        bgcolor: current ? "#eff6ff" : "transparent",
                                        boxShadow: current ? "inset 3px 0 0 #3b82f6" : "none",
                                        "&:not(:last-of-type)": { borderBottom: "1px solid #f1f5f9" },
                                        "&:hover": current ? undefined : { bgcolor: "#f8fafc" },
                                    }}
                                >
                                    <Box component="span" sx={{ flexShrink: 0, maxWidth: "40%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: item.is_read ? 500 : 700, color: "#111827" }}>
                                        {item.folder === "sent" || item.folder === "draft" ? `나 → ${item.to_summary || ""}` : item.from_name || item.from_address || "(발신자 없음)"}
                                    </Box>
                                    <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b" }}>
                                        {item.snippet || item.subject || ""}
                                    </Box>
                                    <Box component="span" sx={{ flexShrink: 0, color: "#64748b" }}>
                                        {formatMailListDate(item.date_time)}
                                    </Box>
                                </ButtonBase>
                            );
                        })}
                    </Box>
                )}
                {/* 본문 도구 — 내용에 관한 도구(복사·번역)는 본문 바로 위에 둔다(헤더 액션 바는 메일 단위 조작 전용). */}
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-start"
                    spacing={0.5}
                    // 상단 여백은 좌우 여백(16px)과 같게
                    sx={{ px: 2, pt: 2 }}
                >
                    {/* 본문 복사 — 번역하기 왼쪽 */}
                    <Tooltip title="본문 복사">
                        <IconButton size="small" onClick={copyBody} aria-label="본문 복사">
                            {bodyCopied ? (
                                <CheckIcon sx={{ fontSize: 20, color: "#2f9e5b" }} />
                            ) : (
                                <ContentCopyOutlinedIcon sx={{ fontSize: 20 }} />
                            )}
                        </IconButton>
                    </Tooltip>
                    {!isDraft && (!koreanMail || (translation && showTranslation)) ? (
                        <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            disabled={translating}
                            startIcon={
                                translating ? <CircularProgress size={16} /> : <TranslateIcon sx={{ fontSize: 18 }} />
                            }
                            onClick={() => void handleTranslate()}
                            sx={{ fontSize: "14px", color: "#334155", borderColor: "#cbd5e1" }}
                        >
                            {translation && showTranslation ? "원문 보기" : "번역하기"}
                        </Button>
                    ) : null}
                </Stack>
                {/* AI 번역 배너 — 번역본을 보는 동안 안내(16px)와 내용 요약(15px, 길면 개행)을 보여준다. */}
                {showTranslation && translation ? (
                    <Box
                        sx={{
                            mx: 2,
                            mt: 1,
                            px: 1.5,
                            py: 1.25,
                            bgcolor: "#eef4ff",
                            border: "1px solid #c7d7fe",
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        {/* 아이콘 좌우 여백은 같게(왼쪽 px 1.5 + mx 0.5 = 오른쪽 gap 2) */}
                        <TranslateIcon sx={{ fontSize: 30, color: "#2563eb", flexShrink: 0, mx: 1.5 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 16, color: "#1e3a8a", fontWeight: 600 }}>
                                AI 번역 (Gemini) · 원문과 다를 수 있습니다
                            </Typography>
                            {translation.summary ? (
                                <Typography
                                    sx={{
                                        fontSize: 15,
                                        color: "#111",
                                        mt: 0.25,
                                        lineHeight: 1.5,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {translation.summary}
                                </Typography>
                            ) : null}
                        </Box>
                    </Box>
                ) : null}
                {/* 본문 — 번역본을 볼 때는 번역된 HTML/평문을 같은 뷰어(sanitize·iframe)로 그린다. */}
                {showTranslation && translation ? (
                    <MailBodyFrame
                        html={translation.body_html}
                        text={translation.body_text}
                        allowRemoteImages={showRemoteImages}
                    />
                ) : (
                    <MailBodyFrame
                        html={detail.body_html}
                        text={detail.body_text}
                        allowRemoteImages={showRemoteImages}
                    />
                )}
            </Box>
        </Box>
    );
}
