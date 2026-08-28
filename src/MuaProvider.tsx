/**
 * 횡단 관심사 주입 Provider 다 — 로그인 계정/권한 · FormDialog · 첨부 선택 박스 · 파일 저장 · 모바일 셸(서브페이지 브리지).
 *
 * 메일 UI 자체는 앱의 로그인 스토어나 대시보드 셸을 몰라도 되도록, 앱에 매인 것들만 여기로 모아 주입받는다.
 * Provider 가 없어도 모든 컴포넌트가 기본값으로 동작한다(컨텍스트 기본값 = 빈 설정).
 */

import { createContext, useContext, useEffect, useMemo, type ComponentType, type ReactNode } from "react";
import { FormDialog as BaseFormDialog } from "@ehfuse/mui-form-dialog";
import { DefaultFileUploadBox } from "./internal/DefaultFileUploadBox";
import { setMuaSubPageBridge } from "./internal/subPageBridge";
import { setMuaPaths } from "./internal/pathsRegistry";
import { anchorSaveBlob } from "./internal/saveBlob";
import type { MuaAccount, MuaConfig, MuaFileUploadBoxProps } from "./types/config";

/** 설정 컨텍스트다(기본값 = 빈 설정 — 각 소비 지점이 폴백을 가진다). */
const MuaConfigContext = createContext<MuaConfig>({});

/** MuaProvider props 다. */
export interface MuaProviderProps {
    config?: MuaConfig; // 주입 설정(부분 지정 가능)
    children: ReactNode;
}

/** 메일 UI 설정을 주입한다. */
export function MuaProvider({ config, children }: MuaProviderProps) {
    const value = useMemo(() => config ?? {}, [config]);

    // 컴포넌트 밖에서 불리는 것들(서브페이지 열기·경로 규칙)은 모듈 등록소로 넘긴다.
    useEffect(() => {
        setMuaSubPageBridge(value.mobile?.subPage ?? null);
        return () => setMuaSubPageBridge(null);
    }, [value.mobile?.subPage]);
    useEffect(() => {
        setMuaPaths({ inboxPath: value.inboxPath, homePath: value.homePath });
    }, [value.inboxPath, value.homePath]);

    return <MuaConfigContext.Provider value={value}>{children}</MuaConfigContext.Provider>;
}

/** 현재 주입 설정을 읽는다(Provider 없으면 빈 설정). */
export function useMuaConfig(): MuaConfig {
    return useContext(MuaConfigContext);
}

/** 로그인 계정을 읽는다(주입 안 됐으면 null = 비로그인). */
export function useMuaAccount(): MuaAccount | null {
    return useMuaConfig().account ?? null;
}

/** 로그인 여부(계정이 주입돼 있으면 로그인으로 본다). */
export function useMuaLogined(): boolean {
    return Boolean(useMuaConfig().account);
}

/** 라이선스 관리자 여부 — 명시 주입값이 우선, 없으면 rbac_role === "admin". */
export function useMuaIsAdmin(): boolean {
    const { account, isAdmin } = useMuaConfig();
    if (isAdmin !== undefined) return isAdmin;
    return String(account?.rbac_role ?? "") === "admin";
}

/** 앱 공통 FormDialog(미주입 시 mfd 기본). */
export function useMuaFormDialog(): ComponentType<any> {
    return useMuaConfig().FormDialogComponent ?? BaseFormDialog;
}

/** 첨부 선택 박스(미주입 시 패키지 기본 드롭존). */
export function useMuaFileUploadBox(): ComponentType<MuaFileUploadBoxProps> {
    return useMuaConfig().FileUploadBoxComponent ?? DefaultFileUploadBox;
}

/** 파일 저장 함수(미주입 시 앵커 다운로드). */
export function useMuaSaveBlob(): (blob: Blob, filename: string) => Promise<boolean> {
    const custom = useMuaConfig().saveBlob;
    return useMemo(
        () =>
            async (blob: Blob, filename: string) => {
                if (!custom) return anchorSaveBlob(blob, filename);
                const result = await custom(blob, filename);
                return result !== false;
            },
        [custom]
    );
}
