/**
 * 메일 본문 뷰어 — 정제한 HTML 을 샌드박스 iframe(srcDoc)에 그린다(스크립트 불가, 링크는 새 창).
 */
interface MailBodyFrameProps {
    html: string;
    text: string;
    allowRemoteImages: boolean;
}
/** 본문 iframe 컴포넌트 — 내용 높이에 맞춰 자동으로 늘어난다. */
export declare function MailBodyFrame({ html, text, allowRemoteImages }: MailBodyFrameProps): import("react").JSX.Element;
export {};
