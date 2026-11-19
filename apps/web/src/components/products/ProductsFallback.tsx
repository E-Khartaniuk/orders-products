"use client";

import { useTranslations } from "use-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList } from "@/components/ui/StateMessage";

export function ProductsFallback() {
  const t = useTranslations("products");
  return (
    <>
      <PageHeader title={t("title")} />
      <SkeletonList count={6} height={50} />
    </>
  );
}
