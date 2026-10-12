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
/**
 * 화면 폭보다 넓은 표를 가로 스크롤 상자(.mua-scroll)로 감싼다(2026-10-12).
 *
 * mua-fit 으로 고정 폭을 풀어도 줄지 않는 표가 있다 — 칸 안의 글이 줄을 바꾸지 않으면 표는 그 글 폭 아래로 못 줄어든다.
 * 전에는 본문 문서 전체가 가로로 넘쳤는데, 본문 프레임은 내용 높이만큼 길어서 **가로 스크롤 막대가 메일 맨 아래에만** 생겼다:
 * 폰은 손가락으로 밀면 되지만 PC(마우스)에서는 막대를 찾아 맨 아래까지 내려가야 해 가려진 칸을 사실상 볼 수 없었다.
 * 넓은 표만 제자리에서 밀게 하면 막대가 그 표 바로 아래에 서고, 나머지 글은 화면 폭에 맞춰 그대로 읽힌다.
 *
 * 안쪽 표부터 본다 — 안쪽 표를 감싸면 그것을 품은 바깥(배치용) 표가 줄어들 수 있어, 바깥까지 감쌀 일이 없어진다.
 */
export declare function wrapWideTables(doc: Document): void;
/** HTML 특수문자를 이스케이프한다. */
export declare function escapeHtml(text: string): string;
/** 답장/전달용 인용 블록을 만든다(원문은 정제 후 인용). */
export declare function buildQuotedBody(detail: MailMessageDetail, mode: "reply" | "forward"): string;
/** 답장/전달 제목 접두사를 붙인다(이미 있으면 유지). */
export declare function prefixSubject(subject: string | null, prefix: "Re" | "Fwd"): string;
