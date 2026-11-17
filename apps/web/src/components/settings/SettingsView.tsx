"use client";

import { useTranslations } from "use-intl";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDocumentTitle } from "@/i18n/use-document-title";
import { useAppSelector } from "@/store";
import { PasswordSection } from "./PasswordSection";
import { ProfileSection } from "./ProfileSection";

export function SettingsView() {
  const t = useTranslations("settings");
  useDocumentTitle(t("title"));
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="settings">
        <ProfileSection user={user} />
        <PasswordSection />
        <section className="settings__section" aria-labelledby="settings-interface">
          <h2 id="settings-interface" className="settings__title">
            {t("interface.title")}
          </h2>
          <div className="settings__row">
            <span className="settings__label">{t("interface.language")}</span>
            <LocaleSwitcher />
          </div>
        </section>
      </div>
    </>
  );
}
