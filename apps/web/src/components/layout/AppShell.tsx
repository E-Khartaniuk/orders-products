"use client";

import type { ReactNode } from "react";
import { useTranslations } from "use-intl";
import { NavigationMenu } from "./NavigationMenu";
import { TopMenu } from "./TopMenu";

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  return (
    <div className="app-shell">
      <a href="#main" className="visually-hidden-focusable">
        {t("skipToContent")}
      </a>
      <TopMenu />
      <aside className="app-shell__sidebar">
        <NavigationMenu />
      </aside>
      <main id="main" className="app-shell__main">
        {children}
      </main>
    </div>
  );
}
