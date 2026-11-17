import type { ReactNode } from "react";
import { NavigationMenu } from "./NavigationMenu";
import { TopMenu } from "./TopMenu";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a href="#main" className="visually-hidden-focusable">
        Перейти к содержимому
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
