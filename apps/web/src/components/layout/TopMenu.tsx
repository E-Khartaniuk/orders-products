import { Clock } from "./Clock";
import { Logo } from "./Logo";
import { SearchField } from "./SearchField";
import { SessionsCounter } from "./SessionsCounter";
import { UserMenu } from "./UserMenu";

export function TopMenu() {
  return (
    <header className="top-menu">
      <div className="top-menu__inner">
        <Logo />
        <SearchField />
        <div className="top-menu__meta">
          <SessionsCounter />
          <Clock />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
