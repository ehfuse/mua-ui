/**
 * 메일 관리 다이얼로그 — 계정 / 메일함 / 규칙을 상단 탭(switchContent)으로 한 곳에서 관리한다.
 * 헤더 ⚙ = 계정 탭, 사이드바 메일 그룹의 ⚙ = 메일함 탭, 헤더 [규칙] = 규칙 탭으로 열린다.
 * 액션바 왼쪽 [+ …]는 활성 탭에 맞춰 바뀌고(계정 추가 / 만들기 / 규칙 추가), 오른쪽은 [닫기].
 */

import { useState } from "react";
import { Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useIsMobile } from "../../internal/useIsMobile";
import { useMuaFormDialog } from "../../MuaProvider";
import type { MailAccount, MailRule, MailUserFolder } from "../../models/types";
import { MailAccountsList } from "./MailAccountsList";
import { MailFolderFormDialog, MailFoldersList } from "./MailFoldersList";
import { MailRulesList } from "./MailRulesList";

/** 관리 탭 키 */
export type MailManageTab = "accounts" | "folders" | "rules";
const TAB_ORDER: MailManageTab[] = ["accounts", "folders", "rules"];
const ADD_LABEL: Record<MailManageTab, string> = { accounts: "계정 추가", folders: "만들기", rules: "규칙 추가" };

interface MailManageDialogProps {
    open: boolean; // 열림
    tab: MailManageTab; // 활성 탭
    onTabChange: (tab: MailManageTab) => void; // 탭 전환
    onClose: () => void; // 닫기
    accounts: MailAccount[]; // 계정 목록
    syncingSeqs: number[]; // 동기화 중인 계정 seq
    folders: MailUserFolder[]; // 사용자 메일함
    rules: MailRule[]; // 규칙
    onAddAccount: () => void; // 계정 추가
    onEditAccount: (account: MailAccount) => void; // 계정 수정
    onDeleteAccount: (account: MailAccount) => void; // 계정 삭제
    onSyncAccount: (account: MailAccount) => void; // 지금 동기화
    onFoldersChanged: () => void; // 메일함 변경 후
    onAddRule: () => void; // 규칙 추가
    onEditRule: (rule: MailRule) => void; // 규칙 수정
    onRulesChanged: () => void; // 규칙 변경 후
}

/** 메일 관리 다이얼로그 */
export function MailManageDialog({
    open,
    tab,
    onTabChange,
    onClose,
    accounts,
    syncingSeqs,
    folders,
    rules,
    onAddAccount,
    onEditAccount,
    onDeleteAccount,
    onSyncAccount,
    onFoldersChanged,
    onAddRule,
    onEditRule,
    onRulesChanged,
}: MailManageDialogProps) {
    // 모바일은 풀스크린 우→좌 슬라이드(서브페이지 위에 한 겹 더 뜬다).
    const isMobile = useIsMobile();
    const FormDialog = useMuaFormDialog();
    const [folderAddOpen, setFolderAddOpen] = useState(false);
    const handleAdd = () => {
        if (tab === "accounts") onAddAccount();
        else if (tab === "folders") setFolderAddOpen(true);
        else onAddRule();
    };
    const addButton = (
        <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            fullWidth={isMobile}
            sx={{ color: "#111", borderColor: "#cbd5e1", ...(isMobile ? { minHeight: 48 } : {}) }}
        >
            {ADD_LABEL[tab]}
        </Button>
    );
    const closeButton = (
        <Button
            variant="contained"
            onClick={onClose}
            fullWidth={isMobile}
            sx={isMobile ? { minHeight: 48 } : { minWidth: 80 }}
        >
            닫기
        </Button>
    );
    return (
        <>
            <FormDialog
                fontScaleKey="MailManageDialog"
                fullScreen={isMobile}
                mobilePresentation={isMobile ? "slide" : "dialog"}
                open={open}
                onClose={onClose}
                title={{ text: "메일 관리" }}
                titleIcons={{ delete: { visible: false } }}
                // 탭 클릭 = 스크롤이 아니라 그 탭의 목록만 보여준다
                tabs={{ switchContent: true, fullWidth: true }}
                activeTabValue={TAB_ORDER.indexOf(tab)}
                onTabChange={(index: number) => onTabChange(TAB_ORDER[index] ?? "accounts")}
                locale="ko"
                maxWidth="sm"
                scrollPastLastSection={false}
                contentBottomPadding={24}
                sections={[
                    {
                        id: "mail-manage-accounts",
                        tabTitle: "계정",
                        showTitle: false,
                        children: (
                            <MailAccountsList
                                accounts={accounts}
                                syncingSeqs={syncingSeqs}
                                onEdit={onEditAccount}
                                onDelete={onDeleteAccount}
                                onSync={onSyncAccount}
                            />
                        ),
                    },
                    {
                        id: "mail-manage-folders",
                        tabTitle: "메일함",
                        showTitle: false,
                        children: <MailFoldersList folders={folders} onChanged={onFoldersChanged} />,
                    },
                    {
                        id: "mail-manage-rules",
                        tabTitle: "규칙",
                        showTitle: false,
                        children: (
                            <MailRulesList
                                rules={rules}
                                folders={folders}
                                onEdit={onEditRule}
                                onChanged={onRulesChanged}
                            />
                        ),
                    },
                ]}
                actions={{
                    visible: true,
                    showCancelButton: false,
                    // 모바일은 [+ …][닫기] 50/50 균등 배치
                    ...(isMobile
                        ? {
                              left: (
                                  <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                                      {addButton}
                                      {closeButton}
                                  </Stack>
                              ),
                          }
                        : { left: addButton, right: closeButton }),
                }}
            />
            <MailFolderFormDialog
                open={folderAddOpen}
                onClose={() => setFolderAddOpen(false)}
                onChanged={onFoldersChanged}
            />
        </>
    );
}
