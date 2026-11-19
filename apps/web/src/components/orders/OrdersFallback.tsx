"use client";

import { useTranslations } from "use-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList } from "@/components/ui/StateMessage";

export function OrdersFallback() {
  const t = useTranslations("orders");
  return (
    <>
      <PageHeader title={t("title")} addLabel={t("add")} />
      <div className="orders">
        <SkeletonList count={4} height={72} />
      </div>
    </>
  );
}
