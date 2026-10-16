/**
 * 받는 사람 · 참조 · 숨은참조 칸 — 치는 동안 주소록에서 이름 · 주소 · 소속이 맞는 사람을 칸 아래에 띄운다(2026-10-16).
 *
 * 칸은 그대로 쉼표로 이어 쓰는 글자 칸이다(ClearTextField) — 고르면 지금 치던 조각(마지막 쉼표 뒤)을 `이름 <주소>, ` 로 바꿔 끼운다.
 * 칩 입력으로 바꾸지 않은 이유: 붙여 넣기·답장으로 채워지는 "이름 <주소>, …" 글자와 저장(splitAddressInput)이 모두 이 꼴이라, 칸의 꼴을 바꾸면 그 길이 다 바뀐다.
 * 주소록은 창을 열고 처음 칸에 들어올 때 한 번 읽는다(조직 공용 + 개인, 최대 500 — 화면 목록과 같은 한도).
 * 키보드: ↓↑ 고르기 · Enter/Tab 넣기 · Esc 닫기. 목록을 눌러도 칸의 포커스를 잃지 않는다(mousedown 을 막는다).
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Box, MenuItem, MenuList, Paper, Popper, Typography } from "@mui/material";
import { ClearTextField } from "@ehfuse/mui-form-controls";
import { mailApi, unwrap } from "../../apis/mailApi";
import type { MailContact } from "../../models/types";

/** 한 번에 보이는 후보 수 — 더 치면 좁혀진다. */
const MAX_SUGGESTIONS = 8;
/** 주소록을 다시 읽지 않는 시간 — 같은 창에서 칸을 오갈 때마다 읽지 않게. */
const CONTACTS_TTL_MS = 60_000;

let contactsCache: { at: number; items: MailContact[] } | null = null;
let contactsLoading: Promise<MailContact[]> | null = null;

/** 주소록을 읽는다(짧게 캐시). 못 읽으면 빈 목록 — 자동완성이 안 뜰 뿐 칸은 그대로 쓴다. */
function loadContacts(): Promise<MailContact[]> {
    if (contactsCache && Date.now() - contactsCache.at < CONTACTS_TTL_MS) return Promise.resolve(contactsCache.items);
    if (contactsLoading) return contactsLoading;
    contactsLoading = mailApi
        .listContacts("")
        .then((res) => {
            const items = unwrap(res, "주소록을 불러오지 못했습니다.").items ?? [];
            contactsCache = { at: Date.now(), items };
            return items;
        })
        .catch(() => [] as MailContact[])
        .finally(() => {
            contactsLoading = null;
        });
    return contactsLoading;
}

/** 주소록이 바뀌었다(연락처 등록·수정) — 다음에 다시 읽게 한다. */
export function invalidateRecipientContacts(): void {
    contactsCache = null;
}

/** 칸 글자에서 지금 치는 조각(마지막 쉼표·세미콜론 뒤)과 그 앞부분을 가른다. */
function splitTail(text: string): { head: string; tail: string } {
    const index = Math.max(text.lastIndexOf(","), text.lastIndexOf(";"));
    return index < 0 ? { head: "", tail: text } : { head: text.slice(0, index + 1), tail: text.slice(index + 1) };
}

/** 이미 칸에 있는 주소들(소문자) — 같은 사람을 또 띄우지 않는다. */
function emailsIn(text: string): Set<string> {
    return new Set((text.match(/[^\s<>,;]+@[^\s<>,;]+/g) ?? []).map((email) => email.toLowerCase()));
}

interface RecipientFieldProps {
    name: "to" | "cc" | "bcc";
    label: string;
    // forma 폼 — ClearTextField 에 그대로 넘긴다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: any;
    placeholder?: string;
    inputRef?: React.Ref<HTMLInputElement>;
}

