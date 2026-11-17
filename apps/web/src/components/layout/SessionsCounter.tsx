"use client";

import clsx from "clsx";
import { useAppSelector } from "@/store";

export function SessionsCounter() {
  const { count, connected } = useAppSelector((state) => state.sessions);

  return (
    <div
      className={clsx("top-menu__sessions", connected && "top-menu__sessions--online")}
      title="Активные вкладки приложения"
      aria-live="polite"
    >
      <span className="top-menu__sessions-dot" aria-hidden="true" />
      <span>Онлайн:</span>
      <span className="top-menu__sessions-count">{connected && count !== null ? count : "—"}</span>
    </div>
  );
}
