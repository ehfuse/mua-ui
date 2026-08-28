/** @ehfuse/mua-ui 공개 export 배럴이다. */

// 타입
export type * from "./types/config";
export type { MuaModalControl } from "./types/modal";
export type * from "./models/types";

// Provider + 횡단 관심사 훅
export {
    MuaProvider,
    useMuaAccount,
    useMuaConfig,
    useMuaFileUploadBox,
    useMuaFormDialog,
    useMuaIsAdmin,
    useMuaLogined,
    useMuaSaveBlob,
    type MuaProviderProps,
} from "./MuaProvider";
export { setMuaSubPageBridge } from "./internal/subPageBridge";

// 화면 — 라우트 진입점 / 레이아웃 / 모바일 서브페이지 본문
export { default as MailRouteEntry } from "./views/MailRouteEntry";
export { default as MailLayout } from "./views/Layout";
export { default as ContactsPage } from "./views/ContactsPage";
export {
    MailDraftSubPage,
    MailContactsSubPage,
    MailFolderSubPage,
    MailInboxSubPage,
    MailSentSubPage,
    MailSpamSubPage,
    MailStarredSubPage,
    MailTrashSubPage,
} from "./views/MailSubPages";

// 셸(사이드바) 연동 — 계정 목록/배지, 서비스 아이콘, 경로, 서브페이지 열기
export { useMailSidebarAccounts } from "./hooks/useMailSidebarAccounts";
export { useMailSidebarFolders } from "./hooks/useMailSidebarFolders";
export { requestMailFoldersManage } from "./internal/foldersManageRequest";
export { MailProviderIcon } from "./views/components/MailProviderIcon";
export { findMailProvider, type MailProviderInfo, type MailProviderKey } from "./utils/providers";
export {
    CODEMARKET_MAIL_INBOX_PATH,
    mailAccountInboxPath,
    mailContactsPath,
    mailFolderPath,
    mailInboxPath,
} from "./utils/paths";
export {
    MAIL_FOLDER_LABELS,
    MAIL_SUB_PAGE_ID_BY_FOLDER,
    isMailSubPageId,
    openMailFolderSubPage,
    openMailSubPage,
    useMailSubPageAccountSeq,
    useMailSubPageFolderSeq,
    type MailSubPageKey,
} from "./models/subPage";
export { toRouteFolder } from "./utils/routeFolder";

// 상태/컨트롤러/API (앱이 직접 다룰 일이 있을 때)
export { MAIL_STATE_ID, useMailController } from "./controllers/mailController";
export { useComposeController } from "./controllers/composeController";
export { useMailAccountFormController } from "./controllers/mailAccountFormController";
export { useContactFormController } from "./controllers/contactFormController";
export { defaultMailState } from "./models/defaults";
export { mailApi, unwrap } from "./apis/mailApi";
export { useMailRealtime, type MailChangedData } from "./apis/useMailRealtime";
