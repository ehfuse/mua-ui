interface MailBodyFrameProps {
    html: string;
    text: string;
    allowRemoteImages: boolean;
}
/** 본문 iframe 컴포넌트 — 내용 높이에 맞춰 자동으로 늘어난다. */
export declare function MailBodyFrame({ html, text, allowRemoteImages }: MailBodyFrameProps): import("react").JSX.Element;
export {};
