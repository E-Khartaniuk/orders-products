"use client";

import { useAppSelector } from "@/store";
import { useLogoutMutation } from "@/store/api";

export function UserMenu() {
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
        aria-label="Выйти"
        title="Выйти"
      >
        <i className="bi bi-box-arrow-right" aria-hidden="true" />
      </button>
    </div>
  );
}
