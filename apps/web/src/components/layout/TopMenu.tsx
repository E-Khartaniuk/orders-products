import { Clock } from "./Clock";
import { Logo } from "./Logo";
import { SearchField } from "./SearchField";
import { SessionsCounter } from "./SessionsCounter";

export function TopMenu() {
  return (
    <header className="top-menu">
      <div className="top-menu__inner">
        <Logo />
        <SearchField />
        <div className="top-menu__meta">
          <SessionsCounter />
          <Clock />
        </div>
      </div>
    </header>
  );
}
