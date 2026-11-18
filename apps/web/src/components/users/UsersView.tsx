"use client";

import { useTranslations } from "use-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { StateMessage } from "@/components/ui/StateMessage";
import { useDocumentTitle } from "@/i18n/use-document-title";

export function UsersView() {
  const t = useTranslations("users");
  useDocumentTitle(t("title"));

  return (
    <>
      <PageHeader title={t("title")} />
      <StateMessage variant="empty" message={t("placeholder")} />
    </>
  );
}