export function RecipientField({ name, label, form, placeholder, inputRef }: RecipientFieldProps) {
    const value = String(form.useFormValue(name) ?? "");
    const anchorRef = useRef<HTMLDivElement | null>(null);
    const [contacts, setContacts] = useState<MailContact[]>([]);
    const [focused, setFocused] = useState(false);
    const [active, setActive] = useState(0);
    // Esc 로 닫은 뒤에는 다시 칠 때까지 열지 않는다.
    const [dismissed, setDismissed] = useState(false);

    const { head, tail } = splitTail(value);
    const query = tail.trim().toLowerCase();
    const suggestions = useMemo(() => {
        if (query.length < 1) return [];
        const taken = emailsIn(head);
        const scored = contacts
            .filter((contact) => contact.email && !taken.has(contact.email.toLowerCase()))
            .map((contact) => {
                const fields = [contact.name, contact.email, contact.organization].map((field) => String(field ?? "").toLowerCase());
                // 앞부분이 맞는 것이 먼저, 그다음 중간에 들어 있는 것 — 즐겨찾기는 같은 자리에서 앞선다.
                const rank = fields.some((field) => field.startsWith(query)) ? 0 : fields.some((field) => field.includes(query)) ? 1 : -1;
                return { contact, rank };
            })
            .filter((row) => row.rank >= 0)
            .sort((a, b) => a.rank - b.rank || Number(b.contact.is_favorite) - Number(a.contact.is_favorite) || a.contact.name.localeCompare(b.contact.name));
        return scored.slice(0, MAX_SUGGESTIONS).map((row) => row.contact);
    }, [contacts, head, query]);
    const open = focused && !dismissed && suggestions.length > 0;

    useEffect(() => setActive(0), [query]);

    /** 고른 사람을 지금 치던 조각 자리에 넣는다. */
    const pick = (contact: MailContact) => {
        const label = contact.name ? `${contact.name} <${contact.email}>` : contact.email;
        const prefix = head ? `${head.replace(/\s*$/, "")} ` : "";
        form.setFormValue(name, `${prefix}${label}, `);
        setDismissed(false);
        // 커서를 끝으로 — 이어서 다음 사람을 친다.
        requestAnimationFrame(() => {
            const input = anchorRef.current?.querySelector("input");
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        });
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (!open) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActive((current) => (current + step + suggestions.length) % suggestions.length);
        } else if (event.key === "Enter" || event.key === "Tab") {
            event.preventDefault();
            event.stopPropagation();
            pick(suggestions[Math.min(active, suggestions.length - 1)]);
        } else if (event.key === "Escape") {
            // 창 닫기(Esc)로 올라가지 않게 막는다 — 목록만 닫는다.
            event.preventDefault();
            event.stopPropagation();
            setDismissed(true);
        }
    };

    return (
        <Box
            ref={anchorRef}
            onFocus={() => {
                setFocused(true);
                void loadContacts().then(setContacts);
            }}
            onBlur={() => setFocused(false)}
            onKeyDownCapture={onKeyDown}
            onInput={() => setDismissed(false)}
        >
            <ClearTextField name={name} label={label} form={form} inputRef={inputRef} fullWidth placeholder={placeholder} autoComplete="off" />
            <Popper
                open={open}
                anchorEl={anchorRef.current}
                placement="bottom-start"
                // 메일 창(다이얼로그) 위에 뜬다.
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1, width: anchorRef.current?.offsetWidth }}
            >
                <Paper elevation={6} sx={{ mt: 0.5, maxHeight: 320, overflowY: "auto" }}>
                    <MenuList dense={false} sx={{ py: 0.5 }}>
                        {suggestions.map((contact, index) => (
                            <MenuItem
                                key={contact.seq}
                                selected={index === active}
                                // 누르는 순간 칸이 포커스를 잃어 목록이 닫히지 않게 한다.
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => pick(contact)}
                                onMouseEnter={() => setActive(index)}
                                sx={{ display: "block", py: 1 }}
                            >
                                <Typography sx={{ fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {contact.name || contact.email}
                                    {contact.name ? (
                                        <Box component="span" sx={{ color: "text.secondary", ml: 1 }}>
                                            {contact.email}
                                        </Box>
                                    ) : null}
                                </Typography>
                                {contact.organization ? (
                                    <Typography sx={{ fontSize: 14, color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {contact.organization}
                                    </Typography>
                                ) : null}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Paper>
            </Popper>
        </Box>
    );
}
