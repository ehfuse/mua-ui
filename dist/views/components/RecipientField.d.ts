/** 주소록이 바뀌었다(연락처 등록·수정) — 다음에 다시 읽게 한다. */
export declare function invalidateRecipientContacts(): void;
interface RecipientFieldProps {
    name: "to" | "cc" | "bcc";
    label: string;
    form: any;
    placeholder?: string;
    inputRef?: React.Ref<HTMLInputElement>;
    /** 읽기 전용(0.4.2) — "나에게" 를 켠 받는 사람 칸. 고칠 수 없고 지우기 단추 · 주소록 제안도 뜨지 않는다. */
    readOnly?: boolean;
    /** 라벨을 처음부터 위에 둔다(0.4.2) — 창이 열리며 바로 포커스가 가는 받는 사람 칸은 라벨이 내려왔다 올라가는 것이 보였다. */
    shrinkLabel?: boolean;
}
export declare function RecipientField({ name, label, form, placeholder, inputRef, readOnly, shrinkLabel }: RecipientFieldProps): import("react").JSX.Element;
export {};
