/** 기본 첨부 선택 박스 — 드래그앤드롭/클릭 선택 + 선택 파일 칩(앱의 FileUploadBox 가 없을 때 쓴다). */

import { useCallback, useRef, useState, type DragEvent } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { WarningAlert } from "@ehfuse/alerts";
import type { MuaFileUploadBoxProps } from "../types/config";

/** 기본 드롭존 */
export function DefaultFileUploadBox({
    multiple = true,
    height = 64,
    acceptedFileTypes = [],
    maxFileSize = 20,
    dropzoneText = "파일을 끌어놓거나 클릭하여 첨부하세요",
    onAttachedFilesChange,
}: MuaFileUploadBoxProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);

    const accept = acceptedFileTypes.length > 0 ? acceptedFileTypes.map((ext) => `.${ext.replace(/^\./, "")}`).join(",") : undefined;

    const addFiles = useCallback(
        (incoming: File[]) => {
            const limit = maxFileSize * 1024 * 1024;
            const accepted: File[] = [];
            for (const file of incoming) {
                if (file.size > limit) {
                    WarningAlert({ message: `"${file.name}" 은(는) ${maxFileSize}MB 를 넘어 첨부할 수 없습니다.` });
                    continue;
                }
                if (acceptedFileTypes.length > 0) {
                    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
                    if (!acceptedFileTypes.map((e) => e.replace(/^\./, "").toLowerCase()).includes(ext)) {
                        WarningAlert({ message: `"${file.name}" 은(는) 허용되지 않는 형식입니다.` });
                        continue;
                    }
                }
                accepted.push(file);
            }
            setFiles((prev) => {
                const next = multiple ? [...prev, ...accepted] : accepted.slice(0, 1);
                onAttachedFilesChange?.(next);
                return next;
            });
        },
        [acceptedFileTypes, maxFileSize, multiple, onAttachedFilesChange]
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
                }}
            >
                <AttachFileIcon fontSize="small" />
                <Typography sx={{ fontSize: "13.5px", color: "#111" }}>{dropzoneText}</Typography>
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
                            icon={<AttachFileIcon />}
                            label={file.name}
                            variant="outlined"
                            sx={{ fontSize: "13.5px", color: "#111" }}
                            onDelete={() => removeAt(index)}
                        />
                    ))}
                </Stack>
            ) : null}
        </Box>
    );
}
