/**
 * mua-ui 화면 문구 다국어(2026-10-26).
 *
 * 문구는 ./mua-ui/<언어>.json(평평한 { 열쇠: 글 }). ko · en 은 손으로, 나머지는 업무함 www/scripts/i18n-translate.mjs 로 채운다.
 * 기본 언어는 한국어 — 앱이 setMuaUiLocale(lang) 을 부르면 그 언어로 바꾸고, 그 문구를 쓰는 컴포넌트를 다시 그린다.
 * 모르는 언어면 영어. 열쇠가 그 언어에 없으면 영어 → 한국어 → 열쇠 순으로 찾는다.
 */
import { useCallback, useSyncExternalStore } from "react";
import ko from "./mua-ui/ko.json";
import en from "./mua-ui/en.json";
import ja from "./mua-ui/ja.json";
import zh from "./mua-ui/zh.json";
import de from "./mua-ui/de.json";
import fr from "./mua-ui/fr.json";
import it from "./mua-ui/it.json";
import vi from "./mua-ui/vi.json";

/** 이 패키지가 아는 화면 언어 */
export type MuaUiLang = "ko" | "en" | "ja" | "zh" | "de" | "fr" | "it" | "vi";

type Dict = Record<string, string>;
const DICTS: Record<MuaUiLang, Dict> = { ko, en, ja, zh, de, fr, it, vi };
const INTL_TAGS: Record<MuaUiLang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN", de: "de-DE", fr: "fr-FR", it: "it-IT", vi: "vi-VN" };

let current: MuaUiLang = "ko";
const listeners = new Set<() => void>();

/** "en-US" · "zh_CN" 같은 값을 아는 언어로 — 모르면 영어 */
export function normalizeLang(lang?: string | null): MuaUiLang {
    const base = String(lang ?? "").toLowerCase().split(/[-_]/)[0];
    return (base in DICTS ? base : "en") as MuaUiLang;
}

/** 화면 언어를 정한다(앱 전역 — 앱이 언어를 바꿀 때마다 부른다). */
export function setMuaUiLocale(lang: string): void {
    const next = normalizeLang(lang);
    if (next === current) return;
    current = next;
    listeners.forEach((fn) => fn());
}

/** 지금 화면 언어 */
export function getMuaUiLocale(): MuaUiLang {
    return current;
}

function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
}

export type TParams = Record<string, string | number | null | undefined>;

/** 열쇠 → 글. lang 을 주면 그 언어(컴포넌트 locale prop), 아니면 전역 언어. {{x}} 에 params 를 넣는다. */
export function t(key: string, params?: TParams, lang?: string | null): string {
    const l = lang ? normalizeLang(lang) : current;
    const raw = DICTS[l][key] ?? DICTS.en[key] ?? DICTS.ko[key] ?? key;
    if (!params) return raw;
    return raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, name) => (params[name] == null ? m : String(params[name])));
}

/** Intl 에 줄 언어 태그(날짜 · 숫자) */
export function intlTag(lang?: string | null): string {
    return INTL_TAGS[lang ? normalizeLang(lang) : current];
}

/** 컴포넌트용 — 전역 언어가 바뀌면 다시 그린다. localeProp 을 주면 그것이 이긴다. */
export function useI18n(localeProp?: string | null) {
    const globalLang = useSyncExternalStore(subscribe, getMuaUiLocale, getMuaUiLocale);
    const lang: MuaUiLang = localeProp ? normalizeLang(localeProp) : globalLang;
    const tt = useCallback((key: string, params?: TParams) => t(key, params, lang), [lang]);
    return { t: tt, lang, intlTag: INTL_TAGS[lang] };
}

/** FormDialog(@ehfuse/mui-form-dialog) 의 locale 코드 — 그 패키지는 옛 코드(jp · cn)를 쓴다. 메일 창을 화면 언어로 띄우려고. */
export function formDialogLocale(): "ko" | "en" | "jp" | "cn" | "de" | "fr" | "it" | "vi" {
    const lang = getMuaUiLocale();
    return lang === "ja" ? "jp" : lang === "zh" ? "cn" : lang;
}
