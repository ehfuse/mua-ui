/**
 * 규칙 목록(메일 관리 다이얼로그의 "규칙" 탭) — 규칙마다 조건 요약·동작 요약·사용 스위치·[지금 적용]·수정·삭제.
 */

import { useCallback, useEffect, useState } from "react";
import { Box, IconButton, Stack, Switch, Typography } from "@mui/material";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { ConfirmDialog, ErrorAlert, SuccessAlert } from "@ehfuse/alerts";
import { mailApi, unwrap } from "../../apis/mailApi";
import { TrashIcon } from "../../internal/icons";
import { Tooltip } from "../../internal/Tooltip";
import type { MailRule, MailUserFolder } from "../../models/types";

interface MailRulesListProps {
    rules: MailRule[]; // 규칙 목록
    folders: MailUserFolder[]; // 메일함(동작 요약용)
    onEdit: (rule: MailRule) => void; // 규칙 수정
    onChanged: () => void; // 변경 후(목록·메일 재조회)
}

const FIELD_LABEL: Record<string, string> = { from: "보낸 사람", to: "받는 사람", subject: "제목", body: "본문" };
const OP_LABEL: Record<string, string> = {
    contains: "포함",
    not_contains: "포함 안 함",
    equals: "일치",
    starts: "시작",
    ends: "끝",
};

/** 조건 요약 */
function summarizeConditions(rule: MailRule): string {
    const parts = rule.conditions.map(
        (c) => `${FIELD_LABEL[c.field] ?? c.field}이(가) "${c.value}" ${OP_LABEL[c.op] ?? c.op}`
    );
    return parts.join(rule.match === "any" ? " 또는 " : " 그리고 ");
}

/** 동작 요약 */
function summarizeActions(rule: MailRule, folders: MailUserFolder[]): string {
    const a = rule.actions;
    const parts: string[] = [];
    if (a.move_to === "custom")
        parts.push(`"${folders.find((f) => f.seq === a.mail_folder_seq)?.name ?? "메일함"}"(으)로 이동`);
    else if (a.move_to === "spam") parts.push("스팸함으로 이동");
    else if (a.move_to === "trash") parts.push("휴지통으로 이동");
    else if (a.move_to === "inbox") parts.push("받은편지함으로 이동");
    if (a.mark_read) parts.push("읽음으로 표시");
    if (a.star) parts.push("중요 표시");
    return parts.join(" · ") || "-";
}

