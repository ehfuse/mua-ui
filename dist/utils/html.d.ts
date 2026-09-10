/**
 * 메일 본문 HTML 정제/인용 유틸.
 */
import type { MailMessageDetail } from "../models/types";
/** 본문 HTML 을 안전하게 정제한다. allowRemoteImages 가 false 면 외부 이미지를 막는다. */
export declare function sanitizeMailHtml(html: string, allowRemoteImages: boolean): string;
/**
 * 정제된 본문을 iframe srcDoc 용 문서로 감싼다(링크는 새 창, 폭 넘침 방지).
 * `upgrade-insecure-requests` — 메일 본문의 `http://` 이미지는 https 앱(특히 앱 웹뷰)에서 혼합 콘텐츠로
 * 조용히 차단돼 깨진 아이콘만 남는다(2026-09-03 국세청 홈택스 발급 메일: 이미지 11개 전부 http://srtk.hometax.go.kr).
 * 이 지시로 브라우저가 이미지·링크 요청을 https 로 올려 보낸다(https 가 없는 서버는 어차피 차단되던 것이라 손해 없음).
 */
export declare function wrapMailDocument(bodyHtml: string): string;
/** HTML 특수문자를 이스케이프한다. */
export declare function escapeHtml(text: string): string;
/** 답장/전달용 인용 블록을 만든다(원문은 정제 후 인용). */
export declare function buildQuotedBody(detail: MailMessageDetail, mode: "reply" | "forward"): string;
/** 답장/전달 제목 접두사를 붙인다(이미 있으면 유지). */
export declare function prefixSubject(subject: string | null, prefix: "Re" | "Fwd"): string;
