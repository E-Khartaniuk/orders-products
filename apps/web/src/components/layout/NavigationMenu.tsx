"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/orders", label: "Приход" },
  { href: "/products", label: "Продукты" },
] as const;

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="nav-menu__list">
      {LINKS.map(({ href, label }) => {
        const active = pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
        return (
          <li key={href}>
            <Link
              href={href}
              className={clsx("nav-menu__link", active && "nav-menu__link--active")}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

export function NavigationMenu() {
  return (
    <nav className="nav-menu" aria-label="Основная навигация">
      <div className="nav-menu__profile">
        <Image
          className="nav-menu__avatar"
          src="/images/avatar.svg"
          alt="Аватар пользователя"
          width={96}
          height={96}
          priority
        />
        <button type="button" className="nav-menu__settings" aria-label="Настройки профиля">
          <i className="bi bi-gear-fill" aria-hidden="true" />
        </button>
      </div>
      <Suspense fallback={<NavLinks pathname={null} />}>
        <ActiveNavLinks />
      </Suspense>
    </nav>
  );
}
