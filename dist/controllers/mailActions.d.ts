/**
 * 메일 화면 Actions — 계정/목록/상세/건수/동기화/메시지 조작. API 호출은 전부 여기서만 한다.
 */
import type { ActionContext } from "@ehfuse/forma";
import { type BulkMessageAction } from "../apis/mailApi";
import { type MailAccount, type MailFilters, type MailLabel, type MailMoveTarget, type MailRule, type MailState, type MailUserFolder } from "../models/types";
/** 남겨 둔 읽은 메일을 버린다 — 메일 화면을 떠날 때 부른다. */
export declare function resetKeptReadMessages(): void;
/** 내 메일 계정 목록을 읽는다. */
export declare const loadAccounts: () => (context: ActionContext<MailState>) => Promise<MailAccount[]>;
/** 필터를 바꾼다(목록 재조회는 Layout 의 effect 가 필터 변화를 보고 호출한다). */
export declare const setFilters: () => (context: ActionContext<MailState>, patch: Partial<MailFilters>) => void;
/** 목록을 읽는다. append=true 면 다음 페이지를 이어 붙인다. */
export declare const loadMessages: () => (context: ActionContext<MailState>, options?: {
    append?: boolean;
    silent?: boolean;
}) => Promise<void>;
/** 폴더/계정 건수를 읽고 계정별 미읽음도 갱신한다. */
export declare const loadCounts: () => (context: ActionContext<MailState>) => Promise<void>;
/** 번역본 보기 상태 변경을 목록 행에 반영한다(번역 제목 표시/원문 제목 복귀 — 상세 패널이 호출). */
export declare const setTranslatedSubject: () => (context: ActionContext<MailState>, seq: number, translatedSubject: string | null) => void;
/** 메시지를 선택해 상세를 읽는다(받은편지함 메시지는 열면서 읽음 처리). */
export declare const selectMessage: () => (context: ActionContext<MailState>, seq: number) => Promise<void>;
/** 선택을 해제한다. */
export declare const clearSelection: () => (context: ActionContext<MailState>) => void;
/** 메시지 일괄/단건 액션(읽음·중요·휴지통·복원·영구삭제)을 적용하고 목록을 낙관 갱신한다. */
export declare const applyMessageAction: () => (context: ActionContext<MailState>, seqs: number[], action: BulkMessageAction, move?: MailMoveTarget, threads?: boolean) => Promise<boolean>;
/** 계정(0=전체 활성 계정)을 즉시 동기화하고 목록/건수를 다시 읽는다. */
export declare const syncNow: () => (context: ActionContext<MailState>, mailAccountSeq: number) => Promise<void>;
/** 사용자 메일함 목록을 읽는다. */
export declare const loadFolders: () => (context: ActionContext<MailState>) => Promise<MailUserFolder[]>;
/** 내 색상 라벨을 읽는다(config.labels 를 켠 화면만 부른다). 보던 라벨 탭의 라벨이 지워졌으면 전체로 되돌린다. */
export declare const loadLabels: () => (context: ActionContext<MailState>) => Promise<MailLabel[]>;
/**
 * 메일들에 라벨을 달고 뗀다 — 성공하면 목록 행의 label_seqs 를 바로 고친다(다시 읽지 않는다).
 * 라벨 탭을 보던 중에 그 라벨을 뗀 메일은 목록에서 뺀다(그 탭에 더는 속하지 않는다).
 */
export declare const applyLabels: () => (context: ActionContext<MailState>, seqs: number[], add: number[], remove: number[]) => Promise<boolean>;
/** 규칙 목록을 읽는다. */
export declare const loadRules: () => (context: ActionContext<MailState>) => Promise<MailRule[]>;
