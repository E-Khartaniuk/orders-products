"use client";

import { useTranslations } from "use-intl";

export function Splash({ label }: { label?: string }) {
  const t = useTranslations("common");
  return (
    <div className="splash" role="status" aria-live="polite">
      <span className="splash__spinner" aria-hidden="true" />
      <span className="visually-hidden">{label ?? t("loading")}</span>
    </div>
  );
}
