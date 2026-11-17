"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "use-intl";
import { LOCALES, LOCALE_LABEL } from "@/i18n/config";
import { useAppDispatch } from "@/store";
import { localeChanged } from "@/store/prefs-slice";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("header");
  const locale = useLocale();
  const dispatch = useAppDispatch();

  return (
    <div className={clsx("locale-switcher", className)} role="group" aria-label={t("language")}>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          className={clsx(
            "locale-switcher__option",
            option === locale && "locale-switcher__option--active",
          )}
          aria-pressed={option === locale}
          onClick={() => dispatch(localeChanged(option))}
        >
          {LOCALE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
