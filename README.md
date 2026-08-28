# @ehfuse/mua-ui

React/MUI 메일 사용자 에이전트(MUA) UI — 외부 IMAP/POP3 계정 수신 · SMTP 발신 · 받은/보낸/중요/임시보관/스팸/휴지통 · 작성 다이얼로그 · 모바일 서브페이지.
백엔드는 codeshop AS `plugins/mua`(`/v1/mua/*`)와 짝을 이룬다.

## 설치

```bash
npm install @ehfuse/mua-ui
```

peer: react, react-dom, react-router-dom, @mui/material, @mui/icons-material, @emotion/*, dompurify, entity-client,
@ehfuse/forma, @ehfuse/alerts, @ehfuse/editor, @ehfuse/mui-form-controls, @ehfuse/mui-form-dialog,
@ehfuse/mui-dashboard-layout, @ehfuse/mui-virtual-data-table

## 사용

앱에 매인 것(로그인 계정·FormDialog·첨부 선택 박스·파일 저장·모바일 셸)은 `MuaProvider` 로 주입한다. 없어도 기본값으로 동작한다.

```tsx
import { MuaProvider, MailRouteEntry, type MuaConfig } from "@ehfuse/mua-ui";

const config: MuaConfig = {
    account,                       // { seq, name, rbac_role } — 미지정이면 비로그인
    FormDialogComponent: FormDialog, // 앱 공통 FormDialog(선택)
    FileUploadBoxComponent: FileUploadBox, // 첨부 선택 박스(선택)
    saveBlob,                      // 앱 WebView 저장 브리지(선택)
    inboxPath: "/codemarket/mail", // 받은편지함 라우트(기본값)
    mobile: {
        CardListLayout,            // 모바일 카드 목록 래퍼(선택)
        DetailDialog,              // 모바일 상세 슬라이드(선택)
        subPage: { open, setTitle, setCount }, // 전역 서브페이지 호스트 브리지(선택)
    },
};

<MuaProvider config={config}>
    <MailRouteEntry />
</MuaProvider>
```

라우트: `mail`(받은편지함) · `mail/account/:accountSeq`(계정별 받은편지함) · `mail/:folder`(sent/starred/draft/spam/trash).
모바일 서브페이지 본문: `MailInboxSubPage` 등 6종. 사이드바 연동: `useMailSidebarAccounts(enabled)`, `MailProviderIcon`, `mailAccountInboxPath`, `openMailSubPage`.

## 라이선스

MIT
