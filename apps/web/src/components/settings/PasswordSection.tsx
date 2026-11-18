"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "use-intl";
import type { z } from "zod";
import { FormField, fieldA11y } from "@/components/ui/FormField";
import {
  createPasswordFormSchema,
  type PasswordFormSchema,
  type PasswordFormValues,
} from "@/lib/profile-schemas";
import { useApiErrorParser } from "@/lib/use-api-error";
import { useSchema } from "@/lib/use-schema";
import { useChangePasswordMutation } from "@/store/api";

const EMPTY: PasswordFormValues = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordSection() {
  const t = useTranslations("settings.password");
  const tc = useTranslations("common");
  const parseError = useApiErrorParser();
  const schema = useSchema(createPasswordFormSchema);
  const [changePassword] = useChangePasswordMutation();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues, unknown, z.output<PasswordFormSchema>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: EMPTY,
  });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setSaved(false);
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      reset(EMPTY);
      setSaved(true);
    } catch (error) {
      const parsed = parseError(error, t("error"));
      if (parsed.details.some((detail) => detail.path === "currentPassword")) {
        setError("currentPassword", { message: t("wrongCurrent") });
        return;
      }
      setError("root", { message: parsed.status === 429 ? t("tooMany") : parsed.message });
    }
  });

  const err = (name: keyof PasswordFormValues) => errors[name]?.message;

  return (
    <section className="settings__section" aria-labelledby="settings-password">
      <h2 id="settings-password" className="settings__title">
        {t("title")}
      </h2>
      <p className="settings__hint">{t("description")}</p>
      <form className="settings__form" noValidate onSubmit={onSubmit}>
        <FormField
          id="password-current"
          label={t("current")}
          required
          error={err("currentPassword")}
        >
          <input
            type="password"
            autoComplete="current-password"
            {...fieldA11y("password-current", err("currentPassword"))}
            {...register("currentPassword")}
          />
        </FormField>
        <FormField
          id="password-new"
          label={t("new")}
          required
          error={err("newPassword")}
          hint={t("hint")}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...fieldA11y("password-new", err("newPassword"), { hasHint: true })}
            {...register("newPassword", { deps: ["confirmPassword"] })}
          />
        </FormField>
        <FormField
          id="password-confirm"
          label={t("confirm")}
          required
          error={err("confirmPassword")}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...fieldA11y("password-confirm", err("confirmPassword"))}
            {...register("confirmPassword")}
          />
        </FormField>
        {errors.root?.message && (
          <p className="form__error" role="alert">
            {errors.root.message}
          </p>
        )}
        <div className="settings__actions">
          <button type="submit" className="settings__button" disabled={isSubmitting}>
            {isSubmitting ? tc("saving") : t("submit")}
          </button>
          {saved && (
            <span className="settings__saved" role="status">
              <i className="bi bi-check-circle-fill" aria-hidden="true" /> {t("saved")}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
