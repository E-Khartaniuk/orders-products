"use client";

import { useTranslations } from "use-intl";
import { useAppSelector } from "@/store";
import { useLogoutMutation } from "@/store/api";

export function UserMenu() {
  const t = useTranslations("header");
  const user = useAppSelector((state) => state.auth.user);
  const [logout, { isLoading }] = useLogoutMutation();

  if (!user) return null;

  return (
    <div className="top-menu__user">
      <span className="top-menu__user-name" title={user.email}>
        {user.name}
      </span>
      <button
        type="button"
        className="top-menu__logout"
        onClick={() => logout()}
        disabled={isLoading}
        aria-label={t("logout")}
        title={t("logout")}
      >
        <i className="bi bi-box-arrow-right" aria-hidden="true" />
      </button>
    </div>
  );
}
