import { t } from "../i18n";
/** 기본 첨부 선택 박스 — 드래그앤드롭/클릭 선택 + 선택 파일 칩(앱의 FileUploadBox 가 없을 때 쓴다). */

import { useCallback, useRef, useState, type DragEvent } from "react";
import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { WarningAlert } from "@ehfuse/alerts";
import type { MuaFileUploadBoxProps } from "../types/config";
import { FileTypeIcon } from "./FileTypeIcon";

/** 기본 드롭존 */
export function DefaultFileUploadBox({
    multiple = true,
    height = 64,
    acceptedFileTypes = [],
    maxFileSize = 20,
    dropzoneText = t("attachDropShort"),
    onAttachedFilesChange,
    onFilesPicked,
    progress,
}: MuaFileUploadBoxProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);

    const accept =
        acceptedFileTypes.length > 0
            ? acceptedFileTypes.map((ext) => `.${ext.replace(/^\./, "")}`).join(",")
            : undefined;

    const addFiles = useCallback(
        (incoming: File[]) => {
            const limit = maxFileSize * 1024 * 1024;
            const accepted: File[] = [];
            for (const file of incoming) {
                if (file.size > limit) {
                    WarningAlert({ message: t("fileOverLimit", { name: file.name, max: maxFileSize }) });
                    continue;
                }
                if (acceptedFileTypes.length > 0) {
                    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
                    if (!acceptedFileTypes.map((e) => e.replace(/^\./, "").toLowerCase()).includes(ext)) {
                        WarningAlert({ message: t("fileTypeNotAllowed", { name: file.name }) });
                        continue;
                    }
                }
                accepted.push(file);
            }
            // 고르기만 하는 상자(0.4.19) — 목록에 쌓지 않고 새로 고른 것만 넘긴다(쓰기 창이 위 칩으로 그린다).
            if (onFilesPicked) {
                if (accepted.length > 0) onFilesPicked(multiple ? accepted : accepted.slice(0, 1));
                return;
            }
            setFiles((prev) => {
                const next = multiple ? [...prev, ...accepted] : accepted.slice(0, 1);
                onAttachedFilesChange?.(next);
                return next;
            });
        },
        [acceptedFileTypes, maxFileSize, multiple, onAttachedFilesChange, onFilesPicked]
    );

    const removeAt = useCallback(
        (index: number) => {
            setFiles((prev) => {
                const next = prev.filter((_, i) => i !== index);
                onAttachedFilesChange?.(next);
                return next;
            });
        },
        [onAttachedFilesChange]
    );

    const onDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragging(false);
            addFiles(Array.from(e.dataTransfer.files ?? []));
        },
        [addFiles]
    );

    return (
        <Box>
            <Box
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                sx={{
                    height,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    border: `1px dashed ${dragging ? "#3b82f6" : "#cbd5e1"}`,
                    borderRadius: 1,
                    bgcolor: dragging ? "#eff6ff" : "#f8fafc",
                    cursor: "pointer",
                    color: "#111",
                    fontSize: "13.5px",
                    position: "relative",
                }}
            >
                {/* 올리는 중(0.4.19) — 안내 문구 자리 위에 겹쳐 그린다(문구는 자리만 차지하게 감춘다 → 높이가 그대로다). */}
                {progress ? (
                    <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.5, px: 2 }}>
                        <Typography sx={{ fontSize: "13.5px", color: "#111", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {progress.label}
                            {progress.percent !== null ? ` ${progress.percent}%` : ""}
                        </Typography>
                        {progress.percent !== null ? <LinearProgress variant="determinate" value={progress.percent} /> : <LinearProgress />}
                    </Box>
                ) : null}
                <AttachFileIcon fontSize="small" sx={{ visibility: progress ? "hidden" : "visible" }} />
                <Typography sx={{ fontSize: "13.5px", color: "#111", visibility: progress ? "hidden" : "visible" }}>{dropzoneText}</Typography>
                <input
                    ref={inputRef}
                    type="file"
                    hidden
                    multiple={multiple}
                    accept={accept}
                    onChange={(e) => {
                        addFiles(Array.from(e.target.files ?? []));
                        e.target.value = "";
                    }}
                />
            </Box>
            {files.length > 0 ? (
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 1 }}>
                    {files.map((file, index) => (
                        <Chip
                            key={`${file.name}-${index}`}
                            icon={<FileTypeIcon name={file.name} mime={file.type} size={20} />}
                            label={file.name}
                            variant="outlined"
                            sx={{ fontSize: "13.5px", color: "#111", pl: 0.75, "& .MuiChip-icon": { ml: 0.5 } }}
                            onDelete={() => removeAt(index)}
                        />
                    ))}
                </Stack>
            ) : null}
        </Box>
    );
}
