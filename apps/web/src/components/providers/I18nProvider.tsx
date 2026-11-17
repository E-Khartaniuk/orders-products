"use client";

import { useEffect, type ReactNode } from "react";
import { IntlProvider } from "use-intl";
import { MESSAGES, TIME_ZONE } from "@/i18n/config";
import { useAppSelector } from "@/store";

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useAppSelector((state) => state.prefs.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <IntlProvider locale={locale} messages={MESSAGES[locale]} timeZone={TIME_ZONE}>
      {children}
    </IntlProvider>
  );
}
