import type { ReactElement, ReactNode } from "react";
import type { ListLayoutProps } from "@ehfuse/mui-dashboard-layout";
import type { MailController } from "../controllers/mailController";
interface HeaderConfigProps {
    controller: MailController;
    left?: ReactElement;
    right?: ReactElement;
    toolbar?: ReactNode;
    isMobile?: boolean;
}
export declare function useHeaderConfig({ controller, left, right, toolbar, isMobile, }: HeaderConfigProps): NonNullable<ListLayoutProps["header"]>;
export {};