/** 규칙 한 줄 */
function RuleRow({
    rule,
    folders,
    onEdit,
    onChanged,
}: {
    rule: MailRule;
    folders: MailUserFolder[];
    onEdit: () => void;
    onChanged: () => void;
}) {
    const [applying, setApplying] = useState(false);
    // 드래그 정렬(핸들에서만 시작)
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: rule.seq,
    });
    const toggle = useCallback(
        async (enabled: boolean) => {
            try {
                unwrap(await mailApi.updateRule(rule.seq, { enabled }), "저장하지 못했습니다.");
                onChanged();
            } catch (error) {
                ErrorAlert({ message: error instanceof Error ? error.message : "저장하지 못했습니다." });
            }
        },
        [rule.seq, onChanged]
    );
    const apply = useCallback(async () => {
        setApplying(true);
        try {
            const res = unwrap(await mailApi.applyRules(rule.seq), "규칙을 적용하지 못했습니다.");
            SuccessAlert(`받은편지함 ${res.scanned}건 중 ${res.affected}건에 적용했습니다.`);
            onChanged();
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "규칙을 적용하지 못했습니다." });
        } finally {
            setApplying(false);
        }
    }, [rule.seq, onChanged]);
    const remove = useCallback(() => {
        ConfirmDialog({
            title: "규칙 삭제",
            message: `"${rule.name || summarizeConditions(rule)}" 규칙을 삭제하시겠습니까?`,
            onConfirm: () =>
                void (async () => {
                    try {
                        unwrap(await mailApi.deleteRule(rule.seq), "규칙을 삭제하지 못했습니다.");
                        onChanged();
                    } catch (error) {
                        ErrorAlert({ message: error instanceof Error ? error.message : "규칙을 삭제하지 못했습니다." });
                    }
                })(),
        });
    }, [rule, onChanged]);
    return (
        <Box
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            sx={{
                display: "grid",
                gridTemplateColumns: "auto auto minmax(0, 1fr) auto",
                position: "relative",
                zIndex: isDragging ? 1 : undefined,
                boxShadow: isDragging ? "0 6px 16px rgba(15,23,42,0.18)" : undefined,
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.25,
                border: "1px solid #e2e8f0",
                borderRadius: 1.5,
                bgcolor: "#fff",
                opacity: rule.enabled ? 1 : 0.6,
            }}
        >
            {/* 드래그 핸들 — 왼쪽 세로 중앙(규칙은 위에서부터 차례로 적용되므로 순서가 의미 있다) */}
            <Box
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                aria-label="순서 이동"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    alignSelf: "center",
                    cursor: isDragging ? "grabbing" : "grab",
                    color: "#94a3b8",
                    touchAction: "none",
                    mr: -0.5,
                    "&:hover": { color: "#475569" },
                }}
            >
                <DragIndicatorIcon fontSize="small" />
            </Box>
            <Tooltip title={rule.enabled ? "사용 중 — 끄기" : "사용 안 함 — 켜기"}>
                <Switch checked={rule.enabled} onChange={(_, v) => void toggle(v)} />
            </Tooltip>
            <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: "16px", fontWeight: 700, color: "#111" }}>
                    {rule.name || "(이름 없음)"}
                </Typography>
                <Typography sx={{ fontSize: "15px", color: "#111", mt: 0.25, wordBreak: "break-word" }}>
                    {summarizeConditions(rule)}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                    <ArrowForwardIcon sx={{ fontSize: 16, color: "#1d4ed8" }} />
                    <Typography sx={{ fontSize: "15px", color: "#1d4ed8" }}>
                        {summarizeActions(rule, folders)}
                    </Typography>
                </Stack>
            </Box>
            <Stack direction="row" spacing={0.25} alignItems="center">
                <Tooltip title="지금 적용 (받은편지함의 기존 메일에)">
                    <span>
                        <IconButton
                            size="small"
                            onClick={() => void apply()}
                            disabled={applying || !rule.enabled}
                            aria-label="지금 적용"
                        >
                            <PlayArrowIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="수정">
                    <IconButton size="small" onClick={onEdit} aria-label="수정">
                        <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="삭제">
                    <IconButton size="small" onClick={remove} aria-label="삭제">
                        <TrashIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Box>
    );
}

/** 규칙 목록(드래그로 순서 변경 → 서버 저장) */
export function MailRulesList({ rules, folders, onEdit, onChanged }: MailRulesListProps) {
    // 드래그 중 즉시 반영하려고 로컬 순서를 두고, 서버 목록이 바뀌면 다시 맞춘다
    const [ordered, setOrdered] = useState<MailRule[]>(rules);
    useEffect(() => setOrdered(rules), [rules]);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const from = ordered.findIndex((r) => r.seq === active.id);
            const to = ordered.findIndex((r) => r.seq === over.id);
            if (from < 0 || to < 0) return;
            const next = arrayMove(ordered, from, to);
            setOrdered(next);
            void (async () => {
                try {
                    unwrap(await mailApi.reorderRules(next.map((r) => r.seq)), "순서를 저장하지 못했습니다.");
                    onChanged();
                } catch (error) {
                    ErrorAlert({ message: error instanceof Error ? error.message : "순서를 저장하지 못했습니다." });
                    setOrdered(rules);
                }
            })();
        },
        [ordered, rules, onChanged]
    );
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            {/* 설명 — 테두리 없는 색상 박스, 검정 15px */}
            <Typography
                sx={{
                    fontSize: "15px",
                    color: "#111",
                    bgcolor: "#f1f5f9",
                    borderRadius: 1,
                    px: 2,
                    py: 1.5,
                    lineHeight: 1.6,
                }}
            >
                규칙은 새 메일을 받을 때 위에서부터 차례로 적용됩니다(왼쪽 핸들을 끌어 순서를 바꿀 수 있습니다). 기존
                메일에는 각 규칙의 ▶(지금 적용)으로 적용할 수 있습니다.
            </Typography>
            {ordered.length === 0 ? (
                <Typography sx={{ fontSize: "15px", color: "#111", py: 2, textAlign: "center" }}>
                    만든 규칙이 없습니다. 아래 [규칙 추가]로 만드세요.
                </Typography>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={ordered.map((r) => r.seq)} strategy={verticalListSortingStrategy}>
                        {ordered.map((rule) => (
                            <RuleRow
                                key={rule.seq}
                                rule={rule}
                                folders={folders}
                                onEdit={() => onEdit(rule)}
                                onChanged={onChanged}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            )}
        </Box>
    );
}
