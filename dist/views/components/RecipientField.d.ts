/** 주소록이 바뀌었다(연락처 등록·수정) — 다음에 다시 읽게 한다. */
export declare function invalidateRecipientContacts(): void;
interface RecipientFieldProps {
    name: "to" | "cc" | "bcc";
    label: string;
    form: any;
    placeholder?: string;
    inputRef?: React.Ref<HTMLInputElement>;
}
export declare function RecipientField({ name, label, form, placeholder, inputRef }: RecipientFieldProps): import("react").JSX.Element;
export {};
