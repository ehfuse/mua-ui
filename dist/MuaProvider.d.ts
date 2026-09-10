/**
 * 횡단 관심사 주입 Provider 다 — 로그인 계정/권한 · FormDialog · 첨부 선택 박스 · 파일 저장 · 모바일 셸(서브페이지 브리지).
 *
 * 메일 UI 자체는 앱의 로그인 스토어나 대시보드 셸을 몰라도 되도록, 앱에 매인 것들만 여기로 모아 주입받는다.
 * Provider 가 없어도 모든 컴포넌트가 기본값으로 동작한다(컨텍스트 기본값 = 빈 설정).
 */
import { type ComponentType, type ReactNode } from "react";
import type { MuaAccount, MuaConfig, MuaFileUploadBoxProps, MuaTeamOption } from "./types/config";
/** MuaProvider props 다. */
export interface MuaProviderProps {
    config?: MuaConfig;
    children: ReactNode;
}
/** 메일 UI 설정을 주입한다. */
export declare function MuaProvider({ config, children }: MuaProviderProps): import("react").JSX.Element;
/** 현재 주입 설정을 읽는다(Provider 없으면 빈 설정). */
export declare function useMuaConfig(): MuaConfig;
/** 로그인 계정을 읽는다(주입 안 됐으면 null = 비로그인). */
export declare function useMuaAccount(): MuaAccount | null;
/** 로그인 여부(계정이 주입돼 있으면 로그인으로 본다). */
export declare function useMuaLogined(): boolean;
/** 내가 속한 팀 목록(공용 범위 후보 — 미주입이면 빈 배열 = 팀 UI 없음). */
export declare function useMuaTeams(): MuaTeamOption[];
/** 현재 팀 seq(팀 선택 기본값 — 미주입이면 0). */
export declare function useMuaCurrentTeamSeq(): number;
/** 라이선스 관리자 여부 — 명시 주입값이 우선, 없으면 rbac_role === "admin". */
export declare function useMuaIsAdmin(): boolean;
/** 앱 공통 FormDialog(미주입 시 mfd 기본). */
export declare function useMuaFormDialog(): ComponentType<any>;
/** 첨부 선택 박스(미주입 시 패키지 기본 드롭존). */
export declare function useMuaFileUploadBox(): ComponentType<MuaFileUploadBoxProps>;
/** 파일 저장 함수(미주입 시 앵커 다운로드). */
export declare function useMuaSaveBlob(): (blob: Blob, filename: string) => Promise<boolean>;
