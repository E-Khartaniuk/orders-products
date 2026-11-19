"use client";

import clsx from "clsx";
import { useTranslations } from "use-intl";
import type { ProductStatus as Status } from "@/types/api";

const MODIFIER: Record<Status, string> = {
  FREE: "free",
  IN_REPAIR: "repair",
  IN_USE: "in-use",
};

export function StatusDot({ status }: { status: Status }) {
  const t = useTranslations("status");
  return (
    <span
      className={clsx("status-dot", `status-dot--${MODIFIER[status]}`)}
      role="img"
      aria-label={t(status)}
    />
  );
}

export function StatusLabel({ status }: { status: Status }) {
  const t = useTranslations("status");
  return (
    <span className={clsx("status-label", `status-label--${MODIFIER[status]}`)}>{t(status)}</span>
  );
}
