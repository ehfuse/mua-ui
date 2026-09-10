/** 모바일 서브페이지 브리지 모듈 등록소 — 컴포넌트 밖(사이드바 메뉴 정의)에서도 열 수 있게 Provider 가 올려 둔다. */
import type { MuaSubPageBridge } from "../types/config";
/** 브리지를 등록한다(null = 해제). */
export declare function setMuaSubPageBridge(next: MuaSubPageBridge | null): void;
/** 현재 브리지(미등록이면 null — 호출은 no-op). */
export declare function getMuaSubPageBridge(): MuaSubPageBridge | null;
