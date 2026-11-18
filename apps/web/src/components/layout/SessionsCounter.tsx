"use client";

import clsx from "clsx";
import { useTranslations } from "use-intl";
import { useAppSelector } from "@/store";

export function SessionsCounter() {
  const t = useTranslations("header");
  const { count, connected } = useAppSelector((state) => state.sessions);

  return (
    <div
      className={clsx("top-menu__sessions", connected && "top-menu__sessions--online")}
      title={t("onlineHint")}
      aria-live="polite"
    >
      <span className="top-menu__sessions-dot" aria-hidden="true" />
      <span className="top-menu__sessions-label">{t("online")}</span>
      <span className="top-menu__sessions-count">{connected && count !== null ? count : "—"}</span>
    </div>
  );
}
