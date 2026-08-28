/** 기본 파일 저장 — 일반 브라우저 앵커 다운로드(앱 WebView 는 MuaConfig.saveBlob 으로 대체한다). */
export function anchorSaveBlob(blob: Blob, filename: string): boolean {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = (filename || "").replace(/[\\/:*?"<>|\r\n]/g, "_").trim() || "download";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // 즉시 revoke 하면 브라우저에 따라 저장이 취소될 수 있어 늦게 해제한다.
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
}
