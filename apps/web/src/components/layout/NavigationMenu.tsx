"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "use-intl";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAppSelector } from "@/store";

const LINKS = [
  { href: "/orders", key: "orders" },
  { href: "/products", key: "products" },
  { href: "/users", key: "users" },
  { href: "/settings", key: "settingsPage" },
  { href: "/dashboard", key: "dashboard" },
] as const;

function NavLinks({ pathname }: { pathname: string | null }) {
  const t = useTranslations("nav");
  return (
    <ul className="nav-menu__list">
      {LINKS.map(({ href, key }) => {
        const active = pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
        return (
          <li key={href}>
            <Link
              href={href}
              className={clsx("nav-menu__link", active && "nav-menu__link--active")}
              aria-current={active ? "page" : undefined}
            >
              {t(key)}
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
  const t = useTranslations("nav");
  const avatarUrl = useAppSelector((state) => state.auth.user?.avatarUrl);
  return (
    <nav className="nav-menu" aria-label={t("label")}>
      <div className="nav-menu__profile">
        <UserAvatar
          className="nav-menu__avatar"
          src={avatarUrl}
          alt={t("avatar")}
          size={96}
          priority
        />
        <Link href="/settings" className="nav-menu__settings" aria-label={t("settings")}>
          <i className="bi bi-gear-fill" aria-hidden="true" />
        </Link>
      </div>
      <Suspense fallback={<NavLinks pathname={null} />}>
        <ActiveNavLinks />
      </Suspense>
    </nav>
  );
}
