/** 첨부 파일 종류 아이콘 — 확장자별 색 배지(PDF·문서·표·프레젠테이션·압축·이미지·영상·음성·메일 등). */

import { Box } from "@mui/material";

interface FileKind {
    label: string; // 배지 글자(최대 4자)
    bg: string; // 배경색
}

const KINDS: Record<string, FileKind> = {
    pdf: { label: "PDF", bg: "#dc2626" },
    doc: { label: "DOC", bg: "#2563eb" },
    docx: { label: "DOC", bg: "#2563eb" },
    hwp: { label: "HWP", bg: "#1d4ed8" },
    hwpx: { label: "HWP", bg: "#1d4ed8" },
    xls: { label: "XLS", bg: "#16a34a" },
    xlsx: { label: "XLS", bg: "#16a34a" },
    csv: { label: "CSV", bg: "#15803d" },
    ppt: { label: "PPT", bg: "#ea580c" },
    pptx: { label: "PPT", bg: "#ea580c" },
    zip: { label: "ZIP", bg: "#b45309" },
    rar: { label: "RAR", bg: "#b45309" },
    "7z": { label: "7Z", bg: "#b45309" },
    gz: { label: "GZ", bg: "#b45309" },
    txt: { label: "TXT", bg: "#64748b" },
    md: { label: "MD", bg: "#64748b" },
    html: { label: "HTML", bg: "#0891b2" },
    htm: { label: "HTML", bg: "#0891b2" },
    xml: { label: "XML", bg: "#0891b2" },
    json: { label: "JSON", bg: "#0891b2" },
    eml: { label: "EML", bg: "#7c3aed" },
    msg: { label: "MSG", bg: "#7c3aed" },
    jpg: { label: "IMG", bg: "#9333ea" },
    jpeg: { label: "IMG", bg: "#9333ea" },
    png: { label: "IMG", bg: "#9333ea" },
    gif: { label: "GIF", bg: "#9333ea" },
    webp: { label: "IMG", bg: "#9333ea" },
    bmp: { label: "IMG", bg: "#9333ea" },
    svg: { label: "SVG", bg: "#9333ea" },
    heic: { label: "IMG", bg: "#9333ea" },
    mp4: { label: "MP4", bg: "#be185d" },
    mov: { label: "MOV", bg: "#be185d" },
    avi: { label: "AVI", bg: "#be185d" },
    mp3: { label: "MP3", bg: "#0f766e" },
    wav: { label: "WAV", bg: "#0f766e" },
    m4a: { label: "M4A", bg: "#0f766e" },
};

/** 확장자(소문자, 점 없음) */
function extensionOf(name: string): string {
    const idx = name.lastIndexOf(".");
    return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

/** MIME 으로 대략 종류를 보정한다(확장자가 없을 때). */
function kindFromMime(mime: string): FileKind | null {
    const m = mime.toLowerCase();
    if (m.startsWith("image/")) return { label: "IMG", bg: "#9333ea" };
    if (m.startsWith("video/")) return { label: "VID", bg: "#be185d" };
    if (m.startsWith("audio/")) return { label: "AUD", bg: "#0f766e" };
    if (m === "application/pdf") return KINDS.pdf;
    if (m === "message/rfc822") return KINDS.eml;
    if (m.includes("zip") || m.includes("compressed")) return KINDS.zip;
    if (m.includes("spreadsheet") || m.includes("excel")) return KINDS.xlsx;
    if (m.includes("presentation") || m.includes("powerpoint")) return KINDS.pptx;
    if (m.includes("word") || m.includes("hwp")) return KINDS.docx;
    if (m.startsWith("text/")) return KINDS.txt;
    return null;
}

/** 파일명/MIME → 종류 */
export function fileKindOf(name: string, mime = ""): FileKind {
    const ext = extensionOf(name);
    return KINDS[ext] ?? kindFromMime(mime) ?? { label: (ext || "FILE").slice(0, 4).toUpperCase(), bg: "#475569" };
}

interface FileTypeIconProps {
    name: string; // 파일명
    mime?: string; // MIME
    size?: number; // 한 변 px(기본 22)
}

/** 확장자 배지 아이콘 */
export function FileTypeIcon({ name, mime = "", size = 22 }: FileTypeIconProps) {
    const kind = fileKindOf(name, mime);
    return (
        <Box
            component="span"
            aria-hidden
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: size,
                height: size,
                borderRadius: `${Math.round(size * 0.22)}px`,
                bgcolor: kind.bg,
                color: "#fff",
                fontSize: kind.label.length > 3 ? Math.round(size * 0.34) : Math.round(size * 0.4),
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                fontFamily: "Arial, Helvetica, sans-serif",
                flexShrink: 0,
            }}
        >
            {kind.label}
        </Box>
    );
}
